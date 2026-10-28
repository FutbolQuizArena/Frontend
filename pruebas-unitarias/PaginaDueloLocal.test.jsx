import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import PaginaDueloLocal from '../src/paginas/PaginaDueloLocal.jsx'
import { guardarResultadoDueloLocal, iniciarDueloLocal, obtenerResultadoDueloLocal, registrarRespuestaTurnoLocal } from '../src/servicios/servicioDuelosLocales.js'

vi.mock('../src/servicios/servicioDuelosLocales.js', () => ({
  guardarResultadoDueloLocal: vi.fn(), iniciarDueloLocal: vi.fn(),
  obtenerResultadoDueloLocal: vi.fn(), registrarRespuestaTurnoLocal: vi.fn(),
}))
vi.mock('../src/componentes/NavegacionInicio.jsx', () => ({ default: () => <nav>Inicio</nav> }))
vi.mock('../src/componentes/BotonCerrarSesion.jsx', () => ({ default: () => <button>Cerrar sesión</button> }))
vi.mock('../src/componentes/PantallaPreparacionDuelo.jsx', () => ({
  default: ({ nombres, onChange, onIniciar, error }) => <section>
    <input aria-label="Jugador 1" value={nombres.jugador1} onChange={(evento) => onChange('jugador1', evento.target.value)} />
    <input aria-label="Jugador 2" value={nombres.jugador2} onChange={(evento) => onChange('jugador2', evento.target.value)} />
    {error && <p role="alert">{error}</p>}
    <button onClick={onIniciar}>Iniciar duelo</button>
  </section>,
}))
vi.mock('../src/componentes/PantallaCambioTurno.jsx', () => ({
  default: ({ jugador, onListo }) => <section><p>Turno siguiente: {jugador}</p><button onClick={onListo}>Listo</button></section>,
}))
vi.mock('../src/componentes/PantallaResultadoDueloLocal.jsx', () => ({
  default: ({ resultado, onRevancha, onVolver }) => <section>
    <p>Ganador: {resultado.ganadorNombre}</p><button onClick={onRevancha}>Revancha</button><button onClick={onVolver}>Volver</button>
  </section>,
}))

const preguntas = [
  { id: 1, enunciado: 'Primera pregunta', opciones: [{ id: 'A', texto: 'Primera opción' }] },
  { id: 2, enunciado: 'Segunda pregunta', opciones: [{ id: 'B', texto: 'Segunda opción' }] },
]

function RutaActual() { return <output data-testid="ruta">{useLocation().pathname}</output> }
function mostrarPagina() {
  render(<MemoryRouter initialEntries={['/duelo/local']}><PaginaDueloLocal /><RutaActual /></MemoryRouter>)
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(iniciarDueloLocal).mockResolvedValue({ idDueloLocal: 8, preguntas })
  vi.mocked(registrarRespuestaTurnoLocal).mockResolvedValue({ esCorrecta: true, puntajeObtenido: 100 })
  vi.mocked(obtenerResultadoDueloLocal).mockResolvedValue({ puntajeJugador1: 100, puntajeJugador2: 50 })
  vi.mocked(guardarResultadoDueloLocal).mockResolvedValue({})
})
afterEach(cleanup)

describe('duelo local', () => {
  it('alterna turnos, guarda el resultado y permite revancha', async () => {
    mostrarPagina()
    fireEvent.change(screen.getByLabelText('Jugador 1'), { target: { value: 'Ana' } })
    fireEvent.change(screen.getByLabelText('Jugador 2'), { target: { value: 'Luis' } })
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar duelo' }))
    await waitFor(() => expect(screen.getByText('Primera pregunta')).toBeTruthy())
    expect(iniciarDueloLocal).toHaveBeenCalledWith('Ana', 'Luis')
    fireEvent.click(screen.getByRole('button', { name: 'Opción Primera opción' }))
    await waitFor(() => expect(screen.getByText('Turno siguiente: Luis')).toBeTruthy())
    expect(registrarRespuestaTurnoLocal).toHaveBeenCalledWith(8, 'jugador1', 1, 'A', 10)
    fireEvent.click(screen.getByRole('button', { name: 'Listo' }))
    expect(screen.getByText('Segunda pregunta')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Opción Segunda opción' }))
    await waitFor(() => expect(screen.getByText('Turno siguiente: Ana')).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: 'Listo' }))
    await waitFor(() => expect(screen.getByText('Ganador: Ana')).toBeTruthy())
    expect(guardarResultadoDueloLocal).toHaveBeenCalledWith(8, expect.objectContaining({ ganador: 'jugador1', puntajeJugador1: 100, puntajeJugador2: 50 }))
    fireEvent.click(screen.getByRole('button', { name: 'Revancha' }))
    expect(screen.getByRole('button', { name: 'Iniciar duelo' })).toBeTruthy()
  })

  it('muestra el error si falla el inicio y permite reintentar', async () => {
    vi.mocked(iniciarDueloLocal).mockRejectedValueOnce(new Error('sin preguntas'))
    mostrarPagina()
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar duelo' }))
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('sin preguntas'))
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar duelo' }))
    await waitFor(() => expect(screen.getByText('Primera pregunta')).toBeTruthy())
  })

  it('conserva el turno si falla registrar la respuesta', async () => {
    vi.mocked(registrarRespuestaTurnoLocal).mockRejectedValueOnce(new Error('sin conexión'))
    mostrarPagina()
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar duelo' }))
    await waitFor(() => expect(screen.getByText('Primera pregunta')).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: 'Opción Primera opción' }))
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('sin conexión'))
    expect(screen.getByText('Primera pregunta')).toBeTruthy()
  })
})
