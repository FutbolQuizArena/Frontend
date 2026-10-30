import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { solicitarApi } from '../src/servicios/clienteApi.js'
import {
  buscarRivalDuelo, cancelarBusquedaDuelo, consultarEstadoDuelo,
  generarAlias, generarAvatar, obtenerPreguntasDuelo, obtenerResultadoDuelo,
  registrarRespuestaDuelo, solicitarRevanchaDuelo,
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
    vi.mocked(solicitarApi).mockResolvedValue({ ...duelo, id: 8, estado: 'PENDIENTE_RIVAL' })
    const resultado = await buscarRivalDuelo({ id: 3, nombre: 'Ana' })
    expect(resultado.rival).toBeNull()
    expect(resultado.preguntas).toHaveLength(1)
  })

  it('propaga el error de búsqueda sin guardar un duelo inexistente', async () => {
    vi.mocked(solicitarApi).mockRejectedValue(new Error('sin servidor'))
    await expect(buscarRivalDuelo()).rejects.toThrow('sin servidor')
    expect(window.sessionStorage.getItem('dueloActual')).toBeNull()
  })

  it('confirma la cancelación en el servidor antes de limpiar la espera', async () => {
    window.sessionStorage.setItem('dueloActual', JSON.stringify(duelo))
    vi.mocked(solicitarApi).mockResolvedValue({ id: 12, estado: 'FINALIZADA' })

    // La búsqueda local se elimina únicamente después de recibir la confirmación.
    await expect(cancelarBusquedaDuelo(12)).resolves.toMatchObject({ id: 12, estado: 'FINALIZADA' })
    expect(solicitarApi).toHaveBeenCalledWith('/api/duelos/12/cancelar', { metodo: 'POST' })
    expect(window.sessionStorage.getItem('dueloActual')).toBeNull()
  })

  it('conserva el duelo si la cancelación falla o falta su identificador', async () => {
    window.sessionStorage.setItem('dueloActual', JSON.stringify(duelo))
    vi.mocked(solicitarApi).mockRejectedValue(new Error('Ya se encontró rival'))

    // El ID guardado permite consultar el duelo cuando la API rechaza la cancelación.
    await expect(cancelarBusquedaDuelo(12)).rejects.toThrow('Ya se encontró rival')
    expect(window.sessionStorage.getItem('dueloActual')).not.toBeNull()
    await expect(cancelarBusquedaDuelo()).rejects.toThrow('No se pudo identificar la búsqueda')
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

  it('propaga el error al consultar un resultado', async () => {
    vi.mocked(solicitarApi).mockRejectedValue(new Error('sin servidor'))
    await expect(obtenerResultadoDuelo(12, { nombre: 'Ana' })).rejects.toThrow('sin servidor')
  })

  it('confirma la revancha únicamente cuando responde el servidor', async () => {
    vi.mocked(solicitarApi).mockResolvedValueOnce({ id: 15 }).mockRejectedValueOnce(new Error('sin servidor'))
    await expect(solicitarRevanchaDuelo(12)).resolves.toMatchObject({ idDuelo: 15, solicitudEnviada: true })
    await expect(solicitarRevanchaDuelo(12)).rejects.toThrow('sin servidor')
  })

  it('recupera las preguntas guardadas y reemplaza una categoría genérica', () => {
    window.sessionStorage.setItem('dueloActual', JSON.stringify({
      categoriaNombre: 'Historia', preguntas: [{ id: 6, enunciado: 'Pregunta', categoria: 'Aleatoria' }],
    }))
    expect(obtenerPreguntasDuelo(12)[0]).toMatchObject({ id: '6', categoria: 'Historia' })
    window.sessionStorage.setItem('dueloActual', 'JSON inválido')
    expect(obtenerPreguntasDuelo()).toEqual([])
  })

  it('normaliza respuestas del backend y propaga los errores de envío', async () => {
    vi.mocked(solicitarApi).mockResolvedValueOnce({ es_correcta: true, puntaje_obtenido: '80' })
      .mockRejectedValueOnce(new Error('sin servidor'))
    await expect(registrarRespuestaDuelo(12, 6, 'b', '4')).resolves.toMatchObject({
      opcionSeleccionada: 'B', tiempoEmpleado: 4, esCorrecta: true, puntajeObtenido: 80,
    })
    expect(solicitarApi).toHaveBeenCalledWith('/api/duelos/preguntas/6/respuesta', {
      metodo: 'POST', datos: { opcion_seleccionada: 'B', tiempo_respuesta_segundos: 4 },
    })
    await expect(registrarRespuestaDuelo(12, 6, 'A', 5)).rejects.toThrow('sin servidor')
    await expect(registrarRespuestaDuelo(12, 'demo', 'D', 0)).rejects.toThrow('No se pudo identificar la pregunta')
  })

  it('rechaza un duelo sin preguntas asignadas por el servidor', async () => {
    vi.mocked(solicitarApi).mockResolvedValue({ id: 12, preguntas: [] })
    await expect(buscarRivalDuelo()).rejects.toThrow('El servidor no devolvió un duelo con preguntas')
    expect(window.sessionStorage.getItem('dueloActual')).toBeNull()
  })
})
