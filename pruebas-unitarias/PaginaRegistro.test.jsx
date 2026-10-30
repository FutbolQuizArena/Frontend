import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import PaginaRegistro from '../src/paginas/PaginaRegistro.jsx'
import { registrar } from '../src/servicios/servicioAuth.js'

vi.mock('../src/servicios/servicioAuth.js', () => ({ registrar: vi.fn() }))
vi.mock('../src/componentes/MarcoAutenticacion.jsx', () => ({ default: ({ children }) => <main>{children}</main> }))

function completarFormulario() {
  fireEvent.change(screen.getByLabelText('Nombre de usuario'), { target: { value: 'Ana' } })
  fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'ana@example.com' } })
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'claveSegura123' } })
  fireEvent.change(document.querySelector('[name="confirmacionContrasena"]'), { target: { value: 'claveSegura123' } })
}

beforeEach(() => vi.resetAllMocks())
afterEach(cleanup)

describe('registro', () => {
  it('señala los campos inválidos y enfoca el primero', () => {
    render(<PaginaRegistro />)
    fireEvent.click(screen.getByRole('button', { name: 'Crear mi cuenta' }))
    expect(registrar).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(screen.getByLabelText('Nombre de usuario'))
  })

  it('registra una cuenta válida y limpia el formulario', async () => {
    vi.mocked(registrar).mockResolvedValue({})
    render(<PaginaRegistro />)
    completarFormulario()
    fireEvent.click(screen.getByRole('button', { name: 'Crear mi cuenta' }))
    await waitFor(() => expect(registrar).toHaveBeenCalledWith('Ana', 'ana@example.com', 'claveSegura123'))
    expect(screen.getByText(/Cuenta creada con éxito/)).toBeTruthy()
    expect(screen.getByLabelText('Nombre de usuario').value).toBe('')
  })

  it('muestra un error del servidor y permite volver a enviar', async () => {
    vi.mocked(registrar).mockRejectedValueOnce(new Error('Correo ya registrado')).mockResolvedValueOnce({})
    render(<PaginaRegistro />)
    completarFormulario()
    fireEvent.click(screen.getByRole('button', { name: 'Crear mi cuenta' }))
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Correo ya registrado'))
    fireEvent.click(screen.getByRole('button', { name: 'Crear mi cuenta' }))
    await waitFor(() => expect(registrar).toHaveBeenCalledTimes(2))
  })
})
