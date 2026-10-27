import { beforeEach, describe, expect, it, vi } from 'vitest'
import { solicitarApi } from '../src/servicios/clienteApi.js'
import { obtenerHistorialPersonal } from '../src/servicios/servicioHistorial.js'

vi.mock('../src/servicios/clienteApi.js', () => ({ solicitarApi: vi.fn() }))

beforeEach(() => vi.resetAllMocks())

describe('historial personal', () => {
  it('unifica partidas, duelos y torneos y calcula el resumen', async () => {
    vi.mocked(solicitarApi).mockImplementation(async (ruta) => {
      if (ruta.endsWith('partidas-individuales')) return { total: 3, partidas: [{ partida_id: 1, fecha_fin: '2026-10-20', categoria_nombre: 'Historia', puntaje_final: 50 }] }
      if (ruta.endsWith('duelos')) return { total: 2, duelos: [{ duelo_id: 5, fecha_fin: '2026-10-22', categoria_nombre: 'Deportes', resultado: 'VICTORIA', puntaje_propio: 90, puntaje_rival: 30, rival_nombre: 'Luis' }] }
      return { total: 4, torneos: [{ torneo_id: 8, nombre: 'Copa', fecha_creacion: '2026-10-21', es_campeon: true, ronda_alcanzada: 'Final' }] }
    })

    const historial = await obtenerHistorialPersonal()

    expect(solicitarApi).toHaveBeenCalledTimes(3)
    expect(historial.estadisticasGenerales).toMatchObject({ partidasJugadas: 5, duelosGanados: 1, torneosDisputados: 4, torneosGanados: 1 })
    expect(historial.partidasHistorial.map((partida) => partida.id)).toEqual(['duelo-5', 1])
    expect(historial.partidasHistorial[0]).toMatchObject({ modo: 'Duelo', oponente: 'Luis', puntaje: 90 })
    expect(historial.torneosHistorial[0]).toMatchObject({ resultado: 'Victoria', detalle: 'Ronda alcanzada: Final' })
  })

  it('usa valores predeterminados cuando faltan datos', async () => {
    vi.mocked(solicitarApi).mockImplementation(async (ruta) => {
      if (ruta.endsWith('partidas-individuales')) return { partidas: [{ partida_id: 1 }] }
      if (ruta.endsWith('duelos')) return { duelos: [{ duelo_id: 2, resultado: 'DERROTA' }] }
      return { torneos: [{ torneo_id: 3, estado: 'EN_CURSO' }] }
    })

    const historial = await obtenerHistorialPersonal()

    expect(historial.estadisticasGenerales).toMatchObject({ partidasJugadas: 2, duelosGanados: 0, torneosDisputados: 1, torneosGanados: 0 })
    expect(historial.partidasHistorial[0]).toMatchObject({ categoria: 'Sin categoría', puntaje: 0 })
    expect(historial.torneosHistorial[0]).toMatchObject({ resultado: 'En curso', puntaje: null })
  })

  it('propaga un error de cualquiera de las consultas', async () => {
    vi.mocked(solicitarApi).mockRejectedValue(new Error('sin conexión'))
    await expect(obtenerHistorialPersonal()).rejects.toThrow('sin conexión')
  })
})
