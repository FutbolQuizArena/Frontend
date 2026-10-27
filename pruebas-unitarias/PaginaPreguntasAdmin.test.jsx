import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PaginaPreguntasAdmin from '../src/paginas/PaginaPreguntasAdmin.jsx'
import { obtenerPerfil } from '../src/servicios/servicioPerfil.js'
import { obtenerCategoriasAdmin } from '../src/servicios/servicioCategoriasAdmin.js'
import { eliminarPreguntaAdmin, obtenerPreguntasAdmin } from '../src/servicios/servicioPreguntasAdmin.js'

vi.mock('../src/servicios/servicioPerfil.js', () => ({ obtenerPerfil: vi.fn() }))
vi.mock('../src/servicios/servicioSesion.js', () => ({ obtenerToken: vi.fn(), esSesionAdminPrueba: vi.fn(() => false) }))
vi.mock('../src/servicios/servicioCategoriasAdmin.js', () => ({ obtenerCategoriasAdmin: vi.fn() }))
vi.mock('../src/servicios/servicioPreguntasAdmin.js', () => ({ obtenerPreguntasAdmin: vi.fn(), eliminarPreguntaAdmin: vi.fn() }))
vi.mock('../src/componentes/MarcoTorneo.jsx', () => ({ default: ({ children }) => <main>{children}</main> }))
vi.mock('../src/componentes/NavegacionAdmin.jsx', () => ({ default: () => <nav>Panel admin</nav> }))

const pregunta = { id: 1, enunciado: '¿Quién ganó la copa?', categoria: 'Historia', dificultad: 'Fácil', estado: 'ACTIVA' }

function mostrarPagina(ruta = '/admin/preguntas') {
  render(<MemoryRouter initialEntries={[ruta]}><PaginaPreguntasAdmin /></MemoryRouter>)
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(obtenerPerfil).mockResolvedValue({ rol: 'ADMINISTRADOR' })
  vi.mocked(obtenerPreguntasAdmin).mockResolvedValue({ preguntas: [pregunta], total: 1, totalPaginas: 1 })
  vi.mocked(obtenerCategoriasAdmin).mockResolvedValue([{ id: 2, nombre: 'Historia' }])
  vi.mocked(eliminarPreguntaAdmin).mockResolvedValue({})
  HTMLDialogElement.prototype.showModal = function () { this.open = true }
})
afterEach(cleanup)

describe('preguntas del panel', () => {
  it('carga el listado y permite filtrar por categoría y estado', async () => {
    mostrarPagina()
    await waitFor(() => expect(screen.getByText(pregunta.enunciado)).toBeTruthy())
    expect(screen.getByRole('link', { name: 'Nueva pregunta' })).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: '2' } })
    await waitFor(() => expect(obtenerPreguntasAdmin).toHaveBeenCalledWith(expect.objectContaining({ categoriaId: '2' })))
    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'BORRADOR' } })
    await waitFor(() => expect(obtenerPreguntasAdmin).toHaveBeenCalledWith(expect.objectContaining({ estado: 'BORRADOR' })))
  })

  it('permite confirmar la eliminación y vuelve a cargar', async () => {
    mostrarPagina()
    await waitFor(() => expect(screen.getByText(pregunta.enunciado)).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: `Eliminar pregunta: ${pregunta.enunciado}` }))
    expect(screen.getByRole('alertdialog').textContent).toContain(pregunta.enunciado)
    fireEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' }))
    await waitFor(() => expect(eliminarPreguntaAdmin).toHaveBeenCalledWith(1, { vistaPrevia: false }))
    await waitFor(() => expect(obtenerPreguntasAdmin).toHaveBeenCalledTimes(2))
  })

  it('bloquea a jugadores sin consultar preguntas', async () => {
    vi.mocked(obtenerPerfil).mockResolvedValue({ rol: 'JUGADOR' })
    mostrarPagina()
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Solo los administradores'))
    expect(obtenerPreguntasAdmin).not.toHaveBeenCalled()
  })

  it('muestra un error de carga y permite reintentar', async () => {
    vi.mocked(obtenerPreguntasAdmin).mockRejectedValueOnce(new Error('sin red')).mockResolvedValueOnce({ preguntas: [pregunta], total: 1, totalPaginas: 1 })
    mostrarPagina()
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('sin red'))
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    await waitFor(() => expect(screen.getByText(pregunta.enunciado)).toBeTruthy())
  })
})
