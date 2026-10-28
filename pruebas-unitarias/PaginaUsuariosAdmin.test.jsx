import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PaginaUsuariosAdmin from '../src/paginas/PaginaUsuariosAdmin.jsx'
import { obtenerPerfil } from '../src/servicios/servicioPerfil.js'
import { cambiarEstadoUsuarioAdmin, obtenerUsuariosAdmin } from '../src/servicios/servicioUsuariosAdmin.js'

vi.mock('../src/servicios/servicioPerfil.js', () => ({ obtenerPerfil: vi.fn() }))
vi.mock('../src/servicios/servicioUsuariosAdmin.js', () => ({
  cambiarEstadoUsuarioAdmin: vi.fn(), obtenerUsuariosAdmin: vi.fn(),
}))
vi.mock('../src/servicios/servicioSesion.js', () => ({ obtenerToken: vi.fn(), esSesionAdminPrueba: vi.fn(() => false) }))
vi.mock('../src/componentes/MarcoTorneo.jsx', () => ({ default: ({ children }) => <main>{children}</main> }))
vi.mock('../src/componentes/NavegacionAdmin.jsx', () => ({ default: () => <nav>Panel admin</nav> }))

const usuarios = [
  { id: 1, nombre: 'Ana', email: 'ana@ejemplo.test', rol: 'ADMINISTRADOR', esta_habilitado: true },
  { id: 2, nombre: 'Leo', email: 'leo@ejemplo.test', rol: 'JUGADOR', esta_habilitado: false },
]

function mostrarPagina(ruta = '/admin/usuarios') {
  render(<MemoryRouter initialEntries={[ruta]}><PaginaUsuariosAdmin /></MemoryRouter>)
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(obtenerPerfil).mockResolvedValue({ rol: 'ADMINISTRADOR' })
  vi.mocked(obtenerUsuariosAdmin).mockResolvedValue(usuarios)
  vi.mocked(cambiarEstadoUsuarioAdmin).mockResolvedValue({})
})
afterEach(cleanup)

describe('usuarios del panel', () => {
  it('muestra el listado y actualiza los filtros enviados al servicio', async () => {
    mostrarPagina()
    await waitFor(() => expect(screen.getByText('Ana')).toBeTruthy())
    expect(screen.getByText('Leo')).toBeTruthy()
    fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar usuario' }), { target: { value: 'Leo' } })
    await waitFor(() => expect(obtenerUsuariosAdmin).toHaveBeenLastCalledWith(
      { buscar: 'Leo', rol: '', estaHabilitado: '' }, { vistaPrevia: false },
    ))
  })

  it('rechaza el acceso de un jugador', async () => {
    vi.mocked(obtenerPerfil).mockResolvedValue({ rol: 'JUGADOR' })
    mostrarPagina()
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Solo los administradores'))
    expect(obtenerUsuariosAdmin).not.toHaveBeenCalled()
  })

  it('muestra un error y vuelve a cargar al reintentar', async () => {
    vi.mocked(obtenerUsuariosAdmin).mockRejectedValueOnce(new Error('Falló el servidor')).mockResolvedValueOnce(usuarios)
    mostrarPagina()
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Falló el servidor'))
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    await waitFor(() => expect(screen.getByText('Ana')).toBeTruthy())
  })

  it('confirma el cambio de estado de un usuario', async () => {
    mostrarPagina()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Habilitar usuario: Leo' })).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: 'Habilitar usuario: Leo' }))
    fireEvent.click(screen.getByText('Sí, habilitar'))
    await waitFor(() => expect(cambiarEstadoUsuarioAdmin).toHaveBeenCalledWith(2, true, { vistaPrevia: false }))
    expect(screen.getByRole('button', { name: 'Deshabilitar usuario: Leo' })).toBeTruthy()
  })

  it('permite la vista previa sin perfil real', async () => {
    mostrarPagina('/admin/usuarios?vistaPrevia=1')
    await waitFor(() => expect(screen.getByText('Leo')).toBeTruthy())
    expect(obtenerPerfil).not.toHaveBeenCalled()
    expect(obtenerUsuariosAdmin).toHaveBeenCalledWith(
      { buscar: '', rol: '', estaHabilitado: '' }, { vistaPrevia: true },
    )
  })
})
