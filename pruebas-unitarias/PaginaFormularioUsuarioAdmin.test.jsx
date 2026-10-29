import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import PaginaFormularioUsuarioAdmin from '../src/paginas/PaginaFormularioUsuarioAdmin.jsx'
import { obtenerPerfil } from '../src/servicios/servicioPerfil.js'
import { actualizarUsuarioAdmin, crearUsuarioAdmin, obtenerUsuarioAdmin } from '../src/servicios/servicioUsuariosAdmin.js'

vi.mock('../src/servicios/servicioPerfil.js', () => ({ obtenerPerfil: vi.fn() }))
vi.mock('../src/servicios/servicioUsuariosAdmin.js', () => ({
  actualizarUsuarioAdmin: vi.fn(), crearUsuarioAdmin: vi.fn(), obtenerUsuarioAdmin: vi.fn(),
}))
vi.mock('../src/servicios/servicioSesion.js', () => ({ obtenerToken: vi.fn(), esSesionAdminPrueba: vi.fn(() => false) }))
vi.mock('../src/componentes/MarcoTorneo.jsx', () => ({ default: ({ children }) => <main>{children}</main> }))

function RutaActual() {
  const ubicacion = useLocation()
  return <output data-testid="ruta">{ubicacion.pathname}{ubicacion.search}</output>
}

function mostrarPagina(ruta = '/admin/usuarios/nuevo') {
  render(<MemoryRouter initialEntries={[ruta]}><Routes>
    <Route path="/admin/usuarios/nuevo" element={<PaginaFormularioUsuarioAdmin />} />
    <Route path="/admin/usuarios/:idUsuario/editar" element={<PaginaFormularioUsuarioAdmin />} />
    <Route path="/admin/usuarios" element={<RutaActual />} />
  </Routes></MemoryRouter>)
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(obtenerPerfil).mockResolvedValue({ id: 1, rol: 'ADMINISTRADOR' })
  vi.mocked(obtenerUsuarioAdmin).mockResolvedValue({ id: 2, nombre: 'Leo', email: 'leo@ejemplo.test', rol: 'JUGADOR' })
  vi.mocked(crearUsuarioAdmin).mockResolvedValue({ id: 3 })
  vi.mocked(actualizarUsuarioAdmin).mockResolvedValue({ id: 2 })
})
afterEach(cleanup)

describe('formulario de usuarios de administración', () => {
  it('crea un usuario y vuelve al listado', async () => {
    mostrarPagina()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Crear usuario' })).toBeTruthy())
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: ' Ana ' } })
    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'ana@ejemplo.test' } })
    fireEvent.change(screen.getByLabelText('Contraseña inicial'), { target: { value: 'clave123' } })
    fireEvent.change(screen.getByLabelText('Rol'), { target: { value: 'ADMINISTRADOR' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear usuario' }))
    await waitFor(() => expect(crearUsuarioAdmin).toHaveBeenCalledWith({
      nombre: 'Ana', email: 'ana@ejemplo.test', password: 'clave123', rol: 'ADMINISTRADOR',
    }, { vistaPrevia: false }))
    await waitFor(() => expect(screen.getByTestId('ruta').textContent).toBe('/admin/usuarios'))
  })

  it('carga y actualiza una cuenta sin pedir contraseña', async () => {
    mostrarPagina('/admin/usuarios/2/editar')
    await waitFor(() => expect(screen.getByLabelText('Nombre').value).toBe('Leo'))
    expect(screen.queryByLabelText('Contraseña inicial')).toBeNull()
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Leonardo' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() => expect(actualizarUsuarioAdmin).toHaveBeenCalledWith('2', {
      nombre: 'Leonardo', email: 'leo@ejemplo.test', rol: 'JUGADOR',
    }, { vistaPrevia: false }))
  })

  it('impide cambiar el rol de la propia cuenta', async () => {
    vi.mocked(obtenerUsuarioAdmin).mockResolvedValue({ id: 1, nombre: 'Ana', email: 'ana@ejemplo.test', rol: 'ADMINISTRADOR' })
    mostrarPagina('/admin/usuarios/1/editar')
    await waitFor(() => expect(screen.getByLabelText('Rol').disabled).toBe(true))
    expect(screen.getByText(/Tu propio rol de administrador/)).toBeTruthy()
  })

  it('rechaza a jugadores y muestra errores al cargar', async () => {
    vi.mocked(obtenerPerfil).mockResolvedValueOnce({ id: 2, rol: 'JUGADOR' })
    mostrarPagina()
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Solo los administradores'))
    cleanup()
    vi.mocked(obtenerPerfil).mockRejectedValueOnce(new Error('sin conexión'))
    mostrarPagina()
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('sin conexión'))
  })

  it('muestra errores de validación y del servidor', async () => {
    vi.mocked(crearUsuarioAdmin).mockRejectedValue(new Error('correo repetido'))
    mostrarPagina()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Crear usuario' })).toBeTruthy())
    fireEvent.submit(screen.getByRole('button', { name: 'Crear usuario' }).closest('form'))
    expect(screen.getByRole('alert').textContent).toContain('Completá nombre')
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Ana' } })
    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'ana@ejemplo.test' } })
    fireEvent.change(screen.getByLabelText('Contraseña inicial'), { target: { value: 'clave123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear usuario' }))
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('correo repetido'))
  })

  it('usa los datos de ejemplo en la vista previa', async () => {
    mostrarPagina('/admin/usuarios/nuevo?vistaPrevia=1')
    await waitFor(() => expect(screen.getByText(/Datos de prueba/)).toBeTruthy())
    expect(obtenerPerfil).not.toHaveBeenCalled()
  })

  it('informa un error al cargar el usuario existente', async () => {
    vi.mocked(obtenerUsuarioAdmin).mockRejectedValue(new Error('usuario inexistente'))
    mostrarPagina('/admin/usuarios/99/editar')
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('usuario inexistente'))
  })
})
