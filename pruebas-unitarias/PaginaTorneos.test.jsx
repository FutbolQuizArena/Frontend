import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PaginaTorneos from '../src/paginas/PaginaTorneos.jsx'
import { ProveedorSesion } from '../src/contextos/ContextoSesion.jsx'
import { obtenerPerfil } from '../src/servicios/servicioPerfil.js'
import { obtenerMisTorneos, obtenerTorneosDisponibles, obtenerTorneosFinalizados } from '../src/servicios/servicioTorneos.js'

vi.mock('../src/servicios/servicioPerfil.js', () => ({ obtenerPerfil: vi.fn(), obtenerPerfilEnCache: vi.fn(() => null) }))
vi.mock('../src/servicios/servicioTorneos.js', () => ({
  obtenerMisTorneos: vi.fn(), obtenerTorneosDisponibles: vi.fn(), obtenerTorneosFinalizados: vi.fn(),
}))
vi.mock('../src/componentes/TarjetaTorneo.jsx', () => ({
  default: ({ torneo }) => <article>{torneo.nombre}</article>,
}))

function mostrarPagina() {
  render(<ProveedorSesion><MemoryRouter><PaginaTorneos /></MemoryRouter></ProveedorSesion>)
}

const torneos = [
  { id: 1, nombre: 'Copa Libre', codigo: 'LIBRE', capacidad: 8, requiereContrasena: false },
  { id: 2, nombre: 'Copa Cerrada', codigo: 'CERRADA', capacidad: 16, requiereContrasena: true },
]

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(obtenerPerfil).mockResolvedValue({ rol: 'JUGADOR', puntajeTotal: 1200, iniciales: 'AN' })
  vi.mocked(obtenerMisTorneos).mockResolvedValue([])
  vi.mocked(obtenerTorneosDisponibles).mockResolvedValue(torneos)
  vi.mocked(obtenerTorneosFinalizados).mockResolvedValue([])
})
afterEach(cleanup)

describe('listados de torneos', () => {
  it('carga los torneos propios y el puntaje del perfil', async () => {
    mostrarPagina()
    await waitFor(() => expect(screen.getByText('No hay torneos para mostrar en esta sección.')).toBeTruthy())
    expect(screen.getByText('Jugador · 1.200 pts')).toBeTruthy()
    expect(obtenerMisTorneos).toHaveBeenCalledOnce()
  })

  it('cambia de sección y filtra los disponibles por nombre, código y acceso gratuito', async () => {
    mostrarPagina()
    fireEvent.click(screen.getByRole('button', { name: 'Disponibles' }))
    await waitFor(() => expect(screen.getByText('Copa Libre')).toBeTruthy())
    expect(screen.getByText('Copa Cerrada')).toBeTruthy()
    fireEvent.change(screen.getByPlaceholderText('Buscar por nombre o código'), { target: { value: 'LIBRE' } })
    expect(screen.queryByText('Copa Cerrada')).toBeNull()
    fireEvent.change(screen.getByPlaceholderText('Buscar por nombre o código'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Gratis' }))
    expect(screen.getByText('Copa Libre')).toBeTruthy()
    expect(screen.queryByText('Copa Cerrada')).toBeNull()
    expect(obtenerTorneosDisponibles).toHaveBeenCalledOnce()
  })

  it('muestra finalizados y la cantidad del historial', async () => {
    vi.mocked(obtenerTorneosFinalizados).mockResolvedValue([{ id: 3, nombre: 'Copa Pasada' }])
    mostrarPagina()
    fireEvent.click(screen.getByRole('button', { name: 'Finalizados' }))
    await waitFor(() => expect(screen.getByText('Copa Pasada')).toBeTruthy())
    expect(screen.getByText('1 torneo finalizado')).toBeTruthy()
  })

  it('muestra errores y permite reintentar una carga', async () => {
    vi.mocked(obtenerMisTorneos).mockRejectedValueOnce(new Error('Servidor no disponible')).mockResolvedValueOnce(torneos)
    mostrarPagina()
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Servidor no disponible'))
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    await waitFor(() => expect(screen.getByText('Copa Libre')).toBeTruthy())
    expect(obtenerMisTorneos).toHaveBeenCalledTimes(2)
  })
})
