import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import PaginaHome from '../src/paginas/PaginaHome.jsx'
import { ProveedorSesion } from '../src/contextos/ContextoSesion.jsx'
import { obtenerPerfil } from '../src/servicios/servicioPerfil.js'
import { obtenerTorneosDisponibles } from '../src/servicios/servicioTorneos.js'
import { obtenerPosicionUsuarioActual } from '../src/servicios/servicioRanking.js'
import { obtenerHistorialPersonal } from '../src/servicios/servicioHistorial.js'

vi.mock('../src/servicios/servicioPerfil.js', () => ({ obtenerPerfil: vi.fn(), obtenerPerfilEnCache: vi.fn(() => null) }))
vi.mock('../src/servicios/servicioTorneos.js', () => ({ obtenerTorneosDisponibles: vi.fn() }))
vi.mock('../src/servicios/servicioRanking.js', () => ({ obtenerPosicionUsuarioActual: vi.fn() }))
vi.mock('../src/servicios/servicioHistorial.js', () => ({ obtenerHistorialPersonal: vi.fn() }))
vi.mock('../src/componentes/BotonCerrarSesion.jsx', () => ({ default: () => <button>Cerrar sesión</button> }))

function RutaActual() {
  const { pathname } = useLocation()
  return <output data-testid="ruta">{pathname}</output>
}

function mostrarPagina() {
  render(<ProveedorSesion><MemoryRouter initialEntries={['/home']}><PaginaHome /><RutaActual /></MemoryRouter></ProveedorSesion>)
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(obtenerPosicionUsuarioActual).mockResolvedValue(4)
  vi.mocked(obtenerHistorialPersonal).mockResolvedValue({ estadisticasGenerales: { partidasJugadas: 3 } })
})
afterEach(cleanup)

describe('inicio', () => {
  it('muestra el perfil y un torneo disponible, y navega a la partida', async () => {
    vi.mocked(obtenerPerfil).mockResolvedValue({ nombre: 'Ana', iniciales: 'AP', rol: 'JUGADOR', puntajeTotal: 1250 })
    vi.mocked(obtenerTorneosDisponibles).mockResolvedValue([{ nombre: 'Copa del barrio', participantes: 2, capacidad: 8 }])
    mostrarPagina()
    await waitFor(() => expect(screen.getByText('Copa del barrio')).toBeTruthy())
    await waitFor(() => expect(screen.getByText('#4')).toBeTruthy())
    expect(screen.getByText('RANKING')).toBeTruthy()
    expect(screen.getByText('PARTIDAS')).toBeTruthy()
    expect(screen.getByText('3')).toBeTruthy()
    expect(screen.getByText('1.250')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Ver mi perfil' }).textContent).toBe('AP')
    fireEvent.click(screen.getByRole('button', { name: /Empezar partida/i }))
    expect(screen.getByTestId('ruta').textContent).toBe('/partida/ruleta')
  })

  it('muestra estado vacío si no hay torneos', async () => {
    vi.mocked(obtenerPerfil).mockResolvedValue({ nombre: 'Ana', rol: 'JUGADOR' })
    vi.mocked(obtenerTorneosDisponibles).mockResolvedValue([])
    mostrarPagina()
    await waitFor(() => expect(screen.getByText('No hay torneos disponibles por ahora.')).toBeTruthy())
  })

  it('expone errores de perfil y de torneos al usuario', async () => {
    vi.mocked(obtenerPerfil).mockRejectedValue(new Error('No se pudo cargar el perfil'))
    vi.mocked(obtenerTorneosDisponibles).mockRejectedValue(new Error('sin conexión'))
    mostrarPagina()
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('No se pudo cargar el perfil'))
    expect(screen.getByText('No pudimos cargar los torneos disponibles.')).toBeTruthy()
  })

  it('muestra las opciones de administración para ese rol', async () => {
    vi.mocked(obtenerPerfil).mockResolvedValue({ nombre: 'Lucas', iniciales: 'LU', rol: 'ADMINISTRADOR', puntajeTotal: 0 })
    vi.mocked(obtenerTorneosDisponibles).mockResolvedValue([])
    mostrarPagina()
    await waitFor(() => expect(screen.getByRole('link', { name: /Administración/ })).toBeTruthy())
    expect(screen.getByText(/Administrador · 0 pts/)).toBeTruthy()
  })
})
