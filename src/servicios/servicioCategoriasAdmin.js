import { obtenerPreguntasAdmin, renombrarCategoriaPreguntasAdmin } from './servicioPreguntasAdmin.js'
import { solicitarApi } from './clienteApi.js'
import { esSesionAdminPrueba, obtenerToken } from './servicioSesion.js'

function usarEjemplos({ vistaPrevia = false } = {}) {
  return import.meta.env.DEV && (vistaPrevia || esSesionAdminPrueba(obtenerToken()))
}

function adaptarCategoria(categoria) {
  return { id: categoria.id, nombre: categoria.nombre, estado: categoria.estado, cantidadPreguntas: categoria.preguntas_count ?? 0 }
}

// Datos de ejemplo para la vista previa de desarrollo.
let categoriasEjemplo = [
  { id: 1, nombre: 'Mundiales', estado: 'ACTIVA' },
  { id: 2, nombre: 'Champions League', estado: 'ACTIVA' },
  { id: 3, nombre: 'Copa Libertadores', estado: 'ACTIVA' },
  { id: 4, nombre: 'Copa América', estado: 'ACTIVA' },
  { id: 5, nombre: 'Eurocopa', estado: 'BORRADOR' },
]

export async function obtenerCategoriasAdmin(opciones = {}) {
  if (!usarEjemplos(opciones)) {
    const respuesta = await solicitarApi('/api/admin/categorias')
    if (!Array.isArray(respuesta)) throw new Error('El servidor devolvió un listado de categorías inesperado.')
    return respuesta.map(adaptarCategoria)
  }
  const preguntas = await obtenerPreguntasAdmin(opciones)
  return categoriasEjemplo.map((categoria) => ({
    ...categoria,
    cantidadPreguntas: preguntas.filter((pregunta) => pregunta.categoria === categoria.nombre).length,
  }))
}

export async function obtenerCategoriaAdmin(idCategoria, opciones = {}) {
  if (!usarEjemplos(opciones)) return adaptarCategoria(await solicitarApi(`/api/admin/categorias/${idCategoria}`))
  const categoria = categoriasEjemplo.find((elemento) => elemento.id === Number(idCategoria))
  if (!categoria) throw new Error('No encontramos esa categoría.')
  return { ...categoria }
}

function validarCategoria(datos, idActual) {
  const nombre = datos.nombre.trim()
  if (!nombre) throw new Error('Ingresá el nombre de la categoría.')
  if (categoriasEjemplo.some((categoria) => categoria.id !== idActual && categoria.nombre.toLocaleLowerCase('es-AR') === nombre.toLocaleLowerCase('es-AR'))) {
    throw new Error('Ya existe una categoría con ese nombre.')
  }
  return { nombre, descripcion: (datos.descripcion || '').trim(), estado: datos.estado }
}

export async function crearCategoriaAdmin(datos, opciones = {}) {
  if (!usarEjemplos(opciones)) return adaptarCategoria(await solicitarApi('/api/admin/categorias', {
    metodo: 'POST', datos: { nombre: datos.nombre.trim(), estado: datos.estado },
  }))
  const categoria = { id: Math.max(0, ...categoriasEjemplo.map(({ id }) => id)) + 1, ...validarCategoria(datos) }
  categoriasEjemplo = [...categoriasEjemplo, categoria]
  return { ...categoria }
}

export async function actualizarCategoriaAdmin(idCategoria, datos, opciones = {}) {
  if (!usarEjemplos(opciones)) return adaptarCategoria(await solicitarApi(`/api/admin/categorias/${idCategoria}`, {
    metodo: 'PATCH', datos: { nombre: datos.nombre.trim(), estado: datos.estado },
  }))
  const id = Number(idCategoria)
  const actual = await obtenerCategoriaAdmin(id, opciones)
  const cambios = validarCategoria(datos, id)
  if (actual.nombre !== cambios.nombre) await renombrarCategoriaPreguntasAdmin(actual.nombre, cambios.nombre)
  const categoria = { ...actual, ...cambios }
  categoriasEjemplo = categoriasEjemplo.map((elemento) => elemento.id === id ? categoria : elemento)
  return { ...categoria }
}
