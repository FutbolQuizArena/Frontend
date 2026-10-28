import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import PaginaFormularioCategoriaAdmin from '../src/paginas/PaginaFormularioCategoriaAdmin.jsx'
import { obtenerPerfil } from '../src/servicios/servicioPerfil.js'
import { actualizarCategoriaAdmin, crearCategoriaAdmin, obtenerCategoriaAdmin } from '../src/servicios/servicioCategoriasAdmin.js'

vi.mock('../src/servicios/servicioPerfil.js', () => ({ obtenerPerfil: vi.fn() }))
vi.mock('../src/servicios/servicioCategoriasAdmin.js', () => ({
  actualizarCategoriaAdmin: vi.fn(), crearCategoriaAdmin: vi.fn(), obtenerCategoriaAdmin: vi.fn(),
}))
vi.mock('../src/servicios/servicioSesion.js', () => ({ obtenerToken: vi.fn(), esSesionAdminPrueba: vi.fn(() => false) }))
vi.mock('../src/componentes/MarcoTorneo.jsx', () => ({ default: ({ children }) => <main>{children}</main> }))

function RutaActual() { return <output data-testid="ruta">{useLocation().pathname}</output> }
function mostrarPagina(ruta = '/admin/categorias/nueva') {
  render(<MemoryRouter initialEntries={[ruta]}><Routes>
    <Route path="/admin/categorias/nueva" element={<PaginaFormularioCategoriaAdmin />} />
    <Route path="/admin/categorias/:idCategoria/editar" element={<PaginaFormularioCategoriaAdmin />} />
    <Route path="/admin/categorias" element={<RutaActual />} />
  </Routes></MemoryRouter>)
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(obtenerPerfil).mockResolvedValue({ rol: 'ADMINISTRADOR' })
  vi.mocked(obtenerCategoriaAdmin).mockResolvedValue({ nombre: 'Historia', estado: 'ACTIVA' })
  vi.mocked(crearCategoriaAdmin).mockResolvedValue({ id: 3 })
  vi.mocked(actualizarCategoriaAdmin).mockResolvedValue({ id: 3 })
})
afterEach(cleanup)

describe('formulario de categoría', () => {
  it('valida el nombre y crea una categoría', async () => {
    mostrarPagina()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Crear categoría' })).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: 'Crear categoría' }))
    expect(screen.getByRole('alert').textContent).toContain('Ingresá el nombre')
    fireEvent.change(screen.getByLabelText('Nombre de la categoría'), { target: { value: 'Historia' } })
    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'BORRADOR' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear categoría' }))
    await waitFor(() => expect(crearCategoriaAdmin).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'Historia', estado: 'BORRADOR' }), { vistaPrevia: false }))
    await waitFor(() => expect(screen.getByTestId('ruta').textContent).toBe('/admin/categorias'))
  })

  it('carga y actualiza la categoría existente', async () => {
    mostrarPagina('/admin/categorias/3/editar')
    await waitFor(() => expect(screen.getByLabelText('Nombre de la categoría').value).toBe('Historia'))
    fireEvent.change(screen.getByLabelText('Nombre de la categoría'), { target: { value: 'Geografía' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() => expect(actualizarCategoriaAdmin).toHaveBeenCalledWith('3', expect.objectContaining({ nombre: 'Geografía' }), { vistaPrevia: false }))
  })

  it('bloquea a jugadores y muestra errores de carga', async () => {
    vi.mocked(obtenerPerfil).mockResolvedValueOnce({ rol: 'JUGADOR' })
    mostrarPagina()
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Solo los administradores'))
    cleanup()
    vi.mocked(obtenerPerfil).mockRejectedValueOnce(new Error('sin conexión'))
    mostrarPagina()
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('sin conexión'))
  })

  it('muestra el error si falla la creación', async () => {
    vi.mocked(crearCategoriaAdmin).mockRejectedValue(new Error('nombre repetido'))
    mostrarPagina()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Crear categoría' })).toBeTruthy())
    fireEvent.change(screen.getByLabelText('Nombre de la categoría'), { target: { value: 'Historia' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear categoría' }))
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('nombre repetido'))
  })
})
