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

export function generarAvatar(nombre) {
  if (!nombre) return 'JQ'
  const partes = String(nombre).trim().split(/\s+/)
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + (partes[1][0] || '')).toUpperCase()
}

export function generarAlias(nombre) {
  if (!nombre) return 'Jugador'
  return String(nombre).trim().split(/\s+/)[0]
}

function normalizarDueloOnline(respuesta, usuarioActual = null) {
  const preguntas = Array.isArray(respuesta?.preguntas)
    ? respuesta.preguntas.map(mapearPreguntaDuelo)
    : preguntasDueloBase.map((pregunta, indice) => ({
        ...pregunta,
        id: `${pregunta.id}-${indice}`,
      }))

  const estado = String(respuesta?.estado ?? 'PENDIENTE_RIVAL').toUpperCase()
  const estaEnCurso = estado === 'EN_CURSO' || estado === 'FINALIZADA' || estado === 'FINALIZADO'

  const idUsuarioActual = usuarioActual?.id ? Number(usuarioActual.id) : null
  const esJugador1 = idUsuarioActual !== null ? Number(respuesta?.jugador1_id) === idUsuarioActual : true

  const rivalId = esJugador1 ? (respuesta?.jugador2_id ?? null) : respuesta?.jugador1_id
  const rivalNombre = esJugador1 ? (respuesta?.jugador2_nombre || null) : (respuesta?.jugador1_nombre || null)
  const rivalPuntaje = esJugador1 ? Number(respuesta?.puntaje_jugador2 ?? 0) : Number(respuesta?.puntaje_jugador1 ?? 0)

  const nombreLocal = esJugador1
    ? (respuesta?.jugador1_nombre || usuarioActual?.nombre || 'Tú')
    : (respuesta?.jugador2_nombre || usuarioActual?.nombre || 'Tú')

  const jugadorLocal = {
    id: idUsuarioActual ?? (esJugador1 ? respuesta?.jugador1_id : respuesta?.jugador2_id) ?? 0,
    nombre: nombreLocal,
    alias: generarAlias(nombreLocal),
    avatar: generarAvatar(nombreLocal),
    puntuacion: Number(usuarioActual?.puntajeTotal ?? 0),
  }

  const rival = (estaEnCurso && rivalNombre)
    ? {
        id: rivalId ?? 'rival-online',
        nombre: rivalNombre,
        alias: generarAlias(rivalNombre),
        avatar: generarAvatar(rivalNombre),
        nivel: 'Online',
        puntuacion: rivalPuntaje,
      }
    : null

  return {
    id: Number(respuesta?.id ?? 0),
    estado,
    modalidad: respuesta?.modalidad ?? 'online',
    categoriaId: respuesta?.categoria_id ?? null,
    jugadorLocal,
    rival,
    preguntas,
  }
}

export function obtenerResultadoDuelo(idDuelo, usuarioActual = null) {
  return solicitarApi(`/api/duelos/${encodeURIComponent(idDuelo)}`)
    .then((respuesta) => {
      const idUsuarioActual = usuarioActual?.id ? Number(usuarioActual.id) : null
      const esJugador1 = idUsuarioActual !== null ? Number(respuesta?.jugador1_id) === idUsuarioActual : true

      const puntajeLocal = esJugador1
        ? Number(respuesta?.puntaje_jugador1 ?? 0)
        : Number(respuesta?.puntaje_jugador2 ?? 0)
      const puntajeRival = esJugador1
        ? Number(respuesta?.puntaje_jugador2 ?? 0)
        : Number(respuesta?.puntaje_jugador1 ?? 0)

      const aciertosLocal = esJugador1
        ? Number(respuesta?.aciertos_jugador1 ?? 0)
        : Number(respuesta?.aciertos_jugador2 ?? 0)
      const aciertosRival = esJugador1
        ? Number(respuesta?.aciertos_jugador2 ?? 0)
        : Number(respuesta?.aciertos_jugador1 ?? 0)

      const nombreLocal = esJugador1
        ? (respuesta?.jugador1_nombre || usuarioActual?.nombre || 'Tú')
        : (respuesta?.jugador2_nombre || usuarioActual?.nombre || 'Tú')
      const nombreRival = esJugador1
        ? (respuesta?.jugador2_nombre || 'Rival')
        : (respuesta?.jugador1_nombre || 'Rival')

      const estado = String(respuesta?.estado ?? '').toUpperCase()
      const estaFinalizado = estado === 'FINALIZADA' || estado === 'FINALIZADO'
      const empate = Boolean(respuesta?.es_empate)
      const ganadorNumero = Number(respuesta?.numero_ganador ?? 0)

      let ganador = 'pendiente'
      let resultadoTexto = 'PENDIENTE'

      if (estaFinalizado) {
        if (empate) {
          ganador = 'empate'
          resultadoTexto = 'EMPATE'
        } else if (ganadorNumero === 1) {
          ganador = esJugador1 ? 'local' : 'rival'
          resultadoTexto = esJugador1 ? '¡VICTORIA!' : 'DERROTA'
        } else if (ganadorNumero === 2) {
          ganador = esJugador1 ? 'rival' : 'local'
          resultadoTexto = esJugador1 ? 'DERROTA' : '¡VICTORIA!'
        }
      }

      return {
        idPartida: Number(respuesta?.id ?? idDuelo ?? 0),
        estado,
        ganador,
        jugadorLocal: {
          nombre: nombreLocal,
          alias: generarAlias(nombreLocal),
          avatar: generarAvatar(nombreLocal),
          puntaje: puntajeLocal,
          aciertos: aciertosLocal,
          totalPreguntas: 10,
          tiempoPromedio: 0,
        },
        oponente: {
          nombre: nombreRival,
          alias: generarAlias(nombreRival),
          avatar: generarAvatar(nombreRival),
          puntaje: puntajeRival,
          aciertos: aciertosRival,
          totalPreguntas: 10,
          tiempoPromedio: 0,
        },
        resumen: {
          diferencia: Math.abs(puntajeLocal - puntajeRival),
          porcentajeLocal: Math.round((aciertosLocal / 10) * 100),
          porcentajeOponente: Math.round((aciertosRival / 10) * 100),
        },
        resultadoTexto,
      }
    })
    .catch(() => {
      const nombreUsuario = usuarioActual?.nombre || 'Tú'
      return {
        idPartida: idDuelo ?? 'duelo-demo',
        estado: 'PENDIENTE',
        ganador: 'local',
        jugadorLocal: {
          nombre: nombreUsuario,
          alias: generarAlias(nombreUsuario),
          avatar: generarAvatar(nombreUsuario),
          puntaje: 0,
          aciertos: 0,
          totalPreguntas: 10,
          tiempoPromedio: 0,
        },
        oponente: {
          nombre: 'Rival',
          alias: 'Oponente',
          avatar: 'RV',
          puntaje: 0,
          aciertos: 0,
          totalPreguntas: 10,
          tiempoPromedio: 0,
        },
        resumen: {
          diferencia: 0,
          porcentajeLocal: 0,
          porcentajeOponente: 0,
        },
        resultadoTexto: 'PENDIENTE',
      }
    })
}

export function solicitarRevanchaDuelo(idDuelo) {
  return solicitarApi('/api/duelos/online', { metodo: 'POST', datos: {} })
    .then((respuesta) => ({
      idDuelo: respuesta?.id ?? idDuelo,
      solicitudEnviada: true,
      destino: '/duelo/esperando',
      mensaje: 'Se está buscando un rival nuevo.',
    }))
    .catch(() => ({
      idDuelo,
      solicitudEnviada: true,
      destino: '/duelo/esperando',
      mensaje: 'Se está buscando un rival nuevo.',
    }))
}

export function consultarEstadoDuelo(idDuelo, usuarioActual = null) {
  if (!idDuelo) return Promise.resolve(null)
  return solicitarApi(`/api/duelos/${encodeURIComponent(idDuelo)}`)
    .then((respuesta) => {
      const estado = String(respuesta?.estado ?? '').toUpperCase()
      const tieneRival = estado === 'EN_CURSO' || estado === 'FINALIZADA' || estado === 'FINALIZADO'

      const idUsuarioActual = usuarioActual?.id ? Number(usuarioActual.id) : null
      const esJugador1 = idUsuarioActual !== null ? Number(respuesta?.jugador1_id) === idUsuarioActual : true

      const rivalId = esJugador1 ? (respuesta?.jugador2_id ?? null) : respuesta?.jugador1_id
      const rivalNombre = esJugador1 ? (respuesta?.jugador2_nombre || null) : (respuesta?.jugador1_nombre || null)
      const rivalPuntaje = esJugador1 ? Number(respuesta?.puntaje_jugador2 ?? 0) : Number(respuesta?.puntaje_jugador1 ?? 0)
      const rivalAciertos = esJugador1 ? Number(respuesta?.aciertos_jugador2 ?? 0) : Number(respuesta?.aciertos_jugador1 ?? 0)

      const nombreLocal = esJugador1
        ? (respuesta?.jugador1_nombre || usuarioActual?.nombre || 'Tú')
        : (respuesta?.jugador2_nombre || usuarioActual?.nombre || 'Tú')

      const puntajeLocal = esJugador1 ? Number(respuesta?.puntaje_jugador1 ?? 0) : Number(respuesta?.puntaje_jugador2 ?? 0)
      const aciertosLocal = esJugador1 ? Number(respuesta?.aciertos_jugador1 ?? 0) : Number(respuesta?.aciertos_jugador2 ?? 0)

      const rival = (tieneRival && rivalNombre)
        ? {
            id: rivalId ?? 'rival-online',
            nombre: rivalNombre,
            alias: generarAlias(rivalNombre),
            avatar: generarAvatar(rivalNombre),
            nivel: 'Online',
            puntuacion: rivalPuntaje,
            aciertos: rivalAciertos,
          }
        : null

      const jugadorLocal = {
        id: idUsuarioActual ?? (esJugador1 ? respuesta?.jugador1_id : respuesta?.jugador2_id) ?? 0,
        nombre: nombreLocal,
        alias: generarAlias(nombreLocal),
        avatar: generarAvatar(nombreLocal),
        puntuacion: puntajeLocal,
        aciertos: aciertosLocal,
      }

      return {
        id: Number(respuesta?.id ?? idDuelo),
        estado,
        jugadorLocal,
        rival,
        dueloCompleto: respuesta,
      }
    })
    .catch(() => null)
}

export function buscarRivalDuelo(usuarioActual = null) {
  return solicitarApi('/api/duelos/online', { metodo: 'POST', datos: {} })
    .then((respuesta) => {
      const duelo = normalizarDueloOnline(respuesta, usuarioActual)
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('dueloActual', JSON.stringify(duelo))
      }
      return duelo
    })
    .catch(() => {
      const fallback = {
        id: Date.now(),
        estado: 'PENDIENTE_RIVAL',
        modalidad: 'online',
        categoriaId: null,
        preguntas: preguntasDueloBase.map((pregunta) => ({ ...pregunta, id: String(pregunta.id) })),
        rival: null,
      }

      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('dueloActual', JSON.stringify(fallback))
      }

      return fallback
    })
}

export function cancelarBusquedaDuelo() {
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem('dueloActual')
  }
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
  consultarEstadoDuelo,
  cancelarBusquedaDuelo,
  obtenerResultadoDuelo,
  solicitarRevanchaDuelo,
  obtenerPreguntasDuelo,
  registrarRespuestaDuelo,
  simularRespuestaRival,
}
