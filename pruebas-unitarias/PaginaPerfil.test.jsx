import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import PaginaPerfil from '../src/paginas/PaginaPerfil.jsx'
import { actualizarPerfil, obtenerPerfil } from '../src/servicios/servicioPerfil.js'

vi.mock('../src/servicios/servicioPerfil.js', () => ({ obtenerPerfil: vi.fn(), actualizarPerfil: vi.fn() }))
vi.mock('../src/componentes/MarcoPerfil.jsx', () => ({ default: ({ children }) => <div>{children}</div> }))

function RutaActual() { return <output data-testid="ruta">{useLocation().pathname}</output> }
function mostrarPagina() {
  render(<MemoryRouter initialEntries={['/perfil/editar']}><PaginaPerfil /><RutaActual /></MemoryRouter>)
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(obtenerPerfil).mockResolvedValue({ nombre: 'Ana', correo: 'ana@example.com', iniciales: 'AN', puntajeTotal: 100 })
})
afterEach(cleanup)

describe('edición de perfil', () => {
  it('carga datos y valida nombre, correo y contraseña', async () => {
    mostrarPagina()
    await waitFor(() => expect(screen.getByLabelText('Nombre').value).toBe('Ana'))
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: '' } })
    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'incorrecto' } })
    fireEvent.change(screen.getByLabelText('Nueva contraseña (opcional)'), { target: { value: 'corta' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(actualizarPerfil).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(screen.getByLabelText('Nombre'))
  })

  it('guarda cambios y deja vacíos los campos de contraseña', async () => {
    vi.mocked(actualizarPerfil).mockResolvedValue({ nombre: 'Ana Nueva', correo: 'ana@example.com' })
    mostrarPagina()
    await waitFor(() => expect(screen.getByLabelText('Nombre').value).toBe('Ana'))
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: ' Ana Nueva ' } })
    fireEvent.change(screen.getByLabelText('Contraseña actual'), { target: { value: 'claveAnterior' } })
    fireEvent.change(screen.getByLabelText('Nueva contraseña (opcional)'), { target: { value: 'claveNueva123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() => expect(actualizarPerfil).toHaveBeenCalledWith({ nombre: 'Ana Nueva', correo: 'ana@example.com', contrasenaActual: 'claveAnterior', nuevaContrasena: 'claveNueva123' }))
    expect(screen.getByText('Tus cambios se guardaron correctamente.')).toBeTruthy()
    expect(screen.getByLabelText('Contraseña actual').value).toBe('')
  })

  it('muestra el error al guardar y permite cancelar', async () => {
    vi.mocked(actualizarPerfil).mockRejectedValue(new Error('servidor ocupado'))
    mostrarPagina()
    await waitFor(() => expect(screen.getByLabelText('Nombre').value).toBe('Ana'))
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('servidor ocupado'))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.getByTestId('ruta').textContent).toBe('/perfil')
  })
})
