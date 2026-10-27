import { beforeEach, describe, expect, it, vi } from 'vitest'
import { solicitarApi } from '../src/servicios/clienteApi.js'
import {
  crearTorneo, obtenerCuadroTorneo, obtenerDetalleTorneo, obtenerMisTorneos,
  obtenerSalaTorneo, obtenerTorneosDisponibles, obtenerTorneosFinalizados,
  salirDelTorneo, unirseATorneo,
} from '../src/servicios/servicioTorneos.js'

vi.mock('../src/servicios/clienteApi.js', () => ({ solicitarApi: vi.fn() }))

beforeEach(() => vi.resetAllMocks())

const torneo = {
  id: 7, nombre: 'Copa', estado: 'ESPERANDO_JUGADORES', fecha_creacion: '2026-10-23',
  cantidad_participantes_actual: 2, cantidad_participantes: 8,
  codigo_acceso: 'ABC123', tiene_contrasena: false, creador_id: 1, creador_nombre: 'Ana',
  participantes: [{ usuario_id: 1, nombre: 'Ana', es_creador: true }],
  cuadro: [],
}

describe('torneos', () => {
  it('envía los datos de creación normalizados', async () => {
    vi.mocked(solicitarApi).mockResolvedValue({ id: 7, codigo_acceso: 'ABC123' })
    await expect(crearTorneo({ nombre: ' Copa ', cantidadParticipantes: 8, contrasena: ' ' })).resolves.toMatchObject({
      idTorneo: 7, codigoAcceso: 'ABC123',
    })
    expect(solicitarApi).toHaveBeenCalledWith('/api/torneos', {
      metodo: 'POST', datos: { nombre: 'Copa', cantidad_participantes: 8, contrasena_acceso: null },
    })
  })

  it('consulta cada filtro y calcula el progreso visible', async () => {
    vi.mocked(solicitarApi).mockResolvedValue([torneo])
    const [mios] = await obtenerMisTorneos()
    const [disponibles] = await obtenerTorneosDisponibles()
    expect(mios).toMatchObject({ estado: 'ESPERANDO', progreso: 25, tono: 'verde', detalle: '2/8 jugadores · Código ABC123' })
    expect(disponibles).toMatchObject({ estado: 'ABIERTO', inicio: 'Inscripciones abiertas' })
    expect(solicitarApi).toHaveBeenNthCalledWith(1, '/api/torneos?filtro=mios')
    expect(solicitarApi).toHaveBeenNthCalledWith(2, '/api/torneos?filtro=disponibles')
  })

  it('formatea estados y fechas de torneos finalizados', async () => {
    vi.mocked(solicitarApi).mockResolvedValue([{ ...torneo, estado: 'FINALIZADO', fecha_creacion: 'fecha inválida', cantidad_participantes: 0 }])
    const [finalizado] = await obtenerTorneosFinalizados()
    expect(finalizado).toMatchObject({ estado: 'FINALIZADO', progreso: 0, fecha: 'Fecha no disponible', inicio: 'Creado Fecha no disponible' })
  })

  it('limpia el código al unirse y codifica el ID al salir', async () => {
    vi.mocked(solicitarApi).mockResolvedValueOnce({ id: 4 }).mockResolvedValueOnce(null)
    await expect(unirseATorneo(' ab c ', '')).resolves.toMatchObject({ idTorneo: 4 })
    expect(solicitarApi).toHaveBeenNthCalledWith(1, '/api/torneos/unirse', {
      metodo: 'POST', datos: { codigo_acceso: 'ABC', contrasena: null },
    })
    await salirDelTorneo('a/b')
    expect(solicitarApi).toHaveBeenNthCalledWith(2, '/api/torneos/a%2Fb/salir', { metodo: 'DELETE' })
  })

  it('adapta la sala y sus participantes', async () => {
    vi.mocked(solicitarApi).mockResolvedValue(torneo)
    await expect(obtenerSalaTorneo(7)).resolves.toMatchObject({
      id: 7, estado: 'ESPERANDO JUGADORES', capacidad: 8, organizador: 'Ana',
      participantes: [{ id: 1, nombre: 'Ana', esCreador: true }],
    })
    expect(solicitarApi).toHaveBeenCalledWith('/api/torneos/7')
  })

  it('muestra un detalle sin cuadro cuando espera participantes', async () => {
    vi.mocked(solicitarApi).mockResolvedValue(torneo)
    await expect(obtenerDetalleTorneo(7)).resolves.toMatchObject({
      estado: 'ESPERANDO', proximaRonda: 'Esperando participantes', accion: 'Ir a la sala', resultado: null,
    })
  })

  it('organiza cruces por ronda y reconoce al campeón', async () => {
    vi.mocked(solicitarApi).mockResolvedValue({
      ...torneo, estado: 'FINALIZADO', cuadro: [
        { id: 2, ronda: 2, jugador_a: { id: 1, nombre: 'Ana' }, jugador_b: { id: 2, nombre: 'Leo' }, ganador_id: 1, estado: 'JUGADO' },
        { id: 1, ronda: 1, jugador_a: { id: 1, nombre: 'Ana' }, jugador_b: { id: 3, nombre: 'Sol' }, ganador_id: 1, estado: 'JUGADO' },
      ],
    })
    const cuadro = await obtenerCuadroTorneo(7)
    expect(cuadro.rondas.map((ronda) => ronda.nombre)).toEqual(['Cuartos de final', 'Semifinales'])
    expect(cuadro.campeon).toMatchObject({ id: 1, nombre: 'Ana' })
    expect(cuadro.rondaActual).toBe('Semifinales')
    await expect(obtenerDetalleTorneo(7)).resolves.toMatchObject({ resultado: 'Campeón: Ana', accion: 'Ver cuadro' })
  })

  it('identifica cruces pendientes y jugadores todavía no definidos', async () => {
    vi.mocked(solicitarApi).mockResolvedValue({
      ...torneo, estado: 'EN_CURSO', cuadro: [
        { id: 3, ronda: 1, estado: 'PENDIENTE', jugador_a_id: 4 },
      ],
    })
    const cuadro = await obtenerCuadroTorneo(7)
    expect(cuadro.rondaActual).toBe('Cuartos de final')
    expect(cuadro.rondas[0].cruces[0]).toMatchObject({
      estado: 'PENDIENTE', jugadorA: { id: 4, nombre: 'Por definir' }, jugadorB: { nombre: 'Por definir' },
    })
  })
})
