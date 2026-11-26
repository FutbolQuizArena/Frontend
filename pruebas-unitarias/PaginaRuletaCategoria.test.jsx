import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import PaginaRuletaCategoria from '../src/paginas/PaginaRuletaCategoria.jsx'
import { obtenerCategoriasDisponibles } from '../src/servicios/servicioPartidas.js'

vi.mock('../src/componentes/NavegacionInicio.jsx', () => ({ default: () => null }))
vi.mock('../src/componentes/BotonCerrarSesion.jsx', () => ({ default: () => null }))
vi.mock('../src/ganchos/usarPerfilActual.js', () => ({ default: () => ({ nombre: 'Ana', puntajeTotal: 0 }) }))
vi.mock('../src/servicios/servicioPartidas.js', () => ({
  obtenerCategoriasDisponibles: vi.fn(), obtenerCategoriaAleatoria: vi.fn((categorias) => categorias[0]),
}))

function Ruta() { return <output data-testid="ruta">{useLocation().pathname}</output> }
async function mostrar() {
  render(<MemoryRouter><PaginaRuletaCategoria /><Ruta /></MemoryRouter>)
  await act(async () => {})
}
beforeEach(() => { vi.useFakeTimers(); vi.clearAllMocks(); sessionStorage.clear() })
afterEach(() => { cleanup(); vi.useRealTimers() })

it('muestra una espera normal y bloquea el giro si todavía no hay categorías', async () => {
  obtenerCategoriasDisponibles.mockResolvedValue([])
  sessionStorage.setItem('categoriaPartidaSeleccionadaId', '99')
  await mostrar()
  expect(screen.getByText(/Todavía no hay categorías listas/)).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Girar Ruleta' }).disabled).toBe(true)
  expect(screen.queryByRole('img', { name: /Ruleta/ })).toBeNull()
  expect(screen.queryByRole('button', { name: /Continuar a la Partida/ })).toBeNull()
  expect(screen.queryByRole('alert')).toBeNull()
  expect(sessionStorage.getItem('categoriaPartidaSeleccionadaId')).toBeNull()
})

it('permite consultar de nuevo cuando el administrador termina la carga inicial', async () => {
  obtenerCategoriasDisponibles.mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: 7, nombre: 'Historia' }])
  await mostrar()
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Volver a consultar' })) })
  expect(screen.getByRole('button', { name: 'Girar Ruleta' }).disabled).toBe(false)
})

it('funciona y dibuja una rueda completa con una única categoría real', async () => {
  obtenerCategoriasDisponibles.mockResolvedValue([{ id: 7, nombre: 'Historia' }])
  await mostrar()
  const dibujo = screen.getByRole('img', { name: /Ruleta/ }).querySelector('path').getAttribute('d')
  expect(dibujo.match(/ A /g)).toHaveLength(2)
  fireEvent.click(screen.getByRole('button', { name: 'Girar Ruleta' }))
  await act(async () => { await vi.advanceTimersByTimeAsync(4200) })
  expect(screen.getByRole('heading', { name: 'Historia' })).toBeTruthy()
  expect(sessionStorage.getItem('categoriaPartidaSeleccionadaId')).toBe('7')
  fireEvent.click(screen.getByRole('button', { name: 'Continuar a la Partida' }))
  expect(screen.getByTestId('ruta').textContent).toBe('/partida/juegan')
})

it('un fallo de conexión no introduce categorías ni muestra detalles técnicos', async () => {
  obtenerCategoriasDisponibles.mockRejectedValue(new Error('SQL ERROR detalle interno'))
  await mostrar()
  expect(screen.getByRole('alert').textContent).toContain('No pudimos cargar las categorías')
  expect(screen.queryByText(/SQL ERROR/)).toBeNull()
  expect(screen.getByRole('button', { name: 'Girar Ruleta' }).disabled).toBe(true)
})
