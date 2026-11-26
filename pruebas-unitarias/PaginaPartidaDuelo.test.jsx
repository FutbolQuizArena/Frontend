import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PaginaPartidaDuelo from '../src/paginas/PaginaPartidaDuelo.jsx'
import { recuperarJuegoDuelo, registrarRespuestaDuelo } from '../src/servicios/servicioDuelos.js'

vi.mock('../src/componentes/NavegacionInicio.jsx', () => ({ default: () => <nav /> }))
vi.mock('../src/componentes/BotonCerrarSesion.jsx', () => ({ default: () => null }))
vi.mock('../src/servicios/servicioPerfil.js', () => ({ obtenerPerfil: vi.fn(async () => ({ id: 1, nombre: 'Ana' })) }))
vi.mock('../src/servicios/servicioDuelos.js', () => ({
  recuperarJuegoDuelo: vi.fn(), registrarRespuestaDuelo: vi.fn(),
  enviarPresenciaDuelo: vi.fn(async () => ({ estado: 'EN_CURSO', jugador1_id: 1 })),
}))

const pregunta = (id, estaRespondida = false) => ({ id: String(id), enunciado: `Pregunta ${id}`, estaRespondida, opciones: [{ id: 'A', texto: 'Respuesta A' }] })
const juego = (preguntas) => ({ id: 42, estado: 'EN_CURSO', jugadorLocal: { id: 1, nombre: 'Ana' }, rival: { nombre: 'Luis' }, preguntas })
async function mostrar() {
  render(<MemoryRouter initialEntries={['/duelo/juegan']}><Routes>
    <Route path="/duelo/juegan" element={<PaginaPartidaDuelo />} />
    <Route path="/duelo/:id/resultado" element={<p>Resultado del servidor</p>} />
  </Routes></MemoryRouter>)
  await act(async () => {})
}
beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  sessionStorage.setItem('dueloActual', JSON.stringify({ id: 42, preguntas: [] }))
  recuperarJuegoDuelo.mockResolvedValue(juego([pregunta(901), pregunta(902)]))
  registrarRespuestaDuelo.mockResolvedValue({ esCorrecta: true, puntajeObtenido: 95 })
})
afterEach(() => { cleanup(); sessionStorage.clear(); vi.useRealTimers() })

it('recupera las preguntas pendientes del servidor al recargar', async () => {
  recuperarJuegoDuelo.mockResolvedValue({ ...juego([pregunta(901, true), pregunta(902)]), puntajePropio: 95, aciertosPropios: 1 })
  await mostrar()
  expect(screen.getByRole('heading', { name: 'Pregunta 902' })).toBeTruthy()
  expect(recuperarJuegoDuelo).toHaveBeenCalledWith(42, expect.objectContaining({ id: 1 }))
  expect(screen.getByText('Ana · 95 pts')).toBeTruthy()
})

it('avanza automáticamente después del feedback sin botón Siguiente', async () => {
  await mostrar()
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Respuesta A' })) })
  expect(screen.getByText('Respuesta correcta')).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Siguiente' })).toBeNull()
  await act(async () => { await vi.advanceTimersByTimeAsync(1200) })
  expect(screen.getByRole('heading', { name: 'Pregunta 902' })).toBeTruthy()
  expect(registrarRespuestaDuelo).toHaveBeenCalledTimes(1)
})

it('registra sin respuesta al agotar quince segundos y avanza', async () => {
  await mostrar()
  for (let n = 0; n < 15; n += 1) {
    await act(async () => { await vi.advanceTimersByTimeAsync(1000) })
  }
  expect(registrarRespuestaDuelo).toHaveBeenCalledWith(42, '901', null, 15)
  await act(async () => { await vi.advanceTimersByTimeAsync(1200) })
  expect(screen.getByRole('heading', { name: 'Pregunta 902' })).toBeTruthy()
})

it('recupera el progreso si el servidor guardó una respuesta cuya confirmación se perdió', async () => {
  await mostrar()
  const error = Object.assign(new Error('Ya respondida'), { codigo: 'PREGUNTA_YA_RESPONDIDA' })
  registrarRespuestaDuelo.mockRejectedValueOnce(error)
  recuperarJuegoDuelo.mockResolvedValue(juego([pregunta(901, true), pregunta(902)]))
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Respuesta A' })) })
  expect(screen.getByRole('heading', { name: 'Pregunta 902' })).toBeTruthy()
  expect(recuperarJuegoDuelo).toHaveBeenCalledTimes(2)
})
