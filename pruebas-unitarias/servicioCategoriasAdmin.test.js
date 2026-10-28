import { beforeEach, describe, expect, it, vi } from 'vitest'
import { solicitarApi } from '../src/servicios/clienteApi.js'
import { obtenerPreguntasAdmin, renombrarCategoriaPreguntasAdmin } from '../src/servicios/servicioPreguntasAdmin.js'
import {
  actualizarCategoriaAdmin, crearCategoriaAdmin, obtenerCategoriaAdmin, obtenerCategoriasAdmin,
} from '../src/servicios/servicioCategoriasAdmin.js'

vi.mock('../src/servicios/clienteApi.js', () => ({ solicitarApi: vi.fn() }))
vi.mock('../src/servicios/servicioPreguntasAdmin.js', () => ({
  obtenerPreguntasAdmin: vi.fn(), renombrarCategoriaPreguntasAdmin: vi.fn(),
}))

beforeEach(() => vi.resetAllMocks())

describe('categorías de administración', () => {
  it('adapta el listado recibido y detecta un formato inválido', async () => {
    vi.mocked(solicitarApi).mockResolvedValueOnce([{ id: 3, nombre: 'Clubes', estado: 'ACTIVA', preguntas_count: 4 }])
      .mockResolvedValueOnce({ items: [] })
    await expect(obtenerCategoriasAdmin()).resolves.toEqual([
      { id: 3, nombre: 'Clubes', estado: 'ACTIVA', cantidadPreguntas: 4 },
    ])
    await expect(obtenerCategoriasAdmin()).rejects.toThrow('listado de categorías inesperado')
  })

  it('calcula la cantidad de preguntas por categoría en la vista previa', async () => {
    vi.mocked(obtenerPreguntasAdmin).mockResolvedValue([
      { categoria: 'Mundiales' }, { categoria: 'Mundiales' }, { categoria: 'Eurocopa' },
    ])
    const categorias = await obtenerCategoriasAdmin({ vistaPrevia: true })
    expect(categorias.find(({ nombre }) => nombre === 'Mundiales').cantidadPreguntas).toBe(2)
    expect(categorias.find(({ nombre }) => nombre === 'Eurocopa').cantidadPreguntas).toBe(1)
  })

  it('obtiene una categoría del servidor y valida un ID inexistente en vista previa', async () => {
    vi.mocked(solicitarApi).mockResolvedValue({ id: 3, nombre: 'Clubes', estado: 'ACTIVA' })
    await expect(obtenerCategoriaAdmin(3)).resolves.toMatchObject({ id: 3, cantidadPreguntas: 0 })
    await expect(obtenerCategoriaAdmin(999, { vistaPrevia: true })).rejects.toThrow('No encontramos esa categoría')
  })

  it('crea por API con nombre recortado y valida la vista previa', async () => {
    vi.mocked(solicitarApi).mockResolvedValue({ id: 9, nombre: 'Reglas', estado: 'ACTIVA' })
    await crearCategoriaAdmin({ nombre: ' Reglas ', estado: 'ACTIVA' })
    expect(solicitarApi).toHaveBeenCalledWith('/api/admin/categorias', {
      metodo: 'POST', datos: { nombre: 'Reglas', estado: 'ACTIVA' },
    })
    await expect(crearCategoriaAdmin({ nombre: ' ', estado: 'ACTIVA' }, { vistaPrevia: true })).rejects.toThrow('Ingresá el nombre')
    await expect(crearCategoriaAdmin({ nombre: 'mundiales', estado: 'ACTIVA' }, { vistaPrevia: true })).rejects.toThrow('Ya existe')
  })

  it('actualiza por API y renombra preguntas en la vista previa', async () => {
    vi.mocked(solicitarApi).mockResolvedValue({ id: 3, nombre: 'Nueva', estado: 'ACTIVA' })
    await actualizarCategoriaAdmin(3, { nombre: ' Nueva ', estado: 'ACTIVA' })
    expect(solicitarApi).toHaveBeenCalledWith('/api/admin/categorias/3', {
      metodo: 'PATCH', datos: { nombre: 'Nueva', estado: 'ACTIVA' },
    })
    const actualizada = await actualizarCategoriaAdmin(3, { nombre: 'Nueva', estado: 'ACTIVA' }, { vistaPrevia: true })
    expect(actualizada.nombre).toBe('Nueva')
    expect(renombrarCategoriaPreguntasAdmin).toHaveBeenCalledWith('Copa Libertadores', 'Nueva')
  })
})
