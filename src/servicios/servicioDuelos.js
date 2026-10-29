import { solicitarApi } from './clienteApi.js'

function mapearPreguntaDuelo(pregunta, categoriaPorDefecto = 'Fútbol') {
  const idPregunta = Number(pregunta?.id ?? 0)
  const opciones = [
    { id: 'A', texto: pregunta?.opcion_a ?? 'Opción A' },
    { id: 'B', texto: pregunta?.opcion_b ?? 'Opción B' },
    { id: 'C', texto: pregunta?.opcion_c ?? 'Opción C' },
    { id: 'D', texto: pregunta?.opcion_d ?? 'Opción D' },
  ]

  return {
    id: String(idPregunta || pregunta?.orden || 'pregunta-duelo'),
    categoria: pregunta?.categoria || categoriaPorDefecto || 'Fútbol',
    enunciado: pregunta?.enunciado ?? 'Pregunta del duelo',
    opciones,
    orden: Number(pregunta?.orden ?? 1),
    estaRespondida: Boolean(pregunta?.esta_respondida),
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

// Identifica al usuario conectado entre los dos jugadores y adapta sus preguntas y rival.
export function normalizarDueloOnline(respuesta, usuarioActual = null) {
  const categoriaNombre = respuesta?.categoria_nombre || respuesta?.categoriaNombre || 'Fútbol'

  const preguntas = Array.isArray(respuesta?.preguntas)
    ? respuesta.preguntas.map((pregunta) => mapearPreguntaDuelo(pregunta, categoriaNombre))
    : []

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

  const rivalTextoNombre = rivalNombre || 'Rival'
  // Un duelo vencido puede estar FINALIZADA sin que exista un segundo jugador.
  const rival = estaEnCurso && respuesta?.jugador2_id != null
    ? {
        id: rivalId ?? 'rival-online',
        nombre: rivalTextoNombre,
        alias: generarAlias(rivalTextoNombre),
        avatar: generarAvatar(rivalTextoNombre),
        nivel: 'Online',
        puntuacion: rivalPuntaje,
      }
    : null

  return {
    id: Number(respuesta?.id ?? 0),
    estado,
    jugador2Id: respuesta?.jugador2_id ?? null,
    busquedaExpiraEn: respuesta?.busqueda_expira_en ?? null,
    modalidad: respuesta?.modalidad ?? 'online',
    categoriaId: respuesta?.categoria_id ?? null,
    categoriaNombre,
    jugadorLocal,
    rival,
    preguntas,
  }
}
 

function obtenerDatosJugadoresResultado(respuesta, esJugador1, usuarioActual) {
  const numeroLocal = esJugador1 ? 1 : 2
  const numeroRival = esJugador1 ? 2 : 1
  const nombreLocal = respuesta?.[`jugador${numeroLocal}_nombre`] || usuarioActual?.nombre || 'Tú'
  const nombreRival = respuesta?.[`jugador${numeroRival}_nombre`] || 'Rival'

  return {
    puntajeLocal: Number(respuesta?.[`puntaje_jugador${numeroLocal}`] ?? 0),
    puntajeRival: Number(respuesta?.[`puntaje_jugador${numeroRival}`] ?? 0),
    aciertosLocal: Number(respuesta?.[`aciertos_jugador${numeroLocal}`] ?? 0),
    aciertosRival: Number(respuesta?.[`aciertos_jugador${numeroRival}`] ?? 0),
    nombreLocal,
    nombreRival,
  }
}

function obtenerGanadorResultado(estaFinalizado, empate, ganadorNumero, esJugador1) {
  if (!estaFinalizado || (!empate && ganadorNumero !== 1 && ganadorNumero !== 2)) {
    return { ganador: 'pendiente', resultadoTexto: 'PENDIENTE' }
  }

  if (empate) return { ganador: 'empate', resultadoTexto: 'EMPATE' }

  const jugadorGanador = ganadorNumero === 1 ? 1 : 2
  const ganoJugadorLocal = jugadorGanador === (esJugador1 ? 1 : 2)
  return {
    ganador: ganoJugadorLocal ? 'local' : 'rival',
    resultadoTexto: ganoJugadorLocal ? '¡VICTORIA!' : 'DERROTA',
  }
}

// Consulta los puntos de ambos jugadores y determina el ganador según el estado del backend.
export function obtenerResultadoDuelo(idDuelo, usuarioActual = null) {
  return solicitarApi(`/api/duelos/${encodeURIComponent(idDuelo)}`)
    .then((respuesta) => {
      const idUsuarioActual = usuarioActual?.id ? Number(usuarioActual.id) : null
      const esJugador1 = idUsuarioActual !== null ? Number(respuesta?.jugador1_id) === idUsuarioActual : true

      const datosJugadores = obtenerDatosJugadoresResultado(respuesta, esJugador1, usuarioActual)

      const estado = String(respuesta?.estado ?? '').toUpperCase()
      const estaFinalizado = estado === 'FINALIZADA' || estado === 'FINALIZADO'
      const empate = Boolean(respuesta?.es_empate)
      const ganadorNumero = Number(respuesta?.numero_ganador ?? 0)

      const resultadoGanador = obtenerGanadorResultado(estaFinalizado, empate, ganadorNumero, esJugador1)

      return {
        idPartida: Number(respuesta?.id ?? idDuelo ?? 0),
        estado,
        ganador: resultadoGanador.ganador,
        jugadorLocal: {
          nombre: datosJugadores.nombreLocal,
          alias: generarAlias(datosJugadores.nombreLocal),
          avatar: generarAvatar(datosJugadores.nombreLocal),
          puntaje: datosJugadores.puntajeLocal,
          aciertos: datosJugadores.aciertosLocal,
          totalPreguntas: 10,
          tiempoPromedio: 0,
        },
        oponente: {
          nombre: datosJugadores.nombreRival,
          alias: generarAlias(datosJugadores.nombreRival),
          avatar: generarAvatar(datosJugadores.nombreRival),
          puntaje: datosJugadores.puntajeRival,
          aciertos: datosJugadores.aciertosRival,
          totalPreguntas: 10,
          tiempoPromedio: 0,
        },
        resumen: {
          diferencia: Math.abs(datosJugadores.puntajeLocal - datosJugadores.puntajeRival),
          porcentajeLocal: Math.round((datosJugadores.aciertosLocal / 10) * 100),
          porcentajeOponente: Math.round((datosJugadores.aciertosRival / 10) * 100),
        },
        resultadoTexto: resultadoGanador.resultadoTexto,
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
}

// Recupera el estado del emparejamiento y los datos del rival para actualizar la espera.
export function consultarEstadoDuelo(idDuelo, usuarioActual = null) {
  if (!idDuelo) return Promise.resolve(null)
  return solicitarApi(`/api/duelos/${encodeURIComponent(idDuelo)}`)
    .then((respuesta) => {
      const estado = String(respuesta?.estado ?? '').toUpperCase()
      // El estado final por vencimiento no implica que se haya emparejado otro jugador.
      const tieneRival = respuesta?.jugador2_id != null && (estado === 'EN_CURSO' || estado === 'FINALIZADA' || estado === 'FINALIZADO')

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

      const rivalTextoNombre = rivalNombre || 'Rival'
      const rival = tieneRival
        ? {
            id: rivalId ?? 'rival-online',
            nombre: rivalTextoNombre,
            alias: generarAlias(rivalTextoNombre),
            avatar: generarAvatar(rivalTextoNombre),
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
        jugador2Id: respuesta?.jugador2_id ?? null,
        busquedaExpiraEn: respuesta?.busqueda_expira_en ?? null,
        categoriaNombre: respuesta?.categoria_nombre || respuesta?.categoriaNombre || 'Fútbol',
        jugadorLocal,
        rival,
        dueloCompleto: respuesta,
      }
    })
    .catch(() => null)
}

// Solicita un rival y guarda el duelo recibido en sessionStorage para abrir la partida.
export function buscarRivalDuelo(usuarioActual = null) {
  return solicitarApi('/api/duelos/online', { metodo: 'POST', datos: {} })
    .then((respuesta) => {
      const duelo = normalizarDueloOnline(respuesta, usuarioActual)
      if (!duelo.id || duelo.preguntas.length === 0) throw new Error('El servidor no devolvió un duelo con preguntas.')
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('dueloActual', JSON.stringify(duelo))
      }
      return duelo
    })
}

// Confirma la cancelación en el servidor antes de borrar los datos de esta pestaña.
export async function cancelarBusquedaDuelo(idDuelo) {
  if (!Number.isInteger(Number(idDuelo)) || Number(idDuelo) <= 0) {
    throw new Error('No se pudo identificar la búsqueda para cancelarla.')
  }
  const respuesta = await solicitarApi(`/api/duelos/${encodeURIComponent(idDuelo)}/cancelar`, { metodo: 'POST' })
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem('dueloActual')
  }
  return respuesta
}

// Recupera las preguntas guardadas y comprueba que tengan identificadores numéricos válidos.
export function obtenerPreguntasDuelo() {
  if (typeof window !== 'undefined') {
    const dueloGuardado = window.sessionStorage.getItem('dueloActual')
    if (dueloGuardado) {
      try {
        const duelo = JSON.parse(dueloGuardado)
        const categoriaPredeterminada = duelo?.categoriaNombre || duelo?.categoria_nombre || 'Fútbol'
        if (Array.isArray(duelo?.preguntas) && duelo.preguntas.length > 0 &&
          duelo.preguntas.every((pregunta) => Number.isInteger(Number(pregunta.id)) && Number(pregunta.id) > 0)) {
          return duelo.preguntas.map((pregunta) => ({
            ...pregunta,
            id: String(pregunta.id),
            categoria: (pregunta.categoria && pregunta.categoria !== 'Aleatoria') ? pregunta.categoria : categoriaPredeterminada,
          }))
        }
      } catch {
        return []
      }
    }
  }

  // La partida solo puede usar preguntas asignadas por el servidor al jugador.
  return []
}

// Envía la respuesta al servidor y devuelve su confirmación con los puntos obtenidos.
export function registrarRespuestaDuelo(idDuelo, idPregunta, opcionSeleccionada, tiempoEmpleado) {
  const preguntaId = Number(idPregunta)
  const opcionNormalizada = String(opcionSeleccionada ?? '').toUpperCase()

  if (!Number.isFinite(preguntaId) || preguntaId <= 0) {
    return Promise.reject(new Error('No se pudo identificar la pregunta del duelo.'))
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
  }))
}

export default {
  buscarRivalDuelo,
  consultarEstadoDuelo,
  cancelarBusquedaDuelo,
  obtenerResultadoDuelo,
  solicitarRevanchaDuelo,
  obtenerPreguntasDuelo,
  registrarRespuestaDuelo,
}
