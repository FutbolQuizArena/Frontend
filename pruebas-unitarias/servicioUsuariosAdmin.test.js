import { beforeEach, describe, expect, it, vi } from 'vitest'
import { solicitarApi } from '../src/servicios/clienteApi.js'
import { cambiarEstadoUsuarioAdmin, obtenerUsuariosAdmin } from '../src/servicios/servicioUsuariosAdmin.js'

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
})
