import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PaginaMiPerfil from '../src/paginas/PaginaMiPerfil.jsx'
import { obtenerPerfil } from '../src/servicios/servicioPerfil.js'
import { obtenerHistorialPersonal } from '../src/servicios/servicioHistorial.js'
import { obtenerPosicionUsuarioActual } from '../src/servicios/servicioRanking.js'

vi.mock('../src/servicios/servicioPerfil.js', () => ({ obtenerPerfil: vi.fn() }))
vi.mock('../src/servicios/servicioHistorial.js', () => ({ obtenerHistorialPersonal: vi.fn() }))
vi.mock('../src/servicios/servicioRanking.js', () => ({ obtenerPosicionUsuarioActual: vi.fn() }))
vi.mock('../src/componentes/MarcoPerfil.jsx', () => ({ default: ({ children }) => <div>{children}</div> }))

function mostrarPagina() {
  render(<MemoryRouter><PaginaMiPerfil /></MemoryRouter>)
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(obtenerPerfil).mockResolvedValue({ nombre: 'Ana', correo: 'ana@example.com', iniciales: 'AN', rol: 'JUGADOR', puntajeTotal: 1200 })
  vi.mocked(obtenerHistorialPersonal).mockResolvedValue({ estadisticasGenerales: { partidasJugadas: 12, duelosGanados: 3, torneosDisputados: 2 } })
  vi.mocked(obtenerPosicionUsuarioActual).mockResolvedValue(4)
})
afterEach(cleanup)

describe('mi perfil', () => {
  it('muestra identidad, resumen y accesos', async () => {
    mostrarPagina()
    await waitFor(() => expect(screen.getByText('Ana')).toBeTruthy())
    await waitFor(() => expect(screen.getByText('#4')).toBeTruthy())
    expect(screen.getByText('1.200 puntos')).toBeTruthy()
    expect(screen.getByRole('link', { name: /Historial de partidas/ }).getAttribute('href')).toBe('/historial')
    expect(screen.getByRole('link', { name: /Editar perfil/ }).getAttribute('href')).toBe('/perfil/editar')
    expect(screen.getByText('12')).toBeTruthy()
  })

  it('conserva el perfil cuando fallan las estadísticas', async () => {
    vi.mocked(obtenerHistorialPersonal).mockRejectedValue(new Error('sin historial'))
    vi.mocked(obtenerPosicionUsuarioActual).mockRejectedValue(new Error('sin ranking'))
    mostrarPagina()
    await waitFor(() => expect(screen.getByText('Ana')).toBeTruthy())
    await waitFor(() => expect(screen.getByText(/Algunas estadísticas no están disponibles/)).toBeTruthy())
  })

  it('informa un error al cargar el perfil', async () => {
    vi.mocked(obtenerPerfil).mockRejectedValue(new Error('sin perfil'))
    mostrarPagina()
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('sin perfil'))
  })
})
