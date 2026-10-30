import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import PaginaLogin from '../src/paginas/PaginaLogin.jsx'
import { usarSesion } from '../src/contextos/ContextoSesion.jsx'
import { iniciarSesion } from '../src/servicios/servicioAuth.js'

vi.mock('../src/contextos/ContextoSesion.jsx', () => ({ usarSesion: vi.fn() }))
vi.mock('../src/servicios/servicioAuth.js', () => ({ iniciarSesion: vi.fn() }))
vi.mock('../src/componentes/MarcoAutenticacion.jsx', () => ({
  default: ({ children, titulo }) => <main><h1>{titulo}</h1>{children}</main>,
}))

const abrirSesion = vi.fn()

function RutaActual() {
  return <output data-testid="ruta">{useLocation().pathname}</output>
}

function mostrarPagina() {
  render(<MemoryRouter initialEntries={['/login']}><PaginaLogin /><RutaActual /></MemoryRouter>)
}

function completar(correo = 'ana@ejemplo.test', contrasena = 'Clave123!') {
  fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: correo } })
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: contrasena } })
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(usarSesion).mockReturnValue({ abrirSesion })
})
afterEach(cleanup)

describe('inicio de sesión', () => {
  it('valida los datos antes de consultar el servidor', async () => {
    mostrarPagina()
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
    expect(iniciarSesion).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Correo electrónico').getAttribute('aria-invalid')).toBe('true')
  })

  it('abre sesión y navega a home', async () => {
    vi.mocked(iniciarSesion).mockResolvedValue({ access_token: 'token' })
    mostrarPagina()
    completar(' ana@ejemplo.test ', 'Clave123!')
    fireEvent.click(screen.getByLabelText('Mantener sesión iniciada'))
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
    await waitFor(() => expect(screen.getByTestId('ruta').textContent).toBe('/home'))
    expect(iniciarSesion).toHaveBeenCalledWith('ana@ejemplo.test', 'Clave123!')
    expect(abrirSesion).toHaveBeenCalledWith({ access_token: 'token' }, true)
  })

  it('dirige al panel en una vista previa de administrador', async () => {
    vi.mocked(iniciarSesion).mockResolvedValue({ access_token: 'token', vistaPreviaAdmin: true })
    mostrarPagina()
    completar()
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
    await waitFor(() => expect(screen.getByTestId('ruta').textContent).toBe('/admin'))
  })

  it('muestra errores del servidor y permite corregir los campos', async () => {
    vi.mocked(iniciarSesion).mockRejectedValue(new Error('Credenciales incorrectas'))
    mostrarPagina()
    completar()
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Credenciales incorrectas'))
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'OtraClave123!' } })
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
