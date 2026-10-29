import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import PaginaResultadoIndividual from '../src/paginas/PaginaResultadoIndividual.jsx'
import { ProveedorSesion } from '../src/contextos/ContextoSesion.jsx'
import { obtenerResultadoPartida } from '../src/servicios/servicioPartidas.js'

vi.mock('../src/servicios/servicioPartidas.js', () => ({ obtenerResultadoPartida: vi.fn() }))
vi.mock('../src/servicios/servicioPerfil.js', () => ({
  obtenerPerfil: vi.fn(async () => ({ nombre: 'Ana', iniciales: 'A', puntajeTotal: 2000, rol: 'JUGADOR' })),
  obtenerPerfilEnCache: vi.fn(() => null),
}))
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
  it.each([
    [1500, 'Excelente · Elite'],
    [950, 'Muy bien · Pro'],
    [0, 'Buen intento · Rookie'],
  ])('muestra el puntaje confirmado %s sin volver a finalizar la partida', async (puntaje, etiqueta) => {
    const resultado = { partidaId: 7, puntaje_final: puntaje, totalRespuestas: 10, respuestasCorrectas: 8, finalizada: true }
    mostrarPagina(resultado)
    await waitFor(() => expect(screen.getByText(etiqueta)).toBeTruthy())
    expect(screen.getAllByText('80%').length).toBeGreaterThan(0)
    expect(obtenerResultadoPartida).not.toHaveBeenCalled()
    expect(JSON.parse(sessionStorage.getItem('resultadoPartidaIndividual'))).toEqual(resultado)
    fireEvent.click(screen.getByRole('button', { name: 'Jugar otra vez' }))
    expect(screen.getByTestId('ruta').textContent).toBe('/partida/ruleta')
  })

  it.each([null, { partidaId: 7, puntaje: 300 }])('no muestra un resultado sin confirmación del servidor: %s', async (resultado) => {
    mostrarPagina(resultado)
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('No hay un resultado confirmado'))
    expect(obtenerResultadoPartida).not.toHaveBeenCalled()
    expect(screen.queryByRole('heading', { name: 'Resultado de la partida' })).toBeNull()
  })
})
