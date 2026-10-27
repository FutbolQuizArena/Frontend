import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PaginaHistorialPersonal from '../src/paginas/PaginaHistorialPersonal.jsx'
import { obtenerHistorialPersonal } from '../src/servicios/servicioHistorial.js'

vi.mock('../src/servicios/servicioHistorial.js', () => ({ obtenerHistorialPersonal: vi.fn() }))
vi.mock('../src/componentes/MarcoTorneo.jsx', () => ({ default: ({ children }) => <main>{children}</main> }))

const partida = { id: 1, fecha: '2026-10-20T12:00:00', categoria: 'Historia', modo: 'Individual', resultado: 'Completada', puntaje: 50 }
const torneo = { id: 'torneo-3', fecha: '2026-10-21T12:00:00', categoria: 'Copa', modo: 'Torneo', resultado: 'Victoria', puntaje: null }

function mostrarPagina() {
  render(<MemoryRouter><PaginaHistorialPersonal /></MemoryRouter>)
}

beforeEach(() => vi.resetAllMocks())
afterEach(cleanup)

describe('historial personal', () => {
  it('muestra partidas, permite ver el detalle y pasar a torneos', async () => {
    vi.mocked(obtenerHistorialPersonal).mockResolvedValue({ partidasHistorial: [partida], torneosHistorial: [torneo] })
    mostrarPagina()
    await waitFor(() => expect(screen.getByText('Historia')).toBeTruthy())
    expect(screen.getByRole('tab', { name: 'Partidas individuales' }).getAttribute('aria-selected')).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: /ver detalle/i }))
    expect(screen.getByRole('dialog').textContent).toContain('50 pts')
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByRole('tab', { name: 'Torneos' }))
    expect(screen.getByText('Copa')).toBeTruthy()
  })

  it('muestra estados vacíos distintos para partidas y torneos', async () => {
    vi.mocked(obtenerHistorialPersonal).mockResolvedValue({ partidasHistorial: [], torneosHistorial: [] })
    mostrarPagina()
    await waitFor(() => expect(screen.getByText(/Todavía no jugaste partidas/)).toBeTruthy())
    fireEvent.click(screen.getByRole('tab', { name: 'Torneos' }))
    expect(screen.getByText(/Todavía no participaste en torneos/)).toBeTruthy()
  })

  it('permite reintentar si falla la carga', async () => {
    vi.mocked(obtenerHistorialPersonal).mockRejectedValueOnce(new Error('Sin red')).mockResolvedValueOnce({ partidasHistorial: [], torneosHistorial: [] })
    mostrarPagina()
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Sin red'))
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    await waitFor(() => expect(screen.getByText(/Todavía no jugaste partidas/)).toBeTruthy())
    expect(obtenerHistorialPersonal).toHaveBeenCalledTimes(2)
  })
})
