import { solicitarApi } from './clienteApi.js'

function normalizarPreguntaLocal(pregunta) {
  const opciones = [
    { id: 'A', texto: pregunta?.opcion_a ?? pregunta?.opciones?.[0]?.texto ?? pregunta?.opciones?.[0] },
    { id: 'B', texto: pregunta?.opcion_b ?? pregunta?.opciones?.[1]?.texto ?? pregunta?.opciones?.[1] },
    { id: 'C', texto: pregunta?.opcion_c ?? pregunta?.opciones?.[2]?.texto ?? pregunta?.opciones?.[2] },
    { id: 'D', texto: pregunta?.opcion_d ?? pregunta?.opciones?.[3]?.texto ?? pregunta?.opciones?.[3] },
  ]

  if (!pregunta?.id || !pregunta?.enunciado || opciones.some((opcion) => !opcion.texto)) {
    throw new Error('El servidor devolvió una pregunta incompleta para el duelo local.')
  }

  return {
    id: String(pregunta.id),
    orden: Number(pregunta.orden ?? 1),
    categoria: pregunta.categoria?.nombre ?? pregunta.categoria ?? 'General',
    enunciado: pregunta.enunciado,
    opciones,
    opcionCorrectaId: null,
  }
}

function normalizarDueloLocal(respuesta) {
  if (!Array.isArray(respuesta?.preguntas) || respuesta.preguntas.length === 0) {
    throw new Error('El servidor no devolvió preguntas para este duelo local. Intentá comenzar otra vez.')
  }

  return {
    idDueloLocal: respuesta.id,
    categoriaId: respuesta.categoria_id ?? null,
    estado: respuesta.estado ?? 'EN_CURSO',
    modalidad: respuesta.modalidad ?? 'local',
    preguntas: respuesta.preguntas.map(normalizarPreguntaLocal),
  }
}

export async function iniciarDueloLocal(_nombreJugador1, nombreJugador2) {
  const respuesta = await solicitarApi('/api/duelos/local', {
    metodo: 'POST',
    datos: {
      nombre_invitado: (nombreJugador2 || 'Invitado').trim() || 'Invitado',
    },
  })

  return normalizarDueloLocal(respuesta)
}

export async function registrarRespuestaTurnoLocal(idDueloLocal, jugadorId, idPregunta, opcionSeleccionada, tiempoEmpleado) {
  const opcionNormalizada = String(opcionSeleccionada ?? '').trim().toUpperCase()
  const tiempoRespuesta = Number(tiempoEmpleado) || 0
  const respuesta = await solicitarApi(`/api/duelos/preguntas/${encodeURIComponent(idPregunta)}/respuesta`, {
    metodo: 'POST',
    datos: {
      opcion_seleccionada: opcionNormalizada,
      tiempo_respuesta_segundos: tiempoRespuesta,
    },
  })

  return {
    idDueloLocal,
    jugadorId,
    idPregunta,
    opcionSeleccionada: opcionNormalizada,
    tiempoEmpleado: tiempoRespuesta,
    registrado: true,
    esCorrecta: Boolean(respuesta?.es_correcta),
    puntajeObtenido: Number(respuesta?.puntaje_obtenido ?? 0),
  }
}

export async function obtenerResultadoDueloLocal(idDueloLocal) {
  if (!idDueloLocal) {
    return null
  }

  try {
    const respuesta = await solicitarApi(`/api/duelos/${encodeURIComponent(idDueloLocal)}`)
    return {
      id: Number(respuesta?.id ?? idDueloLocal),
      estado: respuesta?.estado ?? 'EN_CURSO',
      modalidad: respuesta?.modalidad ?? 'local',
      categoriaId: respuesta?.categoria_id ?? null,
      jugador1Id: Number(respuesta?.jugador1_id ?? 1),
      jugador2Id: Number(respuesta?.jugador2_id ?? 2),
      puntajeJugador1: Number(respuesta?.puntaje_jugador1 ?? 0),
      puntajeJugador2: Number(respuesta?.puntaje_jugador2 ?? 0),
      numeroGanador: respuesta?.numero_ganador ?? null,
      esEmpate: Boolean(respuesta?.es_empate),
    }
  } catch {
    return null
  }
}

export async function guardarResultadoDueloLocal(idDueloLocal, datosResumen) {
  const estadoDuelo = await obtenerResultadoDueloLocal(idDueloLocal)

  return {
    idDueloLocal,
    ...datosResumen,
    estadoDuelo,
    guardado: true,
  }
}

export default {
  iniciarDueloLocal,
  registrarRespuestaTurnoLocal,
  guardarResultadoDueloLocal,
  obtenerResultadoDueloLocal,
}
