import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PaginaSeleccionModo from '../src/paginas/PaginaSeleccionModo.jsx'
import { ProveedorSesion } from '../src/contextos/ContextoSesion.jsx'
import { obtenerModosJuego } from '../src/servicios/servicioModosJuego.js'
import { obtenerPerfil } from '../src/servicios/servicioPerfil.js'

vi.mock('../src/servicios/servicioModosJuego.js', () => ({
  obtenerModosJuego: vi.fn(),
  modosJuegoBase: [{ id: 'local', titulo: 'Juego local', descripcion: 'Partida local', destino: '/local', icono: '⚽', etiqueta: 'Local' }],
}))
vi.mock('../src/componentes/BotonCerrarSesion.jsx', () => ({ default: () => <button>Cerrar sesión</button> }))
vi.mock('../src/servicios/servicioPerfil.js', () => ({ obtenerPerfil: vi.fn(), obtenerPerfilEnCache: vi.fn(() => null) }))

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(obtenerPerfil).mockResolvedValue({ nombre: 'Ana', iniciales: 'AP', rol: 'JUGADOR', puntajeTotal: 1250 })
})
afterEach(cleanup)

describe('selección de modo', () => {
  it('muestra los modos devueltos por el servicio', async () => {
    vi.mocked(obtenerModosJuego).mockResolvedValue([
      { id: 'online', titulo: 'Duelo online', descripcion: 'Competí', destino: '/duelo', icono: '⚽', etiqueta: 'Online' },
    ])
    render(<ProveedorSesion><MemoryRouter><PaginaSeleccionModo /></MemoryRouter></ProveedorSesion>)
    await waitFor(() => expect(screen.getByText('Duelo online')).toBeTruthy())
    expect(screen.getByText('Hola, Ana')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Ver mi perfil' }).textContent).toBe('AP')
    expect(screen.getByText('Jugador · 1.250 pts')).toBeTruthy()
    expect(screen.queryByText('Juego local')).toBeNull()
  })

  it('conserva el modo local si falla la consulta', async () => {
    vi.mocked(obtenerModosJuego).mockRejectedValue(new Error('sin servidor'))
    render(<ProveedorSesion><MemoryRouter><PaginaSeleccionModo /></MemoryRouter></ProveedorSesion>)
    await waitFor(() => expect(screen.queryByText('Cargando modos de juego…')).toBeNull())
    expect(screen.getByText('Juego local')).toBeTruthy()
  })
})
