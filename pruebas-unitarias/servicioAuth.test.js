import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { registrar, iniciarSesion, cerrarSesionRemota } from '../src/servicios/servicioAuth.js'
import { obtenerToken } from '../src/servicios/servicioSesion.js'

vi.mock('../src/servicios/servicioSesion.js', () => ({ obtenerToken: vi.fn() }))

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubEnv('VITE_API_URL', 'https://api.ejemplo.test///')
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

function respuesta(ok, datos) {
  return { ok, json: vi.fn().mockResolvedValue(datos) }
}

describe('autenticación', () => {
  it('registra usuarios con los campos que espera el backend', async () => {
    vi.mocked(fetch).mockResolvedValue(respuesta(true, { id: 5 }))
    await expect(registrar('Ana', 'ana@ejemplo.test', 'clave')).resolves.toEqual({ id: 5 })
    expect(fetch).toHaveBeenCalledWith('https://api.ejemplo.test/api/auth/registro', expect.objectContaining({
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'Ana', email: 'ana@ejemplo.test', password: 'clave' }),
    }))
  })

  it('inicia sesión por API y conserva detalles del error del servidor', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(respuesta(true, { access_token: 'token-de-prueba' }))
      .mockResolvedValueOnce(respuesta(false, { code: 'CREDENCIALES', message: 'Datos incorrectos' }))
    await expect(iniciarSesion('ana@ejemplo.test', 'clave')).resolves.toMatchObject({ access_token: 'token-de-prueba' })
    expect(fetch).toHaveBeenNthCalledWith(1, 'https://api.ejemplo.test/api/auth/login', expect.objectContaining({
      body: JSON.stringify({ email: 'ana@ejemplo.test', password: 'clave' }),
    }))
    await expect(iniciarSesion('ana@ejemplo.test', 'mal')).rejects.toMatchObject({ code: 'CREDENCIALES', message: 'Datos incorrectos' })
  })

  it('usa un mensaje propio si el servidor no devuelve uno', async () => {
    vi.mocked(fetch).mockResolvedValue(respuesta(false, {}))
    await expect(iniciarSesion('ana@ejemplo.test', 'mal')).rejects.toThrow('No pudimos iniciar sesión')
  })

  it('informa una URL ausente, una respuesta inválida y un error de red', async () => {
    vi.stubEnv('VITE_API_URL', '')
    await expect(registrar('Ana', 'ana@ejemplo.test', 'clave')).rejects.toThrow('Falta configurar VITE_API_URL')
    vi.stubEnv('VITE_API_URL', 'https://api.ejemplo.test')
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: vi.fn().mockRejectedValue(new Error('JSON')) })
      .mockRejectedValueOnce(new Error('sin red'))
    await expect(registrar('Ana', 'ana@ejemplo.test', 'clave')).rejects.toThrow('respuesta inesperada')
    await expect(registrar('Ana', 'ana@ejemplo.test', 'clave')).rejects.toThrow('No pudimos conectar')
  })

  it('distingue una espera agotada', async () => {
    vi.mocked(fetch).mockRejectedValue({ name: 'TimeoutError' })
    await expect(iniciarSesion('ana@ejemplo.test', 'clave')).rejects.toThrow('tardó demasiado')
  })

  it('cierra la sesión remota solo cuando hay URL y token, sin bloquear por errores de red', async () => {
    vi.mocked(obtenerToken).mockReturnValue(null)
    await cerrarSesionRemota()
    expect(fetch).not.toHaveBeenCalled()
    vi.mocked(obtenerToken).mockReturnValue('token-de-prueba')
    vi.mocked(fetch).mockRejectedValue(new Error('sin red'))
    await expect(cerrarSesionRemota()).resolves.toBeUndefined()
    expect(fetch).toHaveBeenCalledWith('https://api.ejemplo.test/api/auth/logout', expect.objectContaining({
      method: 'POST', headers: { Accept: 'application/json', Authorization: 'Bearer token-de-prueba' },
    }))
  })
})
