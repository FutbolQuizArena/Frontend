import { solicitarApi } from './clienteApi.js'

const preguntasDueloBase = [
  {
    id: 'duelo-historia-1',
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
]

function obtenerOpcionCorrectaDemo(idPregunta) {
  const indice = Number(idPregunta) || 0
  const pregunta = preguntasDueloBase[indice % preguntasDueloBase.length]
  return pregunta?.opcionCorrectaId ?? 'A'
}

function mapearPreguntaDuelo(pregunta) {
  const idPregunta = Number(pregunta?.id ?? 0)
  const opciones = [
    { id: 'A', texto: pregunta?.opcion_a ?? 'Opción A' },
    { id: 'B', texto: pregunta?.opcion_b ?? 'Opción B' },
    { id: 'C', texto: pregunta?.opcion_c ?? 'Opción C' },
    { id: 'D', texto: pregunta?.opcion_d ?? 'Opción D' },
  ]

  return {
    id: String(idPregunta || pregunta?.orden || 'pregunta-duelo'),
    categoria: 'Aleatoria',
    enunciado: pregunta?.enunciado ?? 'Pregunta del duelo',
    opciones,
    opcionCorrectaId: obtenerOpcionCorrectaDemo(idPregunta || pregunta?.orden || 1),
    orden: Number(pregunta?.orden ?? 1),
  }
}

function normalizarDueloOnline(respuesta) {
  const preguntas = Array.isArray(respuesta?.preguntas)
    ? respuesta.preguntas.map(mapearPreguntaDuelo)
    : preguntasDueloBase.map((pregunta, indice) => ({
        ...pregunta,
        id: `${pregunta.id}-${indice}`,
      }))

  return {
    id: Number(respuesta?.id ?? 0),
    estado: respuesta?.estado ?? 'BUSCANDO',
    modalidad: respuesta?.modalidad ?? 'online',
    categoriaId: respuesta?.categoria_id ?? null,
    preguntas,
    rival: {
      id: 'rival-online',
      nombre: 'Rival',
      alias: 'Oponente',
      avatar: 'RV',
      nivel: 'Online',
      puntuacion: 0,
    },
  }
}

export function obtenerResultadoDuelo(idDuelo) {
  return solicitarApi(`/api/duelos/${encodeURIComponent(idDuelo)}`)
    .then((respuesta) => {
      const jugadorLocal = {
        nombre: 'Lucas',
        alias: 'Luki',
        avatar: 'LM',
        puntaje: Number(respuesta?.puntaje_jugador1 ?? 0),
        aciertos: 0,
        totalPreguntas: 10,
        tiempoPromedio: 0,
      }
      const oponente = {
        nombre: 'Rival',
        alias: 'Oponente',
        avatar: 'RV',
        puntaje: Number(respuesta?.puntaje_jugador2 ?? 0),
        aciertos: 0,
        totalPreguntas: 10,
        tiempoPromedio: 0,
      }

      const ganadorNumero = Number(respuesta?.numero_ganador ?? 0)
      const empate = Boolean(respuesta?.es_empate)
      const ganador = empate ? 'empate' : (ganadorNumero === 1 ? 'local' : 'rival')
      const resultadoTexto = empate ? 'EMPATE' : (ganador === 'local' ? '¡VICTORIA!' : 'DERROTA')

      return {
        idPartida: idDuelo,
        ganador,
        jugadorLocal,
        oponente,
        resumen: {
          diferencia: Math.abs((jugadorLocal.puntaje ?? 0) - (oponente.puntaje ?? 0)),
          porcentajeLocal: 50,
          porcentajeOponente: 50,
        },
        resultadoTexto,
      }
    })
    .catch(() => {
      const base = {
        idPartida: idDuelo ?? 'duelo-demo',
        ganador: 'local',
        jugadorLocal: {
          nombre: 'Lucas',
          alias: 'Luki',
          avatar: 'LM',
          puntaje: 1420,
          aciertos: 8,
          totalPreguntas: 10,
          tiempoPromedio: 6.2,
        },
        oponente: {
          nombre: 'Rival',
          alias: 'Oponente',
          avatar: 'RV',
          puntaje: 1190,
          aciertos: 6,
          totalPreguntas: 10,
          tiempoPromedio: 8.4,
        },
        resumen: {
          diferencia: 230,
          porcentajeLocal: 80,
          porcentajeOponente: 60,
        },
        resultadoTexto: '¡VICTORIA!',
      }

      return base
    })
}

export function solicitarRevanchaDuelo(idDuelo) {
  return Promise.resolve({
    idDuelo,
    solicitudEnviada: true,
    destino: '/duelo/esperando',
    mensaje: 'Se está buscando un rival nuevo.',
  })
}

export function buscarRivalDuelo() {
  return solicitarApi('/api/duelos/online', { metodo: 'POST', datos: {} })
    .then((respuesta) => {
      const duelo = normalizarDueloOnline(respuesta)
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('dueloActual', JSON.stringify(duelo))
      }
      return duelo.rival
    })
    .catch(() => {
      const rivalFallback = {
        id: 'rival-demo',
        nombre: 'Rival',
        alias: 'Oponente',
        avatar: 'RV',
        nivel: 'Pro',
        puntuacion: 1400,
      }

      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('dueloActual', JSON.stringify({
          id: Date.now(),
          estado: 'BUSCANDO',
          modalidad: 'online',
          categoriaId: null,
          preguntas: preguntasDueloBase.map((pregunta) => ({ ...pregunta, id: String(pregunta.id) })),
        }))
      }

      return rivalFallback
    })
}

export function cancelarBusquedaDuelo() {
  return true
}

export function obtenerPreguntasDuelo(idDuelo) {
  if (typeof window !== 'undefined') {
    const dueloGuardado = window.sessionStorage.getItem('dueloActual')
    if (dueloGuardado) {
      try {
        const duelo = JSON.parse(dueloGuardado)
        if (Array.isArray(duelo?.preguntas) && duelo.preguntas.length > 0) {
          return duelo.preguntas.map((pregunta, indice) => ({
            ...pregunta,
            id: String(pregunta.id ?? `${idDuelo ?? 'duelo-demo'}-${indice + 1}`),
            categoria: pregunta.categoria ?? 'Aleatoria',
          }))
        }
      } catch {
        // ignora fallback
      }
    }
  }

  return preguntasDueloBase.map((pregunta, indice) => ({
    ...pregunta,
    id: `${pregunta.id}-${idDuelo ?? 'duelo-demo'}-${indice}`,
  }))
}

export function registrarRespuestaDuelo(idDuelo, idPregunta, opcionSeleccionada, tiempoEmpleado) {
  const preguntaId = Number(idPregunta)
  const opcionNormalizada = String(opcionSeleccionada ?? '').toUpperCase()

  if (!Number.isFinite(preguntaId) || preguntaId <= 0) {
    return {
      idDuelo,
      idPregunta,
      opcionSeleccionada: opcionNormalizada,
      tiempoEmpleado: Number(tiempoEmpleado) || 0,
      registrado: true,
      esCorrecta: opcionNormalizada === obtenerOpcionCorrectaDemo(1),
      puntajeObtenido: 0,
    }
  }

  return solicitarApi(`/api/duelos/preguntas/${encodeURIComponent(preguntaId)}/respuesta`, {
    metodo: 'POST',
    datos: {
      opcion_seleccionada: opcionNormalizada,
      tiempo_respuesta_segundos: Number(tiempoEmpleado) || 0,
    },
  }).then((respuesta) => ({
    idDuelo,
    idPregunta,
    opcionSeleccionada: opcionNormalizada,
    tiempoEmpleado: Number(tiempoEmpleado) || 0,
    registrado: true,
    esCorrecta: Boolean(respuesta?.es_correcta),
    puntajeObtenido: Number(respuesta?.puntaje_obtenido ?? 0),
  })).catch(() => ({
    idDuelo,
    idPregunta,
    opcionSeleccionada: opcionNormalizada,
    tiempoEmpleado: Number(tiempoEmpleado) || 0,
    registrado: true,
    esCorrecta: opcionNormalizada === obtenerOpcionCorrectaDemo(preguntaId),
    puntajeObtenido: opcionNormalizada === obtenerOpcionCorrectaDemo(preguntaId) ? 100 : 0,
  }))
}

export function simularRespuestaRival(idPregunta) {
  const correcta = Math.random() > 0.45

  return {
    idPregunta,
    correcta,
    opcionSeleccionada: correcta ? 'A' : 'D',
    tiempoEmpleado: 7 + Math.floor(Math.random() * 5),
  }
}

export default {
  buscarRivalDuelo,
  cancelarBusquedaDuelo,
  obtenerResultadoDuelo,
  solicitarRevanchaDuelo,
  obtenerPreguntasDuelo,
  registrarRespuestaDuelo,
  simularRespuestaRival,
}
