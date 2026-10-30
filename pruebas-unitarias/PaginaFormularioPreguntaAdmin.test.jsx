import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PaginaFormularioPreguntaAdmin from '../src/paginas/PaginaFormularioPreguntaAdmin.jsx'
import { obtenerPerfil } from '../src/servicios/servicioPerfil.js'
import { obtenerCategoriasAdmin } from '../src/servicios/servicioCategoriasAdmin.js'
import { actualizarPreguntaAdmin, crearPreguntaAdmin, obtenerPreguntaAdmin } from '../src/servicios/servicioPreguntasAdmin.js'

vi.mock('../src/servicios/servicioPerfil.js', () => ({ obtenerPerfil: vi.fn() }))
vi.mock('../src/servicios/servicioSesion.js', () => ({ obtenerToken: vi.fn(), esSesionAdminPrueba: vi.fn(() => false) }))
vi.mock('../src/servicios/servicioCategoriasAdmin.js', () => ({ obtenerCategoriasAdmin: vi.fn() }))
vi.mock('../src/servicios/servicioPreguntasAdmin.js', () => ({
  actualizarPreguntaAdmin: vi.fn(), crearPreguntaAdmin: vi.fn(), obtenerPreguntaAdmin: vi.fn(),
}))
vi.mock('../src/componentes/MarcoTorneo.jsx', () => ({ default: ({ children }) => <main>{children}</main> }))

function mostrarPagina(ruta = '/admin/preguntas/nueva') {
  render(<MemoryRouter initialEntries={[ruta]}><Routes>
    <Route path="/admin/preguntas/nueva" element={<PaginaFormularioPreguntaAdmin />} />
    <Route path="/admin/preguntas/:idPregunta/editar" element={<PaginaFormularioPreguntaAdmin />} />
    <Route path="/admin" element={<p>Preguntas guardadas</p>} />
  </Routes></MemoryRouter>)
}

async function completarFormulario() {
  await waitFor(() => expect(screen.getByRole('button', { name: 'Guardar pregunta' })).toBeTruthy())
  fireEvent.change(screen.getByLabelText('Enunciado de la pregunta'), { target: { value: '¿Quién ganó?' } })
  fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: 'Historia' } })
  for (const [indice, letra] of ['A', 'B', 'C', 'D'].entries()) {
    fireEvent.change(screen.getByLabelText(`Opción ${letra}`), { target: { value: `Respuesta ${indice}` } })
  }
  fireEvent.change(screen.getByLabelText('Respuesta correcta'), { target: { value: '1' } })
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(obtenerPerfil).mockResolvedValue({ rol: 'ADMINISTRADOR' })
  vi.mocked(obtenerCategoriasAdmin).mockResolvedValue([{ nombre: 'Historia', estado: 'ACTIVA' }])
  vi.mocked(crearPreguntaAdmin).mockResolvedValue({ id: 1 })
})
afterEach(cleanup)

describe('formulario de pregunta', () => {
  it('valida los campos antes de crear una pregunta', async () => {
    mostrarPagina()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Guardar pregunta' })).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: 'Guardar pregunta' }))
    expect(screen.getByRole('alert').textContent).toContain('Completá el enunciado')
    await completarFormulario()
    fireEvent.click(screen.getByRole('button', { name: 'Guardar pregunta' }))
    await waitFor(() => expect(crearPreguntaAdmin).toHaveBeenCalledWith(expect.objectContaining({ categoria: 'Historia', respuestaCorrecta: 1, opciones: ['Respuesta 0', 'Respuesta 1', 'Respuesta 2', 'Respuesta 3'] }), { vistaPrevia: false }))
    await waitFor(() => expect(screen.getByText('Preguntas guardadas')).toBeTruthy())
  })

  it('rechaza respuestas duplicadas', async () => {
    mostrarPagina()
    await completarFormulario()
    fireEvent.change(screen.getByLabelText('Opción B'), { target: { value: 'respuesta 0' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar pregunta' }))
    expect(screen.getByRole('alert').textContent).toContain('deben ser diferentes')
    expect(crearPreguntaAdmin).not.toHaveBeenCalled()
  })

  it('carga y actualiza una pregunta existente', async () => {
    vi.mocked(obtenerPreguntaAdmin).mockResolvedValue({ enunciado: 'Original', categoria: 'Historia', dificultad: 'Fácil', estado: 'ACTIVA', opciones: ['A', 'B', 'C', 'D'], respuestaCorrecta: 0 })
    vi.mocked(actualizarPreguntaAdmin).mockResolvedValue({ id: 5 })
    mostrarPagina('/admin/preguntas/5/editar')
    await waitFor(() => expect(screen.getByLabelText('Enunciado de la pregunta').value).toBe('Original'))
    fireEvent.change(screen.getByLabelText('Enunciado de la pregunta'), { target: { value: 'Actualizada' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() => expect(actualizarPreguntaAdmin).toHaveBeenCalledWith('5', expect.objectContaining({ enunciado: 'Actualizada' }), { vistaPrevia: false }))
  })

  it('impide editar a jugadores', async () => {
    vi.mocked(obtenerPerfil).mockResolvedValue({ rol: 'JUGADOR' })
    mostrarPagina()
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Solo los administradores'))
    expect(obtenerCategoriasAdmin).not.toHaveBeenCalled()
  })
})
