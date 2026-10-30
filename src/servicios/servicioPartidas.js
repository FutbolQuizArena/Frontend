import { solicitarApi } from './clienteApi.js'

export const categoriasPartidas = [
  'Historia',
  'Mundiales',
  'Clubes',
  'Jugadores',
  'Reglas',
  'Tácticas',
]

// Adapta los campos de cada categoría al formato que utiliza la ruleta.
function normalizarCategoriaBackend(categoria) {
  if (!categoria) {
    return null
  }

  if (typeof categoria === 'string') {
    return { nombre: categoria }
  }

  return {
    id: categoria.id ?? categoria.categoria_id ?? categoria.slug ?? null,
    nombre: categoria.nombre ?? categoria.titulo ?? categoria.descripcion ?? 'Categoría',
    color: categoria.color ?? null,
  }
}

function obtenerCategoriasDeRespuesta(respuesta) {
  if (Array.isArray(respuesta)) return respuesta
  if (Array.isArray(respuesta?.items)) return respuesta.items
  if (Array.isArray(respuesta?.categorias)) return respuesta.categorias
  return []
}

// Consulta las categorías jugables y propaga los errores para que la pantalla pueda mostrarlos.
export async function obtenerCategoriasDisponibles() {
  const respuesta = await solicitarApi('/api/partidas/categorias')
  const categorias = obtenerCategoriasDeRespuesta(respuesta).map(normalizarCategoriaBackend).filter(Boolean)
  if (categorias.length === 0) throw new Error('No hay categorías disponibles para jugar.')
  return categorias
}

// Convierte las cuatro opciones del backend en la lista que renderiza la tarjeta de pregunta.
function mapearPreguntaBackend(pregunta, categoria) {
  const opciones = [
    { id: 'A', texto: pregunta.opcion_a },
    { id: 'B', texto: pregunta.opcion_b },
    { id: 'C', texto: pregunta.opcion_c },
    { id: 'D', texto: pregunta.opcion_d },
  ]

  return {
    id: String(pregunta.id),
    orden: pregunta.orden,
    categoria,
    enunciado: pregunta.enunciado,
    opciones,
  }
}

/** Elige una categoría disponible para el giro cuando no llega un resultado predeterminado. */
export function obtenerCategoriaAleatoria(categorias = categoriasPartidas) {
  if (!Array.isArray(categorias) || categorias.length === 0) {
    return null
  }

  const indiceAleatorio = Math.floor(Math.random() * categorias.length)
  const categoriaElegida = categorias[indiceAleatorio]
  return typeof categoriaElegida === 'string' ? { nombre: categoriaElegida } : categoriaElegida
}

/** Conserva la interfaz anterior; las preguntas llegan al crear la partida y aquí no se consultan. */
export function obtenerPreguntasPorCategoria(categoriaId, cantidad = 10) {
  return []
}

// Crea una partida y comprueba que el servidor haya devuelto su ID y sus preguntas.
export async function iniciarPartidaIndividual() {
  const respuesta = await solicitarApi('/api/partidas/individual', { metodo: 'POST' })
  if (!Number.isInteger(respuesta?.id) || !Array.isArray(respuesta.preguntas) || respuesta.preguntas.length === 0) {
    throw new Error('El servidor no devolvió una partida con preguntas.')
  }
  // El servidor elige la categoría y entrega los ID de las preguntas de esta partida.
  const categoria = respuesta.categoria_nombre || 'Categoría del partido'
  return {
    id: respuesta.id,
    categoriaId: respuesta.categoria_id,
    categoriaNombre: categoria,
    estado: respuesta.estado,
    preguntas: respuesta.preguntas.map((pregunta) => mapearPreguntaBackend(pregunta, categoria)),
  }
}

// Envía la opción elegida y el tiempo utilizado; el servidor determina los aciertos y puntos.
// Una opción nula representa una pregunta cuyo tiempo se agotó.
export async function registrarRespuestaPartida(idPartida, idPregunta, opcionSeleccionada, tiempoEmpleado) {
  const opcionNormalizada = String(opcionSeleccionada ?? '').trim().toUpperCase()

  const respuesta = await solicitarApi(`/api/partidas/preguntas/${encodeURIComponent(idPregunta)}/respuesta`, {
    metodo: 'POST',
    datos: {
      opcion_seleccionada: opcionNormalizada || null,
      tiempo_respuesta_segundos: Number(tiempoEmpleado) || 0,
    },
  })
  return {
    idPartida,
    idPregunta,
    opcionSeleccionada: opcionNormalizada || null,
    tiempoEmpleado: Number(tiempoEmpleado) || 0,
    registrado: true,
    esCorrecta: Boolean(respuesta.es_correcta),
    puntajeObtenido: Number(respuesta.puntaje_obtenido ?? 0),
  }
}

// Este endpoint finaliza la partida individual y devuelve su puntaje definitivo.
export async function obtenerResultadoPartida(partidaId) {
  const respuesta = await solicitarApi(`/api/partidas/${encodeURIComponent(partidaId)}/resultado`)
  return {
    partidaId: Number(respuesta.partida_id ?? partidaId),
    puntajeFinal: Number(respuesta.puntaje_final ?? 0),
    fechaFin: respuesta.fecha_fin,
    finalizada: true,
  }
}

// Resume respuestas en memoria; esta función no guarda ni finaliza una partida en el servidor.
export function finalizarPartidaIndividual(idPartida, respuestas = []) {
  const puntaje = respuestas.reduce((acumulado, respuesta) => {
    const fueCorrecta = respuesta.esCorrecta === true
    if (!fueCorrecta) {
      return acumulado
    }

    const bonus = Number(respuesta.puntajeObtenido ?? 0)
    return acumulado + bonus
  }, 0)

  return {
    idPartida,
    puntaje,
    totalRespuestas: respuestas.length,
    respuestasCorrectas: respuestas.filter((respuesta) => respuesta.esCorrecta).length,
    finalizada: true,
  }
}

export default {
  obtenerCategoriaAleatoria,
  obtenerPreguntasPorCategoria,
  iniciarPartidaIndividual,
  registrarRespuestaPartida,
  obtenerResultadoPartida,
  finalizarPartidaIndividual,
}
