import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { solicitarApi } from '../src/servicios/clienteApi.js'
import {
  categoriasPartidas,
  finalizarPartidaIndividual,
  iniciarPartidaIndividual,
  obtenerCategoriaAleatoria,
  obtenerCategoriasDisponibles,
  obtenerPreguntasPorCategoria,
  obtenerResultadoPartida,
  registrarRespuestaPartida,
} from '../src/servicios/servicioPartidas.js'

vi.mock('../src/servicios/clienteApi.js', () => ({ solicitarApi: vi.fn() }))

beforeEach(() => {
  vi.resetAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('categorías de partidas', () => {
  it('normaliza categorías del backend e ignora valores vacíos', async () => {
    vi.mocked(solicitarApi).mockResolvedValue({ items: ['Historia', null, { categoria_id: 8, titulo: 'Clubes', color: '#f00' }] })
    await expect(obtenerCategoriasDisponibles()).resolves.toEqual([
      { nombre: 'Historia' },
      { id: 8, nombre: 'Clubes', color: '#f00' },
    ])
  })

  it('prueba la ruta alternativa y usa categorías locales si ambas fallan', async () => {
    vi.mocked(solicitarApi)
      .mockRejectedValueOnce(new Error('sin ruta'))
      .mockResolvedValueOnce({ categorias: ['Reglas'] })
    await expect(obtenerCategoriasDisponibles()).resolves.toEqual([{ nombre: 'Reglas' }])
    expect(solicitarApi).toHaveBeenNthCalledWith(2, '/api/partidas/categorias', { metodo: 'GET' })

    vi.mocked(solicitarApi).mockRejectedValue(new Error('sin servidor'))
    await expect(obtenerCategoriasDisponibles()).resolves.toEqual(categoriasPartidas.map((nombre) => ({ nombre })))
  })

  it('elige una categoría con un índice válido y devuelve null si no hay ninguna', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.75)
    expect(obtenerCategoriaAleatoria(['A', { nombre: 'B' }])).toEqual({ nombre: 'B' })
    expect(obtenerCategoriaAleatoria([])).toBeNull()
    expect(obtenerCategoriaAleatoria(null)).toBeNull()
  })
})

describe('partida individual', () => {
  it('mapea las preguntas recibidas del backend', async () => {
    vi.mocked(solicitarApi).mockResolvedValue({
      id: '5', categoria_id: 2, estado: 'EN_CURSO',
      preguntas: [{ id: 7, orden: 1, enunciado: 'Pregunta', opcion_a: 'A1', opcion_b: 'B1', opcion_c: 'C1', opcion_d: 'D1' }],
    })
    const partida = await iniciarPartidaIndividual()
    expect(partida).toEqual({
      id: 5, categoriaId: 2, estado: 'EN_CURSO',
      preguntas: [{
        id: '7', orden: 1, categoria: 'Aleatoria', enunciado: 'Pregunta',
        opciones: [{ id: 'A', texto: 'A1' }, { id: 'B', texto: 'B1' }, { id: 'C', texto: 'C1' }, { id: 'D', texto: 'D1' }],
      }],
    })
    expect(solicitarApi).toHaveBeenCalledWith('/api/partidas/individual', { metodo: 'POST', datos: {} })
  })

  it('genera preguntas independientes si el backend no responde', async () => {
    vi.mocked(solicitarApi).mockRejectedValue(new Error('sin servidor'))
    const partida = await iniciarPartidaIndividual(6, 'Historia')
    expect(partida.estado).toBe('fallback')
    expect(partida.preguntas).toHaveLength(6)
    expect(partida.preguntas[0]).toMatchObject({ id: '1', orden: 1, categoria: 'Historia' })
    partida.preguntas[0].opciones[0].texto = 'Editada'
    expect(partida.preguntas[5].opciones[0].texto).not.toBe('Editada')
  })

  it('genera al menos una pregunta para una cantidad inválida', async () => {
    vi.mocked(solicitarApi).mockResolvedValue({ id: 1, preguntas: null })
    expect((await iniciarPartidaIndividual(0)).preguntas).toHaveLength(1)
  })

  it('normaliza y envía la respuesta, y usa la puntuación del servidor', async () => {
    vi.mocked(solicitarApi).mockResolvedValue({ es_correcta: true, puntaje_obtenido: '150' })
    await expect(registrarRespuestaPartida(2, 'p 1', ' b ', '8')).resolves.toMatchObject({
      opcionSeleccionada: 'B', tiempoEmpleado: 8, esCorrecta: true, puntajeObtenido: 150,
    })
    expect(solicitarApi).toHaveBeenCalledWith('/api/partidas/preguntas/p%201/respuesta', {
      metodo: 'POST', datos: { opcion_seleccionada: 'B', tiempo_respuesta_segundos: 8 },
    })
  })

  it('calcula el resultado de demostración cuando falla registrar la respuesta', async () => {
    vi.mocked(solicitarApi).mockRejectedValue(new Error('sin servidor'))
    await expect(registrarRespuestaPartida(2, 0, 'a', null)).resolves.toMatchObject({ esCorrecta: true, puntajeObtenido: 100 })
    await expect(registrarRespuestaPartida(2, 0, 'c', 4)).resolves.toMatchObject({ esCorrecta: false, puntajeObtenido: 0 })
  })

  it('mapea el resultado final y usa un resultado local si falla la consulta', async () => {
    vi.mocked(solicitarApi).mockResolvedValueOnce({ partida_id: '5', puntaje_final: '250', fecha_fin: '2026-10-23' })
    await expect(obtenerResultadoPartida('5')).resolves.toEqual({
      partidaId: 5, puntajeFinal: 250, fechaFin: '2026-10-23', finalizada: true,
    })
    vi.mocked(solicitarApi).mockRejectedValueOnce(new Error('sin servidor'))
    await expect(obtenerResultadoPartida('5')).resolves.toMatchObject({ partidaId: 5, puntajeFinal: 0, finalizada: true })
  })

  it('suma solamente las respuestas correctas', () => {
    expect(finalizarPartidaIndividual(4, [
      { esCorrecta: true, puntajeObtenido: 100 },
      { esCorrecta: false, puntajeObtenido: 200 },
      { esCorrecta: true, puntajeObtenido: 50 },
    ])).toEqual({ idPartida: 4, puntaje: 150, totalRespuestas: 3, respuestasCorrectas: 2, finalizada: true })
    expect(finalizarPartidaIndividual(4).puntaje).toBe(0)
    expect(obtenerPreguntasPorCategoria(1)).toEqual([])
  })
})
