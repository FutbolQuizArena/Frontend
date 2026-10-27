import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { solicitarApi } from '../src/servicios/clienteApi.js'
import { obtenerToken } from '../src/servicios/servicioSesion.js'

vi.mock('../src/servicios/servicioSesion.js', () => ({ obtenerToken: vi.fn() }))

function respuesta(estado, cuerpo = '') {
  return { ok: estado >= 200 && estado < 300, status: estado, text: vi.fn().mockResolvedValue(cuerpo) }
}

beforeEach(() => {
  vi.stubEnv('VITE_API_URL', 'https://api.ejemplo.test/')
  vi.mocked(obtenerToken).mockReturnValue('token-de-prueba')
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('cliente API', () => {
  it('rechaza una operación protegida sin sesión antes de llamar a la API', async () => {
    vi.mocked(obtenerToken).mockReturnValue(null)
    await expect(solicitarApi('/api/perfil')).rejects.toMatchObject({ estado: 401, codigo: 'ERROR_API' })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('envía método, cuerpo JSON y autorización cuando corresponde', async () => {
    vi.mocked(fetch).mockResolvedValue(respuesta(201, '{"id":7}'))
    await expect(solicitarApi('/api/perfil', { metodo: 'POST', datos: { nombre: 'Ana' } })).resolves.toEqual({ id: 7 })
    expect(fetch).toHaveBeenCalledWith('https://api.ejemplo.test/api/perfil', expect.objectContaining({
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: 'Bearer token-de-prueba' },
      body: JSON.stringify({ nombre: 'Ana' }),
    }))
  })

  it('permite solicitudes públicas y respuestas sin contenido', async () => {
    vi.mocked(fetch).mockResolvedValue(respuesta(204))
    await expect(solicitarApi('/api/publico', { requiereSesion: false })).resolves.toBeNull()
    expect(fetch).toHaveBeenCalledWith('https://api.ejemplo.test/api/publico', expect.objectContaining({
      method: 'GET', headers: { Accept: 'application/json' }, body: undefined,
    }))
  })

  it('preserva el código, el detalle y el estado de un error del servidor', async () => {
    vi.mocked(fetch).mockResolvedValue(respuesta(409, '{"code":"DUPLICADO","message":"Ya existe","detail":{"id":7}}'))
    await expect(solicitarApi('/api/perfil')).rejects.toMatchObject({
      message: 'Ya existe', codigo: 'DUPLICADO', detalle: { id: 7 }, estado: 409,
    })
  })

  it('informa una respuesta que no contiene JSON válido', async () => {
    vi.mocked(fetch).mockResolvedValue(respuesta(200, 'no es JSON'))
    await expect(solicitarApi('/api/perfil')).rejects.toThrow('respuesta inesperada')
  })

  it('informa si falta la URL del servidor', async () => {
    vi.stubEnv('VITE_API_URL', '')
    await expect(solicitarApi('/api/perfil')).rejects.toThrow('No pudimos conectar con el servidor')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('distingue una espera agotada de un error de conexión', async () => {
    vi.mocked(fetch).mockRejectedValueOnce({ name: 'TimeoutError' }).mockRejectedValueOnce(new Error('sin red'))
    await expect(solicitarApi('/api/perfil')).rejects.toThrow('tardó demasiado')
    await expect(solicitarApi('/api/perfil')).rejects.toThrow('No pudimos conectar')
  })
})
