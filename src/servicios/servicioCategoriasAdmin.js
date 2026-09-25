import { obtenerPreguntasAdmin, renombrarCategoriaPreguntasAdmin } from './servicioPreguntasAdmin.js'

// TODO (5.1): conectar con el listado de categorías del backend administrativo.
let categoriasEjemplo = [
  { id: 1, nombre: 'Mundiales', estado: 'ACTIVA' },
  { id: 2, nombre: 'Champions League', estado: 'ACTIVA' },
  { id: 3, nombre: 'Copa Libertadores', estado: 'ACTIVA' },
  { id: 4, nombre: 'Copa América', estado: 'ACTIVA' },
  { id: 5, nombre: 'Eurocopa', estado: 'BORRADOR' },
]

export async function obtenerCategoriasAdmin() {
  const preguntas = await obtenerPreguntasAdmin()
  return categoriasEjemplo.map((categoria) => ({
    ...categoria,
    cantidadPreguntas: preguntas.filter((pregunta) => pregunta.categoria === categoria.nombre).length,
  }))
}

export async function obtenerCategoriaAdmin(idCategoria) {
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

// TODO (5.1): reemplazar estas operaciones temporales por endpoints administrativos.
export async function crearCategoriaAdmin(datos) {
  const categoria = { id: Math.max(0, ...categoriasEjemplo.map(({ id }) => id)) + 1, ...validarCategoria(datos) }
  categoriasEjemplo = [...categoriasEjemplo, categoria]
  return { ...categoria }
}

export async function actualizarCategoriaAdmin(idCategoria, datos) {
  const id = Number(idCategoria)
  const actual = await obtenerCategoriaAdmin(id)
  const cambios = validarCategoria(datos, id)
  if (actual.nombre !== cambios.nombre) await renombrarCategoriaPreguntasAdmin(actual.nombre, cambios.nombre)
  const categoria = { ...actual, ...cambios }
  categoriasEjemplo = categoriasEjemplo.map((elemento) => elemento.id === id ? categoria : elemento)
  return { ...categoria }
}
