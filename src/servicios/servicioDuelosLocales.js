import { solicitarApi } from './clienteApi.js'

const preguntasPorJugador = 4

const preguntasBaseLocal = [
  {
    id: 'local-pregunta-1',
    categoria: 'Historia',
    enunciado: '¿Qué selección ganó la Copa Mundial de 2018?',
    opciones: [
      { id: 'A', texto: 'Francia' },
      { id: 'B', texto: 'Alemania' },
      { id: 'C', texto: 'Brasil' },
      { id: 'D', texto: 'Argentina' },
    ],
    opcionCorrectaId: 'A',
  },
  {
    id: 'local-pregunta-2',
    categoria: 'Clubes',
    enunciado: '¿Qué club es conocido como “Los Blancos”?',
    opciones: [
      { id: 'A', texto: 'Barcelona' },
      { id: 'B', texto: 'Real Madrid' },
      { id: 'C', texto: 'Juventus' },
      { id: 'D', texto: 'Bayern' },
    ],
    opcionCorrectaId: 'B',
  },
  {
    id: 'local-pregunta-3',
    categoria: 'Reglas',
    enunciado: '¿Cuántos jugadores puede haber en el campo por equipo al inicio del partido?',
    opciones: [
      { id: 'A', texto: '9' },
      { id: 'B', texto: '10' },
      { id: 'C', texto: '11' },
      { id: 'D', texto: '12' },
    ],
    opcionCorrectaId: 'C',
  },
  {
    id: 'local-pregunta-4',
    categoria: 'Duración',
    enunciado: '¿Cuánto dura un partido de fútbol profesional reglamentario?',
    opciones: [
      { id: 'A', texto: '60 minutos' },
      { id: 'B', texto: '75 minutos' },
      { id: 'C', texto: '90 minutos' },
      { id: 'D', texto: '120 minutos' },
    ],
    opcionCorrectaId: 'C',
  },
  {
    id: 'local-pregunta-5',
    categoria: 'Europa',
    enunciado: '¿Qué equipo ganó la Champions League 2022?',
    opciones: [
      { id: 'A', texto: 'Liverpool' },
      { id: 'B', texto: 'Real Madrid' },
      { id: 'C', texto: 'Manchester City' },
      { id: 'D', texto: 'Bayern Munich' },
    ],
    opcionCorrectaId: 'B',
  },
  {
    id: 'local-pregunta-6',
    categoria: 'Mundiales',
    enunciado: '¿Qué selección ganó la Copa del Mundo de 2022?',
    opciones: [
      { id: 'A', texto: 'Argentina' },
      { id: 'B', texto: 'Brasil' },
      { id: 'C', texto: 'Francia' },
      { id: 'D', texto: 'Alemania' },
    ],
    opcionCorrectaId: 'A',
  },
  {
    id: 'local-pregunta-7',
    categoria: 'Sedes',
    enunciado: '¿Qué país organizó el Mundial de 2022?',
    opciones: [
      { id: 'A', texto: 'Rusia' },
      { id: 'B', texto: 'Catar' },
      { id: 'C', texto: 'Brasil' },
      { id: 'D', texto: 'Qatar' },
    ],
    opcionCorrectaId: 'B',
  },
  {
    id: 'local-pregunta-8',
    categoria: 'Técnica',
    enunciado: '¿Qué tarjeta se muestra cuando un jugador comete una falta grave?',
    opciones: [
      { id: 'A', texto: 'Tarjeta amarilla' },
      { id: 'B', texto: 'Tarjeta roja' },
      { id: 'C', texto: 'Tarjeta azul' },
      { id: 'D', texto: 'Tarjeta verde' },
    ],
    opcionCorrectaId: 'B',
  },
]

if (preguntasBaseLocal.length !== preguntasPorJugador * 2) {
  throw new Error(`El duelo local debe tener ${preguntasPorJugador * 2} preguntas para 4 por jugador.`)
}

function normalizarPreguntaLocal(pregunta) {
  const opciones = [
    { id: 'A', texto: pregunta?.opcion_a ?? pregunta?.opciones?.[0]?.texto ?? 'Opción A' },
    { id: 'B', texto: pregunta?.opcion_b ?? pregunta?.opciones?.[1]?.texto ?? 'Opción B' },
    { id: 'C', texto: pregunta?.opcion_c ?? pregunta?.opciones?.[2]?.texto ?? 'Opción C' },
    { id: 'D', texto: pregunta?.opcion_d ?? pregunta?.opciones?.[3]?.texto ?? 'Opción D' },
  ]

  return {
    id: String(pregunta?.id ?? 'pregunta-local'),
    orden: Number(pregunta?.orden ?? 1),
    categoria: pregunta?.categoria ?? 'General',
    enunciado: pregunta?.enunciado ?? 'Pregunta del duelo local',
    opciones,
    opcionCorrectaId: null,
  }
}

function normalizarDueloLocal(respuesta) {
  const preguntas = Array.isArray(respuesta?.preguntas)
    ? respuesta.preguntas.map(normalizarPreguntaLocal)
    : obtenerPreguntasDueloLocal()

  return {
    idDueloLocal: Number(respuesta?.id ?? 0),
    categoriaId: respuesta?.categoria_id ?? null,
    estado: respuesta?.estado ?? 'EN_CURSO',
    modalidad: respuesta?.modalidad ?? 'local',
    preguntas,
  }
}

export function obtenerPreguntasDueloLocal() {
  return preguntasBaseLocal
}

export async function iniciarDueloLocal(nombreJugador1, nombreJugador2, categoriaId = 'general') {
  try {
    const respuesta = await solicitarApi('/api/duelos/local', {
      metodo: 'POST',
      datos: {
        nombre_invitado: (nombreJugador2 || 'Invitado').trim() || 'Invitado',
      },
    })

    return normalizarDueloLocal(respuesta)
  } catch {
    return {
      idDueloLocal: `duelo-local-${Date.now()}`,
      categoriaId,
      estado: 'en_curso',
      modalidad: 'local',
      preguntas: obtenerPreguntasDueloLocal(),
      jugador1: {
        id: 'jugador1',
        nombre: nombreJugador1 || 'Jugador 1',
        avatar: (nombreJugador1 || 'J1').slice(0, 2).toUpperCase(),
        puntaje: 0,
        aciertos: 0,
        tiempoTotal: 0,
      },
      jugador2: {
        id: 'jugador2',
        nombre: nombreJugador2 || 'Jugador 2',
        avatar: (nombreJugador2 || 'J2').slice(0, 2).toUpperCase(),
        puntaje: 0,
        aciertos: 0,
        tiempoTotal: 0,
      },
    }
  }
}

export async function registrarRespuestaTurnoLocal(idDueloLocal, jugadorId, idPregunta, opcionSeleccionada, tiempoEmpleado) {
  const opcionNormalizada = String(opcionSeleccionada ?? '').trim().toUpperCase()
  const tiempoRespuesta = Number(tiempoEmpleado) || 0

  try {
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
  } catch {
    const preguntaLocal = obtenerPreguntasDueloLocal().find((pregunta) => String(pregunta.id) === String(idPregunta))
    const esCorrecta = Boolean(preguntaLocal) && opcionNormalizada === String(preguntaLocal.opcionCorrectaId ?? '').toUpperCase()

    return {
      idDueloLocal,
      jugadorId,
      idPregunta,
      opcionSeleccionada: opcionNormalizada,
      tiempoEmpleado: tiempoRespuesta,
      registrado: true,
      esCorrecta,
      puntajeObtenido: esCorrecta ? 100 : 0,
    }
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
  obtenerPreguntasDueloLocal,
}
