import { beforeEach, describe, expect, it, vi } from 'vitest'
import { solicitarApi } from '../src/servicios/clienteApi.js'
import {
  guardarResultadoDueloLocal,
  iniciarDueloLocal,
  obtenerResultadoDueloLocal,
  registrarRespuestaTurnoLocal,
} from '../src/servicios/servicioDuelosLocales.js'

vi.mock('../src/servicios/clienteApi.js', () => ({ solicitarApi: vi.fn() }))

beforeEach(() => {
  vi.resetAllMocks()
})

const pregunta = {
  id: 11, orden: 2, categoria: { nombre: 'Historia' }, enunciado: 'Pregunta',
  opcion_a: 'A1', opcion_b: 'B1', opcion_c: 'C1', opcion_d: 'D1',
}

describe('duelos locales', () => {
  it('normaliza el nombre del invitado, los datos del duelo y las preguntas', async () => {
    vi.mocked(solicitarApi).mockResolvedValue({ id: 9, categoria_id: 3, preguntas: [pregunta] })
    await expect(iniciarDueloLocal('Jugador 1', '  Sofía  ')).resolves.toEqual({
      idDueloLocal: 9, categoriaId: 3, estado: 'EN_CURSO', modalidad: 'local',
      preguntas: [{
        id: '11', orden: 2, categoria: 'Historia', enunciado: 'Pregunta', opcionCorrectaId: null,
        opciones: [{ id: 'A', texto: 'A1' }, { id: 'B', texto: 'B1' }, { id: 'C', texto: 'C1' }, { id: 'D', texto: 'D1' }],
      }],
    })
    expect(solicitarApi).toHaveBeenCalledWith('/api/duelos/local', {
      metodo: 'POST', datos: { nombre_invitado: 'Sofía' },
    })
  })

  it('usa Invitado para un nombre vacío y acepta opciones en arreglo', async () => {
    vi.mocked(solicitarApi).mockResolvedValue({
      id: 2, estado: 'LISTO', modalidad: 'local',
      preguntas: [{ id: 1, enunciado: 'Otra', opciones: ['A', 'B', 'C', 'D'] }],
    })
    const duelo = await iniciarDueloLocal('', '   ')
    expect(duelo.preguntas[0]).toMatchObject({ orden: 1, categoria: 'General' })
    expect(duelo.preguntas[0].opciones[0]).toEqual({ id: 'A', texto: 'A' })
    expect(solicitarApi).toHaveBeenCalledWith('/api/duelos/local', {
      metodo: 'POST', datos: { nombre_invitado: 'Invitado' },
    })
  })

  it('rechaza duelos sin preguntas o con preguntas incompletas', async () => {
    vi.mocked(solicitarApi).mockResolvedValueOnce({ preguntas: [] })
    await expect(iniciarDueloLocal('', 'A')).rejects.toThrow('no devolvió preguntas')
    vi.mocked(solicitarApi).mockResolvedValueOnce({ preguntas: [{ ...pregunta, opcion_d: '' }] })
    await expect(iniciarDueloLocal('', 'A')).rejects.toThrow('pregunta incompleta')
  })

  it('envía la respuesta normalizada y el tiempo como número', async () => {
    vi.mocked(solicitarApi).mockResolvedValue({ es_correcta: true, puntaje_obtenido: '80' })
    await expect(registrarRespuestaTurnoLocal(2, 1, 'p 1', ' c ', '9')).resolves.toMatchObject({
      idDueloLocal: 2, jugadorId: 1, idPregunta: 'p 1', opcionSeleccionada: 'C',
      tiempoEmpleado: 9, registrado: true, esCorrecta: true, puntajeObtenido: 80,
    })
    expect(solicitarApi).toHaveBeenCalledWith('/api/duelos/preguntas/p%201/respuesta', {
      metodo: 'POST', datos: { opcion_seleccionada: 'C', tiempo_respuesta_segundos: 9 },
    })
  })

  it('devuelve null sin ID o si falla la consulta de resultado', async () => {
    await expect(obtenerResultadoDueloLocal(null)).resolves.toBeNull()
    expect(solicitarApi).not.toHaveBeenCalled()
    vi.mocked(solicitarApi).mockRejectedValue(new Error('sin servidor'))
    await expect(obtenerResultadoDueloLocal(9)).resolves.toBeNull()
  })

  it('normaliza el resultado y lo agrega al resumen guardado', async () => {
    vi.mocked(solicitarApi).mockResolvedValue({
      id: '9', estado: 'FINALIZADO', puntaje_jugador1: '100', puntaje_jugador2: '50',
      jugador1_id: '1', jugador2_id: '2', numero_ganador: 1, es_empate: false,
    })
    const resultado = await obtenerResultadoDueloLocal(9)
    expect(resultado).toEqual({
      id: 9, estado: 'FINALIZADO', modalidad: 'local', categoriaId: null,
      jugador1Id: 1, jugador2Id: 2, puntajeJugador1: 100, puntajeJugador2: 50,
      numeroGanador: 1, esEmpate: false,
    })
    await expect(guardarResultadoDueloLocal(9, { nombre: 'Sofía' })).resolves.toEqual({
      idDueloLocal: 9, nombre: 'Sofía', estadoDuelo: resultado, guardado: true,
    })
  })
})
