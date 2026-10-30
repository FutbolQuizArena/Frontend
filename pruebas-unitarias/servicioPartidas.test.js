import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { solicitarApi } from '../src/servicios/clienteApi.js'
import {
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

  it('propaga el error de categorías y rechaza un listado vacío', async () => {
    vi.mocked(solicitarApi).mockRejectedValueOnce(new Error('sin servidor')).mockResolvedValueOnce([])
    await expect(obtenerCategoriasDisponibles()).rejects.toThrow('sin servidor')
    await expect(obtenerCategoriasDisponibles()).rejects.toThrow('No hay categorías disponibles')
    expect(solicitarApi).toHaveBeenCalledWith('/api/partidas/categorias')
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
      id: 5, categoria_nombre: 'Historia', categoria_id: 2, estado: 'EN_CURSO',
      preguntas: [{ id: 7, orden: 1, enunciado: 'Pregunta', opcion_a: 'A1', opcion_b: 'B1', opcion_c: 'C1', opcion_d: 'D1' }],
    })
    const partida = await iniciarPartidaIndividual()
    expect(partida).toEqual({
      id: 5, categoriaId: 2, categoriaNombre: 'Historia', estado: 'EN_CURSO',
      preguntas: [{
        id: '7', orden: 1, categoria: 'Historia', enunciado: 'Pregunta',
        opciones: [{ id: 'A', texto: 'A1' }, { id: 'B', texto: 'B1' }, { id: 'C', texto: 'C1' }, { id: 'D', texto: 'D1' }],
      }],
    })
    expect(solicitarApi).toHaveBeenCalledWith('/api/partidas/individual', { metodo: 'POST' })
  })

  it('propaga el error al iniciar sin fabricar una partida', async () => {
    vi.mocked(solicitarApi).mockRejectedValue(new Error('sin servidor'))
    await expect(iniciarPartidaIndividual()).rejects.toThrow('sin servidor')
  })

  it('rechaza una partida sin preguntas', async () => {
    vi.mocked(solicitarApi).mockResolvedValue({ id: 1, preguntas: null })
    await expect(iniciarPartidaIndividual()).rejects.toThrow('El servidor no devolvió una partida con preguntas')
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

  it('propaga el error al enviar una respuesta y envía null cuando vence el tiempo', async () => {
    vi.mocked(solicitarApi).mockRejectedValueOnce(new Error('sin servidor')).mockResolvedValueOnce({ es_correcta: false, puntaje_obtenido: 0 })
    await expect(registrarRespuestaPartida(2, 7, 'A', 3)).rejects.toThrow('sin servidor')
    await expect(registrarRespuestaPartida(2, 7, null, 15)).resolves.toMatchObject({ esCorrecta: false, puntajeObtenido: 0 })
    expect(solicitarApi).toHaveBeenLastCalledWith('/api/partidas/preguntas/7/respuesta', {
      metodo: 'POST', datos: { opcion_seleccionada: null, tiempo_respuesta_segundos: 15 },
    })
  })

  it('mapea el resultado final y propaga los errores de consulta', async () => {
    vi.mocked(solicitarApi).mockResolvedValueOnce({ partida_id: '5', puntaje_final: '250', fecha_fin: '2026-10-23' })
    await expect(obtenerResultadoPartida('5')).resolves.toEqual({
      partidaId: 5, puntajeFinal: 250, fechaFin: '2026-10-23', finalizada: true,
    })
    vi.mocked(solicitarApi).mockRejectedValueOnce(new Error('sin servidor'))
    await expect(obtenerResultadoPartida('5')).rejects.toThrow('sin servidor')
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
