import { solicitarApi } from './clienteApi.js'

export const categoriasPartidas = [
  'Historia',
  'Mundiales',
  'Clubes',
  'Jugadores',
  'Reglas',
  'Tácticas',
]

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

export async function obtenerCategoriasDisponibles() {
  const rutasPosibles = ['/api/categorias', '/api/partidas/categorias']

  for (const ruta of rutasPosibles) {
    try {
      const respuesta = await solicitarApi(ruta, { metodo: 'GET' })
      const categorias = Array.isArray(respuesta)
        ? respuesta
        : Array.isArray(respuesta?.items)
          ? respuesta.items
          : Array.isArray(respuesta?.categorias)
            ? respuesta.categorias
            : []

      const categoriasNormalizadas = categorias
        .map(normalizarCategoriaBackend)
        .filter(Boolean)

      if (categoriasNormalizadas.length > 0) {
        return categoriasNormalizadas
      }
    } catch {
      // El backend actual no expone categorías; se usa fallback local.
    }
  }

  return categoriasPartidas.map((nombre) => ({ nombre }))
}

function mapearPreguntaBackend(pregunta) {
  const opciones = [
    { id: 'A', texto: pregunta.opcion_a },
    { id: 'B', texto: pregunta.opcion_b },
    { id: 'C', texto: pregunta.opcion_c },
    { id: 'D', texto: pregunta.opcion_d },
  ]

  return {
    id: String(pregunta.id),
    orden: pregunta.orden,
    categoria: 'Aleatoria',
    enunciado: pregunta.enunciado,
    opciones,
  }
}

export function obtenerCategoriaAleatoria(categorias = categoriasPartidas) {
  if (!Array.isArray(categorias) || categorias.length === 0) {
    return null
  }

  const indiceAleatorio = Math.floor(Math.random() * categorias.length)
  const categoriaElegida = categorias[indiceAleatorio]
  return typeof categoriaElegida === 'string' ? { nombre: categoriaElegida } : categoriaElegida
}

export function obtenerPreguntasPorCategoria(categoriaId, cantidad = 10) {
  return []
}

export async function iniciarPartidaIndividual() {
  const respuesta = await solicitarApi('/api/partidas/individual', { metodo: 'POST', datos: {} })

  return {
    id: Number(respuesta.id),
    categoriaId: respuesta.categoria_id,
    estado: respuesta.estado,
    preguntas: Array.isArray(respuesta.preguntas)
      ? respuesta.preguntas.map(mapearPreguntaBackend)
      : [],
  }
}

export async function registrarRespuestaPartida(idPartida, idPregunta, opcionSeleccionada, tiempoEmpleado) {
  const opcionNormalizada = String(opcionSeleccionada ?? '').trim().toUpperCase()

  const respuesta = await solicitarApi(`/api/partidas/preguntas/${encodeURIComponent(idPregunta)}/respuesta`, {
    metodo: 'POST',
    datos: {
      opcion_seleccionada: opcionNormalizada,
      tiempo_respuesta_segundos: Number(tiempoEmpleado) || 0,
    },
  })

  return {
    idPartida,
    idPregunta,
    opcionSeleccionada: opcionNormalizada,
    tiempoEmpleado: Number(tiempoEmpleado) || 0,
    registrado: true,
    esCorrecta: Boolean(respuesta.es_correcta),
    puntajeObtenido: Number(respuesta.puntaje_obtenido ?? 0),
  }
}

export async function obtenerResultadoPartida(partidaId) {
  const respuesta = await solicitarApi(`/api/partidas/${encodeURIComponent(partidaId)}/resultado`)

  return {
    partidaId: Number(respuesta.partida_id ?? partidaId),
    puntajeFinal: Number(respuesta.puntaje_final ?? 0),
    fechaFin: respuesta.fecha_fin,
    finalizada: true,
  }
}

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
