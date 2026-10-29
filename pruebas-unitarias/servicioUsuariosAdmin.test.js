import { beforeEach, describe, expect, it, vi } from 'vitest'
import { solicitarApi } from '../src/servicios/clienteApi.js'
import {
  actualizarUsuarioAdmin, cambiarEstadoUsuarioAdmin, crearUsuarioAdmin, obtenerUsuarioAdmin, obtenerUsuariosAdmin,
} from '../src/servicios/servicioUsuariosAdmin.js'

vi.mock('../src/servicios/clienteApi.js', () => ({ solicitarApi: vi.fn() }))

beforeEach(() => vi.resetAllMocks())

describe('usuarios de administración', () => {
  it('arma los filtros y devuelve el listado del servidor', async () => {
    vi.mocked(solicitarApi).mockResolvedValue([{ id: 1, nombre: 'Ana' }])
    await expect(obtenerUsuariosAdmin({ buscar: ' ana ', rol: 'JUGADOR', estaHabilitado: 'true' })).resolves.toEqual([{ id: 1, nombre: 'Ana' }])
    expect(solicitarApi).toHaveBeenCalledWith('/api/admin/usuarios?buscar=ana&rol=JUGADOR&esta_habilitado=true')
  })

  it('rechaza un formato inesperado y consulta sin filtros cuando no hay búsqueda', async () => {
    vi.mocked(solicitarApi).mockResolvedValueOnce({ items: [] }).mockResolvedValueOnce([])
    await expect(obtenerUsuariosAdmin()).rejects.toThrow('listado de usuarios inesperado')
    await expect(obtenerUsuariosAdmin()).resolves.toEqual([])
    expect(solicitarApi).toHaveBeenLastCalledWith('/api/admin/usuarios')
  })

  it('filtra por nombre, rol y estado en la vista previa', async () => {
    const usuarios = await obtenerUsuariosAdmin({ buscar: ' mati ', rol: 'JUGADOR', estaHabilitado: 'true' }, { vistaPrevia: true })
    expect(usuarios.map((usuario) => usuario.nombre)).toEqual(['Mati10'])
    expect(solicitarApi).not.toHaveBeenCalled()
  })

  it('cambia el estado por API enviando un booleano', async () => {
    vi.mocked(solicitarApi).mockResolvedValue({ id: 4, esta_habilitado: false })
    await expect(cambiarEstadoUsuarioAdmin(4, false)).resolves.toMatchObject({ esta_habilitado: false })
    expect(solicitarApi).toHaveBeenCalledWith('/api/admin/usuarios/4/estado', {
      metodo: 'PATCH', datos: { esta_habilitado: false },
    })
  })

  it('protege al administrador y valida IDs de la vista previa', async () => {
    await expect(cambiarEstadoUsuarioAdmin(1, false, { vistaPrevia: true })).rejects.toThrow('propia cuenta')
    await expect(cambiarEstadoUsuarioAdmin(999, true, { vistaPrevia: true })).rejects.toThrow('Usuario no encontrado')
  })

  it('cambia el estado de un usuario de ejemplo', async () => {
    const opciones = { vistaPrevia: true }
    const deshabilitado = await cambiarEstadoUsuarioAdmin(2, false, opciones)
    expect(deshabilitado.esta_habilitado).toBe(false)
    expect((await obtenerUsuariosAdmin({ estaHabilitado: 'false' }, opciones)).some(({ id }) => id === 2)).toBe(true)
    await cambiarEstadoUsuarioAdmin(2, true, opciones)
  })

  it('consulta, crea y actualiza usuarios mediante la API', async () => {
    const datos = { nombre: 'Ana', email: 'ana@ejemplo.test', password: 'clave123', rol: 'JUGADOR' }
    vi.mocked(solicitarApi).mockResolvedValue({ id: 8, ...datos })
    await obtenerUsuarioAdmin(8)
    expect(solicitarApi).toHaveBeenCalledWith('/api/admin/usuarios/8')
    await crearUsuarioAdmin(datos)
    expect(solicitarApi).toHaveBeenCalledWith('/api/admin/usuarios', { metodo: 'POST', datos })
    await actualizarUsuarioAdmin(8, { nombre: 'Ana María', email: datos.email, rol: datos.rol })
    expect(solicitarApi).toHaveBeenCalledWith('/api/admin/usuarios/8', {
      metodo: 'PATCH', datos: { nombre: 'Ana María', email: datos.email, rol: datos.rol },
    })
  })

  it('crea y edita usuarios de ejemplo, validando correos repetidos', async () => {
    const opciones = { vistaPrevia: true }
    const datos = { nombre: 'Prueba', email: 'prueba@ejemplo.test', password: 'clave123', rol: 'JUGADOR' }
    const creado = await crearUsuarioAdmin(datos, opciones)
    expect((await obtenerUsuarioAdmin(creado.id, opciones)).nombre).toBe('Prueba')
    await expect(crearUsuarioAdmin(datos, opciones)).rejects.toThrow('ya se encuentra registrado')
    await expect(actualizarUsuarioAdmin(creado.id, { ...datos, email: 'mati@ejemplo.com' }, opciones)).rejects.toThrow('ya se encuentra registrado')
    const actualizado = await actualizarUsuarioAdmin(creado.id, { ...datos, nombre: 'Actualizado' }, opciones)
    expect(actualizado.nombre).toBe('Actualizado')
    await expect(obtenerUsuarioAdmin(999, opciones)).rejects.toThrow('Usuario no encontrado')
    await expect(actualizarUsuarioAdmin(999, datos, opciones)).rejects.toThrow('Usuario no encontrado')
  })
})
