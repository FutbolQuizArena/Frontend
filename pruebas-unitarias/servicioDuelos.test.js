import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { solicitarApi } from '../src/servicios/clienteApi.js'
import {
  buscarRivalDuelo, cancelarBusquedaDuelo, consultarEstadoDuelo,
  generarAlias, generarAvatar, obtenerPreguntasDuelo, obtenerResultadoDuelo,
  registrarRespuestaDuelo, simularRespuestaRival, solicitarRevanchaDuelo,
} from '../src/servicios/servicioDuelos.js'

vi.mock('../src/servicios/clienteApi.js', () => ({ solicitarApi: vi.fn() }))

beforeEach(() => {
  vi.resetAllMocks()
  window.sessionStorage.clear()
})

afterEach(() => vi.restoreAllMocks())

const duelo = {
  id: 12, estado: 'EN_CURSO', categoria_nombre: 'Historia', categoria_id: 2,
  jugador1_id: 3, jugador1_nombre: 'Ana Pérez', puntaje_jugador1: 100, aciertos_jugador1: 2,
  jugador2_id: 4, jugador2_nombre: 'Leo Gómez', puntaje_jugador2: 50, aciertos_jugador2: 1,
  preguntas: [{ id: 6, orden: 1, enunciado: 'Pregunta', opcion_a: 'A', opcion_b: 'B', opcion_c: 'C', opcion_d: 'D' }],
}

describe('duelos online', () => {
  it('crea alias y avatar para nombres comunes y vacíos', () => {
    expect(generarAlias('Ana Pérez')).toBe('Ana')
    expect(generarAlias(null)).toBe('Jugador')
    expect(generarAvatar('Ana Pérez')).toBe('AP')
    expect(generarAvatar('Leo')).toBe('LE')
    expect(generarAvatar(null)).toBe('JQ')
  })

  it('busca rival, adapta los jugadores y guarda el duelo', async () => {
    vi.mocked(solicitarApi).mockResolvedValue(duelo)
    const resultado = await buscarRivalDuelo({ id: 3, nombre: 'Ana Pérez', puntajeTotal: 800 })
    expect(resultado).toMatchObject({
      id: 12, estado: 'EN_CURSO', categoriaNombre: 'Historia',
      jugadorLocal: { id: 3, nombre: 'Ana Pérez', puntuacion: 800 },
      rival: { id: 4, nombre: 'Leo Gómez', puntuacion: 50 },
      preguntas: [{ id: '6', categoria: 'Historia', enunciado: 'Pregunta' }],
    })
    expect(JSON.parse(window.sessionStorage.getItem('dueloActual')).id).toBe(12)
    expect(solicitarApi).toHaveBeenCalledWith('/api/duelos/online', { metodo: 'POST', datos: {} })
  })

  it('reconoce al segundo jugador como usuario local', async () => {
    vi.mocked(solicitarApi).mockResolvedValue(duelo)
    const resultado = await buscarRivalDuelo({ id: 4, nombre: 'Leo Gómez' })
    expect(resultado.jugadorLocal).toMatchObject({ nombre: 'Leo Gómez', id: 4 })
    expect(resultado.rival).toMatchObject({ nombre: 'Ana Pérez', id: 3, puntuacion: 100 })
  })

  it('deja rival nulo si la partida todavía está pendiente', async () => {
    vi.mocked(solicitarApi).mockResolvedValue({ id: 8, estado: 'PENDIENTE_RIVAL' })
    const resultado = await buscarRivalDuelo({ id: 3, nombre: 'Ana' })
    expect(resultado.rival).toBeNull()
    expect(resultado.preguntas).toHaveLength(1)
  })

  it('crea un duelo de respaldo si falla la búsqueda y permite cancelarlo', async () => {
    vi.mocked(solicitarApi).mockRejectedValue(new Error('sin servidor'))
    const resultado = await buscarRivalDuelo()
    expect(resultado).toMatchObject({ estado: 'PENDIENTE_RIVAL', modalidad: 'online', rival: null })
    expect(window.sessionStorage.getItem('dueloActual')).not.toBeNull()
    expect(cancelarBusquedaDuelo()).toBe(true)
    expect(window.sessionStorage.getItem('dueloActual')).toBeNull()
  })

  it('consulta el estado desde los dos puntos de vista', async () => {
    vi.mocked(solicitarApi).mockResolvedValue(duelo)
    await expect(consultarEstadoDuelo(null)).resolves.toBeNull()
    const primero = await consultarEstadoDuelo(12, { id: 3, nombre: 'Ana' })
    const segundo = await consultarEstadoDuelo(12, { id: 4, nombre: 'Leo' })
    expect(primero).toMatchObject({ jugadorLocal: { id: 3, puntuacion: 100 }, rival: { id: 4, puntuacion: 50 } })
    expect(segundo).toMatchObject({ jugadorLocal: { id: 4, puntuacion: 50 }, rival: { id: 3, puntuacion: 100 } })
    expect(solicitarApi).toHaveBeenCalledWith('/api/duelos/12')
  })

  it('no inventa un rival si el estado sigue pendiente o falla el servidor', async () => {
    vi.mocked(solicitarApi).mockResolvedValueOnce({ ...duelo, estado: 'PENDIENTE_RIVAL' }).mockRejectedValueOnce(new Error('sin servidor'))
    expect((await consultarEstadoDuelo(12)).rival).toBeNull()
    await expect(consultarEstadoDuelo(12)).resolves.toBeNull()
  })

  it('determina victoria, derrota, empate y resultado pendiente', async () => {
    vi.mocked(solicitarApi)
      .mockResolvedValueOnce({ ...duelo, estado: 'FINALIZADO', numero_ganador: 1 })
      .mockResolvedValueOnce({ ...duelo, estado: 'FINALIZADO', numero_ganador: 1 })
      .mockResolvedValueOnce({ ...duelo, estado: 'FINALIZADO', es_empate: true })
      .mockResolvedValueOnce(duelo)
    const primero = await obtenerResultadoDuelo(12, { id: 3, nombre: 'Ana' })
    expect(primero).toMatchObject({ ganador: 'local', resultadoTexto: '¡VICTORIA!', resumen: { diferencia: 50, porcentajeLocal: 20 } })
    expect((await obtenerResultadoDuelo(12, { id: 4 })).ganador).toBe('rival')
    expect((await obtenerResultadoDuelo(12, { id: 3 })).ganador).toBe('empate')
    expect((await obtenerResultadoDuelo(12, { id: 3 })).ganador).toBe('pendiente')
  })

  it('entrega un resultado de respaldo si falla la consulta', async () => {
    vi.mocked(solicitarApi).mockRejectedValue(new Error('sin servidor'))
    await expect(obtenerResultadoDuelo(12, { nombre: 'Ana' })).resolves.toMatchObject({
      idPartida: 12, estado: 'PENDIENTE', jugadorLocal: { nombre: 'Ana' }, resultadoTexto: 'PENDIENTE',
    })
  })

  it('solicita una nueva búsqueda aun si el backend falla', async () => {
    vi.mocked(solicitarApi).mockResolvedValueOnce({ id: 15 }).mockRejectedValueOnce(new Error('sin servidor'))
    await expect(solicitarRevanchaDuelo(12)).resolves.toMatchObject({ idDuelo: 15, solicitudEnviada: true })
    await expect(solicitarRevanchaDuelo(12)).resolves.toMatchObject({ idDuelo: 12, solicitudEnviada: true })
  })

  it('recupera las preguntas guardadas y reemplaza una categoría genérica', () => {
    window.sessionStorage.setItem('dueloActual', JSON.stringify({
      categoriaNombre: 'Historia', preguntas: [{ enunciado: 'Pregunta', categoria: 'Aleatoria' }],
    }))
    expect(obtenerPreguntasDuelo(12)[0]).toMatchObject({ id: '12-1', categoria: 'Historia' })
    window.sessionStorage.setItem('dueloActual', 'JSON inválido')
    expect(obtenerPreguntasDuelo(12)[0]).toMatchObject({ categoria: 'Fútbol' })
  })

  it('normaliza respuestas del backend y usa un resultado local si falla', async () => {
    vi.mocked(solicitarApi).mockResolvedValueOnce({ es_correcta: true, puntaje_obtenido: '80' })
      .mockRejectedValueOnce(new Error('sin servidor'))
    await expect(registrarRespuestaDuelo(12, 6, 'b', '4')).resolves.toMatchObject({
      opcionSeleccionada: 'B', tiempoEmpleado: 4, esCorrecta: true, puntajeObtenido: 80,
    })
    expect(solicitarApi).toHaveBeenCalledWith('/api/duelos/preguntas/6/respuesta', {
      metodo: 'POST', datos: { opcion_seleccionada: 'B', tiempo_respuesta_segundos: 4 },
    })
    await expect(registrarRespuestaDuelo(12, 6, 'A', 5)).resolves.toMatchObject({ esCorrecta: true, puntajeObtenido: 100 })
    expect(registrarRespuestaDuelo(12, 'demo', 'D', 0)).toMatchObject({ registrado: true, puntajeObtenido: 0 })
  })

  it('simula respuestas de rival con valores controlados', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.9).mockReturnValueOnce(0.2)
    expect(simularRespuestaRival(6)).toEqual({ idPregunta: 6, correcta: true, opcionSeleccionada: 'A', tiempoEmpleado: 8 })
  })
})
