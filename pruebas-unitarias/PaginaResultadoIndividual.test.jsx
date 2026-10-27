import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import PaginaResultadoIndividual from '../src/paginas/PaginaResultadoIndividual.jsx'
import { ProveedorSesion } from '../src/contextos/ContextoSesion.jsx'
import { obtenerResultadoPartida } from '../src/servicios/servicioPartidas.js'

vi.mock('../src/servicios/servicioPartidas.js', () => ({ obtenerResultadoPartida: vi.fn() }))
vi.mock('../src/componentes/BotonCerrarSesion.jsx', () => ({ default: () => <button>Cerrar sesión</button> }))

function RutaActual() {
  return <output data-testid="ruta">{useLocation().pathname}</output>
}

function mostrarPagina(resultadoGuardado) {
  if (resultadoGuardado) sessionStorage.setItem('resultadoPartidaIndividual', JSON.stringify(resultadoGuardado))
  render(<ProveedorSesion><MemoryRouter initialEntries={['/partida/resultado']}><PaginaResultadoIndividual /><RutaActual /></MemoryRouter></ProveedorSesion>)
}

beforeEach(() => {
  vi.resetAllMocks()
  sessionStorage.clear()
})
afterEach(cleanup)

describe('resultado individual', () => {
  it('muestra el puntaje confirmado por la API y guarda el resultado actualizado', async () => {
    vi.mocked(obtenerResultadoPartida).mockResolvedValue({ partidaId: 7, puntajeFinal: 1500, fechaFin: '2026-10-23' })
    mostrarPagina({ partidaId: 7, puntaje: 600, totalRespuestas: 10, respuestasCorrectas: 8 })
    await waitFor(() => expect(screen.getByText('Excelente · Elite')).toBeTruthy())
    const guardado = JSON.parse(sessionStorage.getItem('resultadoPartidaIndividual'))
    expect(guardado).toMatchObject({ partidaId: 7, puntaje_final: 1500, respuestasCorrectas: 8, fecha_fin: '2026-10-23' })
    expect(screen.getAllByText('80%').length).toBeGreaterThan(0)
    expect(obtenerResultadoPartida).toHaveBeenCalledWith(7)
  })

  it('conserva el puntaje guardado si la API devuelve cero', async () => {
    vi.mocked(obtenerResultadoPartida).mockResolvedValue({ partidaId: 7, puntajeFinal: 0 })
    mostrarPagina({ partidaId: 7, puntaje: 950, totalRespuestas: 5, respuestasCorrectas: 4 })
    await waitFor(() => expect(screen.getByText('Muy bien · Pro')).toBeTruthy())
    expect(JSON.parse(sessionStorage.getItem('resultadoPartidaIndividual')).puntaje_final).toBe(950)
  })

  it('usa el resultado local si la consulta falla y permite jugar otra vez', async () => {
    vi.mocked(obtenerResultadoPartida).mockRejectedValue(new Error('sin servidor'))
    mostrarPagina({ partidaId: 7, puntaje: 300, totalRespuestas: 10, respuestasCorrectas: 3 })
    await waitFor(() => expect(screen.getByText('Buen intento · Rookie')).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: 'Jugar otra vez' }))
    expect(screen.getByTestId('ruta').textContent).toBe('/partida/ruleta')
  })

  it('muestra valores iniciales si todavía no hay resultado guardado', () => {
    mostrarPagina(null)
    expect(obtenerResultadoPartida).not.toHaveBeenCalled()
    expect(screen.getByText('Buen intento · Rookie')).toBeTruthy()
    expect(screen.getAllByText('0%').length).toBeGreaterThan(0)
  })
})
