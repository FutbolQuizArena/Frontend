import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ProveedorSesion, usarSesion } from '../src/contextos/ContextoSesion.jsx'
import { borrarSesion, guardarSesion, obtenerDatosToken, obtenerToken } from '../src/servicios/servicioSesion.js'

vi.mock('../src/servicios/servicioSesion.js', () => ({
  borrarSesion: vi.fn(), guardarSesion: vi.fn(), obtenerDatosToken: vi.fn(), obtenerToken: vi.fn(), claveToken: 'token',
}))

function ControlSesion() {
  const sesion = usarSesion()
  return <>
    <output>{sesion.autenticado ? `Sesión: ${sesion.token}` : 'Sin sesión'}</output>
    <button onClick={() => sesion.abrirSesion({ access_token: 'nuevo' }, true)}>Abrir</button>
    <button onClick={sesion.cerrarSesion}>Cerrar</button>
  </>
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(obtenerToken).mockReturnValue(null)
  vi.mocked(guardarSesion).mockReturnValue('nuevo')
  vi.mocked(obtenerDatosToken).mockReturnValue(null)
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('contexto de sesión', () => {
  it('exige un proveedor para usar el contexto', () => {
    expect(() => render(<ControlSesion />)).toThrow('debe utilizarse dentro de ProveedorSesion')
  })

  it('abre y cierra una sesión con el servicio correspondiente', () => {
    render(<ProveedorSesion><ControlSesion /></ProveedorSesion>)
    expect(screen.getByText('Sin sesión')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir' }))
    expect(guardarSesion).toHaveBeenCalledWith({ access_token: 'nuevo' }, true)
    expect(screen.getByText('Sesión: nuevo')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(borrarSesion).toHaveBeenCalledOnce()
    expect(screen.getByText('Sin sesión')).toBeTruthy()
  })

  it('sincroniza la sesión cuando cambia el almacenamiento o vuelve el foco', () => {
    render(<ProveedorSesion><ControlSesion /></ProveedorSesion>)
    vi.mocked(obtenerToken).mockReturnValue('externo')
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: 'token' })))
    expect(screen.getByText('Sesión: externo')).toBeTruthy()
    vi.mocked(obtenerToken).mockReturnValue(null)
    act(() => window.dispatchEvent(new Event('focus')))
    expect(screen.getByText('Sin sesión')).toBeTruthy()
  })

  it('borra un token vencido al montar el proveedor', () => {
    vi.mocked(obtenerToken).mockReturnValue('vencido')
    vi.mocked(obtenerDatosToken).mockImplementation((token) => token ? { exp: Math.floor(Date.now() / 1000) - 5 } : null)
    render(<ProveedorSesion><ControlSesion /></ProveedorSesion>)
    expect(borrarSesion).toHaveBeenCalledOnce()
    expect(screen.getByText('Sin sesión')).toBeTruthy()
  })
})
