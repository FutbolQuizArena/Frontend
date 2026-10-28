import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, useLocation } from 'react-router-dom'
import PaginaPartidaIndividual from '../src/paginas/PaginaPartidaIndividual.jsx'
import { ProveedorSesion } from '../src/contextos/ContextoSesion.jsx'
import {
  finalizarPartidaIndividual, iniciarPartidaIndividual, obtenerResultadoPartida,
  registrarRespuestaPartida,
} from '../src/servicios/servicioPartidas.js'

vi.mock('../src/servicios/servicioPartidas.js', () => ({
  finalizarPartidaIndividual: vi.fn(), iniciarPartidaIndividual: vi.fn(),
  obtenerResultadoPartida: vi.fn(), registrarRespuestaPartida: vi.fn(),
}))
vi.mock('../src/componentes/BotonCerrarSesion.jsx', () => ({ default: () => <button>Cerrar sesión</button> }))
vi.mock('../src/componentes/ComponenteTemporizador.jsx', () => ({ default: ({ tiempoRestante }) => <output>Tiempo: {tiempoRestante}</output> }))
vi.mock('../src/componentes/TarjetaPregunta.jsx', () => ({
  default: ({ pregunta, onSeleccionar, mostrarFeedback }) => <div>
    <p>{pregunta.enunciado}</p>
    <button onClick={() => onSeleccionar('A')}>Responder A</button>
    {mostrarFeedback && <output>Respuesta registrada</output>}
  </div>,
}))
vi.mock('../src/utilidades/navegacionConManejo.js', () => ({
  navegarConManejo: (navegar, destino) => navegar(destino),
}))

const preguntas = [
  { id: 10, enunciado: 'Primera pregunta', opcionCorrectaId: 'A', opciones: [{ id: 'A', texto: 'Correcta' }] },
  { id: 11, enunciado: 'Segunda pregunta', opcionCorrectaId: 'A', opciones: [{ id: 'A', texto: 'Correcta' }] },
]

function RutaActual() {
  return <output data-testid="ruta">{useLocation().pathname}</output>
}

async function mostrarPagina() {
  render(<ProveedorSesion><MemoryRouter initialEntries={['/partida/individual']}><PaginaPartidaIndividual /><RutaActual /></MemoryRouter></ProveedorSesion>)
  await act(async () => { await Promise.resolve() })
}

beforeEach(() => {
  vi.resetAllMocks()
  sessionStorage.clear()
  sessionStorage.setItem('categoriaPartidaSeleccionada', 'Historia')
  vi.useFakeTimers()
  vi.mocked(iniciarPartidaIndividual).mockResolvedValue({ id: 4, preguntas })
  vi.mocked(registrarRespuestaPartida).mockResolvedValue({ opcionSeleccionada: 'A', tiempoEmpleado: 1, esCorrecta: true, puntajeObtenido: 100 })
  vi.mocked(obtenerResultadoPartida).mockResolvedValue({ partidaId: 4, puntajeFinal: 200, fechaFin: '2026-10-23' })
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('partida individual', () => {
  it('carga preguntas y la categoría elegida', async () => {
    await mostrarPagina()
    expect(screen.getByRole('heading', { name: 'Pregunta 1 de 2' })).toBeTruthy()
    expect(screen.getByText('Primera pregunta')).toBeTruthy()
    expect(iniciarPartidaIndividual).toHaveBeenCalledWith(10, 'Historia')
  })

  it('registra una respuesta y avanza a la pregunta siguiente', async () => {
    await mostrarPagina()
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Responder A' })))
    expect(registrarRespuestaPartida).toHaveBeenCalledWith(4, 10, 'A', 1)
    expect(screen.getByText('Respuesta registrada')).toBeTruthy()
    await act(async () => { await vi.advanceTimersByTimeAsync(1200) })
    expect(screen.getByRole('heading', { name: 'Pregunta 2 de 2' })).toBeTruthy()
    expect(screen.getByText('Segunda pregunta')).toBeTruthy()
  })

  it('guarda el resultado del servidor y navega al finalizar', async () => {
    vi.mocked(iniciarPartidaIndividual).mockResolvedValue({ id: 4, preguntas: [preguntas[0]] })
    await mostrarPagina()
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Responder A' })))
    await act(async () => { await vi.advanceTimersByTimeAsync(1200) })
    expect(obtenerResultadoPartida).toHaveBeenCalledWith(4)
    expect(JSON.parse(sessionStorage.getItem('resultadoPartidaIndividual'))).toMatchObject({
      partidaId: 4, puntaje_final: 200, respuestasCorrectas: 1, finalizada: true,
    })
    expect(screen.getByTestId('ruta').textContent).toBe('/partida/resultado')
  })

  it('usa el resultado local si falla consultar el puntaje final', async () => {
    vi.mocked(iniciarPartidaIndividual).mockResolvedValue({ id: 4, preguntas: [preguntas[0]] })
    vi.mocked(obtenerResultadoPartida).mockRejectedValue(new Error('sin servidor'))
    vi.mocked(finalizarPartidaIndividual).mockReturnValue({ puntaje: 100, totalRespuestas: 1, respuestasCorrectas: 1 })
    await mostrarPagina()
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Responder A' })))
    await act(async () => { await vi.advanceTimersByTimeAsync(1200) })
    expect(finalizarPartidaIndividual).toHaveBeenCalledOnce()
    expect(JSON.parse(sessionStorage.getItem('resultadoPartidaIndividual'))).toMatchObject({ puntaje_final: 100, partidaId: 4 })
  })
})
