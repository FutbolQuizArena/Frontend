import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PaginaCategoriasAdmin from '../src/paginas/PaginaCategoriasAdmin.jsx'
import { obtenerCategoriasAdmin } from '../src/servicios/servicioCategoriasAdmin.js'
import { obtenerPerfil } from '../src/servicios/servicioPerfil.js'

vi.mock('../src/servicios/servicioCategoriasAdmin.js', () => ({ obtenerCategoriasAdmin: vi.fn() }))
vi.mock('../src/servicios/servicioPerfil.js', () => ({ obtenerPerfil: vi.fn() }))
vi.mock('../src/servicios/servicioSesion.js', () => ({ obtenerToken: vi.fn(), esSesionAdminPrueba: vi.fn(() => false) }))
vi.mock('../src/componentes/MarcoTorneo.jsx', () => ({ default: ({ children }) => <main>{children}</main> }))
vi.mock('../src/componentes/NavegacionAdmin.jsx', () => ({ default: () => <nav>Panel admin</nav> }))

function mostrarPagina(ruta = '/admin/categorias') {
  render(<MemoryRouter initialEntries={[ruta]}><PaginaCategoriasAdmin /></MemoryRouter>)
}

const categorias = [
  { id: 1, nombre: 'Mundiales', estado: 'ACTIVA', cantidadPreguntas: 2 },
  { id: 2, nombre: 'Clubes', estado: 'BORRADOR', cantidadPreguntas: 0 },
]

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(obtenerPerfil).mockResolvedValue({ rol: 'ADMINISTRADOR' })
  vi.mocked(obtenerCategoriasAdmin).mockResolvedValue(categorias)
})
afterEach(cleanup)

describe('categorías del panel', () => {
  it('muestra categorías y permite filtrarlas por nombre', async () => {
    mostrarPagina()
    await waitFor(() => expect(screen.getByText('Mundiales')).toBeTruthy())
    expect(screen.getByText('Clubes')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Nueva categoría' })).toBeTruthy()
    fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar categoría' }), { target: { value: ' clubes ' } })
    expect(screen.queryByText('Mundiales')).toBeNull()
    expect(screen.getByRole('link', { name: 'Editar categoría: Clubes' })).toBeTruthy()
  })

  it('impide consultar el listado a un jugador', async () => {
    vi.mocked(obtenerPerfil).mockResolvedValue({ rol: 'JUGADOR' })
    mostrarPagina()
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Solo los administradores'))
    expect(obtenerCategoriasAdmin).not.toHaveBeenCalled()
  })

  it('muestra un error y permite reintentar', async () => {
    vi.mocked(obtenerCategoriasAdmin).mockRejectedValueOnce(new Error('Servidor no disponible')).mockResolvedValueOnce(categorias)
    mostrarPagina()
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Servidor no disponible'))
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    await waitFor(() => expect(screen.getByText('Mundiales')).toBeTruthy())
    expect(obtenerCategoriasAdmin).toHaveBeenCalledTimes(2)
  })

  it('permite la vista previa sin consultar un perfil real', async () => {
    mostrarPagina('/admin/categorias?vistaPrevia=1')
    await waitFor(() => expect(screen.getByText('Mundiales')).toBeTruthy())
    expect(obtenerPerfil).not.toHaveBeenCalled()
    expect(obtenerCategoriasAdmin).toHaveBeenCalledWith({ vistaPrevia: true })
  })
})
