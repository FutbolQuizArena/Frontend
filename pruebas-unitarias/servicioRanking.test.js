import { beforeEach, describe, expect, it, vi } from 'vitest'
import { solicitarApi } from '../src/servicios/clienteApi.js'
import { obtenerPosicionUsuarioActual, obtenerRankingGeneral } from '../src/servicios/servicioRanking.js'

vi.mock('../src/servicios/clienteApi.js', () => ({ solicitarApi: vi.fn() }))

beforeEach(() => vi.resetAllMocks())

describe('ranking general', () => {
  it('ordena todas las páginas y marca al usuario actual', async () => {
    vi.mocked(solicitarApi).mockImplementation(async (ruta) => {
      if (new URLSearchParams(ruta.split('?')[1]).get('pagina') === '1') return {
        total_jugadores: 101,
        mi_posicion: { posicion: 2, usuario_id: 7, nombre: 'Ana López', puntaje_total: 80 },
        jugadores: [{ posicion: 2, usuario_id: 7, nombre: 'Ana López', puntaje_total: 80 }],
      }
      return { jugadores: [{ posicion: 1, usuario_id: 4, nombre: 'Luis Díaz', puntaje_total: 100 }] }
    })

    const ranking = await obtenerRankingGeneral()

    expect(solicitarApi).toHaveBeenCalledWith('/api/ranking?pagina=2&tamano_pagina=100')
    expect(ranking.totalJugadores).toBe(101)
    expect(ranking.posicionUsuarioActual).toBe(2)
    expect(ranking.listaClasificacion.map((jugador) => jugador.id)).toEqual([4, 7])
    expect(ranking.listaClasificacion[1]).toMatchObject({ avatar: 'AL', puntajeTotal: 80, esUsuarioActual: true })
  })

  it('admite una clasificación vacía sin posición personal', async () => {
    vi.mocked(solicitarApi).mockResolvedValue({ total_jugadores: 0, jugadores: [] })
    expect(await obtenerRankingGeneral()).toMatchObject({
      listaClasificacion: [], posicionUsuarioActual: null, usuarioActual: null, totalJugadores: 0,
    })
    expect(await obtenerPosicionUsuarioActual()).toBeNull()
  })

  it('consulta la posición personal sin cargar el resto de las páginas', async () => {
    vi.mocked(solicitarApi).mockResolvedValue({ mi_posicion: { posicion: 5 } })
    expect(await obtenerPosicionUsuarioActual()).toBe(5)
    expect(solicitarApi).toHaveBeenCalledOnce()
  })
})
