import { beforeEach, describe, expect, it, vi } from 'vitest'
import { solicitarApi } from '../src/servicios/clienteApi.js'
import { esSesionAdminPrueba, obtenerToken } from '../src/servicios/servicioSesion.js'
import { actualizarPerfil, cambiarContrasena, obtenerPerfil } from '../src/servicios/servicioPerfil.js'

vi.mock('../src/servicios/clienteApi.js', () => ({ solicitarApi: vi.fn() }))
vi.mock('../src/servicios/servicioSesion.js', () => ({ esSesionAdminPrueba: vi.fn(), obtenerToken: vi.fn() }))

beforeEach(() => vi.resetAllMocks())

const usuario = { id: 4, nombre: 'Ana Pérez Gómez', email: 'ana@ejemplo.test', rol: 'JUGADOR', puntaje_total: 80 }

describe('perfil', () => {
  it('adapta la respuesta del servidor y calcula las iniciales', async () => {
    vi.mocked(solicitarApi).mockResolvedValue(usuario)
    await expect(obtenerPerfil()).resolves.toEqual({
      id: 4, nombre: 'Ana Pérez Gómez', correo: 'ana@ejemplo.test', rol: 'JUGADOR', puntajeTotal: 80, iniciales: 'AP',
    })
    expect(solicitarApi).toHaveBeenCalledWith('/api/usuarios/me')
  })

  it('usa un perfil local en la sesión de administrador de prueba', async () => {
    vi.mocked(esSesionAdminPrueba).mockReturnValue(true)
    await expect(obtenerPerfil()).resolves.toMatchObject({ nombre: 'Admin de prueba', iniciales: 'AD', puntajeTotal: 0 })
    expect(solicitarApi).not.toHaveBeenCalled()
  })

  it('actualiza el perfil sin enviar contraseña si no cambia', async () => {
    vi.mocked(solicitarApi).mockResolvedValue(usuario)
    await actualizarPerfil({ nombre: 'Ana Pérez Gómez', correo: 'ana@ejemplo.test' })
    expect(solicitarApi).toHaveBeenCalledWith('/api/usuarios/me', {
      metodo: 'PATCH', datos: { nombre: 'Ana Pérez Gómez', email: 'ana@ejemplo.test' },
    })
  })

  it('envía ambas contraseñas al actualizarlas', async () => {
    vi.mocked(solicitarApi).mockResolvedValue(usuario)
    await actualizarPerfil({ nombre: 'Ana', correo: 'ana@ejemplo.test', contrasenaActual: 'vieja', nuevaContrasena: 'nueva' })
    expect(solicitarApi).toHaveBeenCalledWith('/api/usuarios/me', {
      metodo: 'PATCH', datos: { nombre: 'Ana', email: 'ana@ejemplo.test', password_actual: 'vieja', nueva_password: 'nueva' },
    })
    await cambiarContrasena('vieja', 'nueva')
    expect(solicitarApi).toHaveBeenCalledWith('/api/usuarios/me/password', {
      metodo: 'PATCH', datos: { password_actual: 'vieja', nueva_password: 'nueva' },
    })
  })
})
