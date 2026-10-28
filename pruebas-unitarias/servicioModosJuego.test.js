import { beforeEach, describe, expect, it, vi } from 'vitest'
import { solicitarApi } from '../src/servicios/clienteApi.js'
import { modosJuegoBase, obtenerModosJuego } from '../src/servicios/servicioModosJuego.js'

vi.mock('../src/servicios/clienteApi.js', () => ({ solicitarApi: vi.fn() }))

beforeEach(() => {
  vi.resetAllMocks()
})

describe('modos de juego', () => {
  it('normaliza los nombres alternativos del backend', async () => {
    vi.mocked(solicitarApi).mockResolvedValue({
      game_modes: [
        { name: 'Duelo rápido', description: 'Competencia', path: '/duelo', emoji: '⚽', label: 'Online' },
        { title: 'Individual', url: '/individual' },
      ],
    })

    await expect(obtenerModosJuego()).resolves.toEqual([
      { id: 'duelo-rápido', titulo: 'Duelo rápido', descripcion: 'Competencia', destino: '/duelo', icono: '⚽', etiqueta: 'Online' },
      { id: 'individual', titulo: 'Individual', descripcion: 'Modo de juego disponible.', destino: '/individual', icono: '🎯', etiqueta: 'Disponible' },
    ])
    expect(solicitarApi).toHaveBeenCalledTimes(1)
  })

  it('ignora modos incompletos y prueba la siguiente ruta', async () => {
    vi.mocked(solicitarApi)
      .mockResolvedValueOnce({ modos: [null, {}, { titulo: '' }] })
      .mockResolvedValueOnce({ items: [{ id: 9, nombre: 'Local', ruta: '/local' }] })

    await expect(obtenerModosJuego()).resolves.toEqual([
      expect.objectContaining({ id: 9, titulo: 'Local', destino: '/local' }),
    ])
    expect(solicitarApi).toHaveBeenNthCalledWith(2, '/api/modos-juego', { metodo: 'GET' })
  })

  it('usa los modos locales si el backend no responde', async () => {
    vi.mocked(solicitarApi).mockRejectedValue(new Error('sin conexión'))
    await expect(obtenerModosJuego()).resolves.toEqual(modosJuegoBase)
    expect(solicitarApi).toHaveBeenCalledTimes(5)
  })
})
