import { obtenerPreguntasAdmin } from './servicioPreguntasAdmin.js'

// TODO (5.1): conectar con el listado de categorías del backend administrativo.
const categoriasEjemplo = [
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
