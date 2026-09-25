import { solicitarApi } from './clienteApi.js'
import { obtenerPerfil } from './servicioPerfil.js'

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
    categoria: pregunta?.categoria ?? 'Aleatoria',
    enunciado: pregunta?.enunciado ?? 'Pregunta del duelo',
    opciones,
    opcionCorrectaId: obtenerOpcionCorrectaDemo(idPregunta || pregunta?.orden || 1),
    orden: Number(pregunta?.orden ?? 1),
  }
}

function crearPerfilJugador({ id = null, nombre = 'Jugador', alias = '', avatar = '', nivel = 'Jugador', puntuacion = 0 } = {}) {
  const nombreNormalizado = String(nombre || 'Jugador').trim() || 'Jugador'
  const aliasNormalizado = String(alias || nombreNormalizado.split(' ')[0] || 'Jugador').trim() || 'Jugador'
  const avatarNormalizado = String(avatar || nombreNormalizado.split(/\s+/).slice(0, 2).map((parte) => parte[0]).join('').toUpperCase() || 'J').trim() || 'J'

  return {
    id: id ?? null,
    nombre: nombreNormalizado,
    alias: aliasNormalizado,
    avatar: avatarNormalizado,
    nivel: String(nivel || 'Jugador').trim() || 'Jugador',
    puntuacion: Number(puntuacion ?? 0),
  }
}

export async function consultarEstadoDuelo(idDuelo) {
  if (!idDuelo) {
    return null
  }

  try {
    const respuesta = await solicitarApi(`/api/duelos/${encodeURIComponent(idDuelo)}`)
    const perfil = await obtenerPerfil().catch(() => null)
    const miId = perfil?.id != null ? Number(perfil.id) : null

    const estado = String(respuesta?.estado ?? '').toUpperCase()
    const j1Id = respuesta?.jugador1_id != null ? Number(respuesta.jugador1_id) : null
    const j2Id = respuesta?.jugador2_id != null ? Number(respuesta.jugador2_id) : null

    let rivalId = null
    if (miId != null) {
      if (miId === j1Id) {
        rivalId = j2Id
      } else if (miId === j2Id) {
        rivalId = j1Id
      } else {
        rivalId = j2Id ?? j1Id
      }
    } else {
      rivalId = j2Id ?? j1Id
    }

    const tieneRival = (estado === 'EN_CURSO' || estado === 'FINALIZADO') && rivalId != null && Number(rivalId) !== 0
    const rival = tieneRival
      ? crearPerfilJugador({
          id: rivalId,
          nombre: respuesta?.jugador2_nombre ?? 'Rival',
          alias: respuesta?.jugador2_alias ?? 'Oponente',
          avatar: respuesta?.jugador2_avatar ?? 'RV',
          nivel: respuesta?.jugador2_nivel ?? 'Online',
          puntuacion: (miId === j1Id ? respuesta?.puntaje_jugador2 : respuesta?.puntaje_jugador1) ?? 0,
        })
      : null

    const jugadorLocal = crearPerfilJugador({
      id: miId ?? j1Id,
      nombre: perfil?.nombre ?? (respuesta?.jugador1_nombre ?? 'Jugador'),
      alias: perfil?.nombre ? perfil.nombre.split(' ')[0] : 'Jugador',
      avatar: perfil?.iniciales ?? 'J',
      nivel: perfil?.rol ?? 'Jugador',
      puntuacion: (miId === j2Id ? respuesta?.puntaje_jugador2 : respuesta?.puntaje_jugador1) ?? 0,
    })

    return {
      id: Number(respuesta?.id ?? idDuelo),
      estado,
      modalidad: respuesta?.modalidad ?? 'online',
      categoriaId: respuesta?.categoria_id ?? null,
      jugador1_id: j1Id,
      jugador2_id: j2Id,
      puntaje_jugador1: Number(respuesta?.puntaje_jugador1 ?? 0),
      puntaje_jugador2: Number(respuesta?.puntaje_jugador2 ?? 0),
      numero_ganador: respuesta?.numero_ganador ?? null,
      es_empate: Boolean(respuesta?.es_empate),
      jugadorLocal,
      rival,
    }
  } catch {
    return null
  }
}

export async function buscarRivalDuelo() {
  const respuesta = await solicitarApi('/api/duelos/online', { metodo: 'POST', datos: {} })
  const perfil = await obtenerPerfil().catch(() => null)
  const miId = perfil?.id != null ? Number(perfil.id) : null

  const estado = String(respuesta?.estado ?? 'PENDIENTE_RIVAL').toUpperCase()
  const idDuelo = Number(respuesta?.id ?? 0)

  const preguntas = Array.isArray(respuesta?.preguntas) && respuesta.preguntas.length > 0
    ? respuesta.preguntas.map(mapearPreguntaDuelo)
    : preguntasDueloBase.map((pregunta, indice) => ({
        ...pregunta,
        id: `${pregunta.id}-${indice}`,
      }))

  let j1Id = respuesta?.jugador1_id != null ? Number(respuesta.jugador1_id) : null
  let j2Id = respuesta?.jugador2_id != null ? Number(respuesta.jugador2_id) : null
  let rival = null

  if (estado === 'EN_CURSO' || estado === 'FINALIZADO') {
    if ((j1Id == null || j2Id == null) && idDuelo > 0) {
      try {
        const estadoDetalle = await solicitarApi(`/api/duelos/${encodeURIComponent(idDuelo)}`)
        if (estadoDetalle?.jugador1_id != null) j1Id = Number(estadoDetalle.jugador1_id)
        if (estadoDetalle?.jugador2_id != null) j2Id = Number(estadoDetalle.jugador2_id)
      } catch {
        // Ignora fallo de consulta complementaria
      }
    }

    let rivalId = null
    if (miId != null) {
      if (miId === j1Id) {
        rivalId = j2Id
      } else if (miId === j2Id) {
        rivalId = j1Id
      } else {
        rivalId = j2Id ?? j1Id
      }
    } else {
      rivalId = j2Id ?? j1Id
    }

    const tieneRivalValido = rivalId != null && Number(rivalId) !== 0
    if (tieneRivalValido) {
      rival = crearPerfilJugador({
        id: rivalId ?? 'rival-online',
        nombre: respuesta?.jugador2_nombre ?? 'Rival',
        alias: respuesta?.jugador2_alias ?? 'Oponente',
        avatar: respuesta?.jugador2_avatar ?? 'RV',
        nivel: respuesta?.jugador2_nivel ?? 'Online',
        puntuacion: Number(respuesta?.puntaje_jugador2 ?? 0),
      })
    }
  }

  const jugadorLocal = crearPerfilJugador({
    id: miId ?? (j1Id ?? null),
    nombre: perfil?.nombre ?? (respuesta?.jugador1_nombre ?? 'Jugador'),
    alias: perfil?.nombre ? perfil.nombre.split(' ')[0] : 'Jugador',
    avatar: perfil?.iniciales ?? 'J',
    nivel: perfil?.rol ?? 'Jugador',
    puntuacion: perfil?.puntajeTotal ?? (respuesta?.puntaje_jugador1 ?? 0),
  })

  const duelo = {
    id: idDuelo,
    estado,
    modalidad: respuesta?.modalidad ?? 'online',
    categoriaId: respuesta?.categoria_id ?? null,
    jugador1_id: j1Id,
    jugador2_id: j2Id,
    preguntas,
    jugadorLocal,
    rival,
  }

  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem('dueloActual', JSON.stringify(duelo))
  }

  return duelo
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
  const tiempoNormalizado = Number(tiempoEmpleado) || 0

  if (!Number.isFinite(preguntaId) || preguntaId <= 0) {
    return Promise.resolve({
      idDuelo,
      idPregunta,
      opcionSeleccionada: opcionNormalizada,
      tiempoEmpleado: tiempoNormalizado,
      registrado: true,
      esCorrecta: opcionNormalizada === obtenerOpcionCorrectaDemo(1),
      puntajeObtenido: opcionNormalizada === obtenerOpcionCorrectaDemo(1) ? 100 : 0,
    })
  }

  return solicitarApi(`/api/duelos/preguntas/${encodeURIComponent(preguntaId)}/respuesta`, {
    metodo: 'POST',
    datos: {
      opcion_seleccionada: opcionNormalizada,
      tiempo_respuesta_segundos: tiempoNormalizado,
    },
  })
    .then((respuesta) => ({
      idDuelo,
      idPregunta,
      opcionSeleccionada: opcionNormalizada,
      tiempoEmpleado: tiempoNormalizado,
      registrado: true,
      esCorrecta: Boolean(respuesta?.es_correcta),
      puntajeObtenido: Number(respuesta?.puntaje_obtenido ?? 0),
    }))
    .catch(() => ({
      idDuelo,
      idPregunta,
      opcionSeleccionada: opcionNormalizada,
      tiempoEmpleado: tiempoNormalizado,
      registrado: true,
      esCorrecta: opcionNormalizada === obtenerOpcionCorrectaDemo(preguntaId),
      puntajeObtenido: opcionNormalizada === obtenerOpcionCorrectaDemo(preguntaId) ? 100 : 0,
    }))
}

export async function obtenerResultadoDuelo(idDuelo) {
  try {
    const perfilLocal = await obtenerPerfil().catch(() => ({
      id: null,
      nombre: 'Jugador',
      correo: '',
      rol: 'JUGADOR',
      puntajeTotal: 0,
      iniciales: 'J',
    }))

    const respuesta = await solicitarApi(`/api/duelos/${encodeURIComponent(idDuelo)}`)
    const miId = perfilLocal?.id != null ? Number(perfilLocal.id) : null
    const j1Id = respuesta?.jugador1_id != null ? Number(respuesta.jugador1_id) : null
    const j2Id = respuesta?.jugador2_id != null ? Number(respuesta.jugador2_id) : null

    const soyJugador1 = miId === j1Id
    const miPuntaje = soyJugador1 ? Number(respuesta?.puntaje_jugador1 ?? 0) : Number(respuesta?.puntaje_jugador2 ?? 0)
    const puntajeRival = soyJugador1 ? Number(respuesta?.puntaje_jugador2 ?? 0) : Number(respuesta?.puntaje_jugador1 ?? 0)

    const jugadorLocal = {
      nombre: perfilLocal?.nombre ?? 'Jugador',
      alias: perfilLocal?.nombre ? perfilLocal.nombre.split(' ')[0] : 'Jugador',
      avatar: perfilLocal?.iniciales ?? 'J',
      puntaje: miPuntaje,
      aciertos: 0,
      totalPreguntas: 10,
      tiempoPromedio: 0,
    }

    const oponente = {
      nombre: respuesta?.jugador2_nombre ?? 'Rival',
      alias: respuesta?.jugador2_alias ?? 'Oponente',
      avatar: respuesta?.jugador2_avatar ?? 'RV',
      puntaje: puntajeRival,
      aciertos: 0,
      totalPreguntas: 10,
      tiempoPromedio: 0,
    }

    const ganadorNumero = Number(respuesta?.numero_ganador ?? 0)
    const empate = Boolean(respuesta?.es_empate)
    let ganador = 'pendiente'
    if (empate) {
      ganador = 'empate'
    } else if (ganadorNumero === 1) {
      ganador = soyJugador1 ? 'local' : 'rival'
    } else if (ganadorNumero === 2) {
      ganador = soyJugador1 ? 'rival' : 'local'
    }

    const resultadoTexto = empate ? 'EMPATE' : (ganador === 'local' ? '¡VICTORIA!' : (ganador === 'rival' ? 'DERROTA' : 'EN CURSO'))

    return {
      idPartida: idDuelo,
      ganador,
      jugadorLocal,
      oponente,
      resumen: {
        diferencia: Math.abs(miPuntaje - puntajeRival),
        porcentajeLocal: 50,
        porcentajeOponente: 50,
      },
      resultadoTexto,
    }
  } catch {
    const perfilLocal = await obtenerPerfil().catch(() => ({
      nombre: 'Jugador',
      correo: '',
      rol: 'JUGADOR',
      puntajeTotal: 0,
      iniciales: 'J',
    }))

    return {
      idPartida: idDuelo ?? 'duelo-demo',
      ganador: 'local',
      jugadorLocal: {
        nombre: perfilLocal?.nombre ?? 'Jugador',
        alias: perfilLocal?.nombre ? perfilLocal.nombre.split(' ')[0] : 'Jugador',
        avatar: perfilLocal?.iniciales ?? 'J',
        puntaje: Number(perfilLocal?.puntajeTotal ?? 0),
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
  }
}

export function solicitarRevanchaDuelo(idDuelo) {
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem('dueloActual')
    window.sessionStorage.removeItem('resultadoDuelo')
  }
  return Promise.resolve({
    idDuelo,
    solicitudEnviada: true,
    destino: '/duelo/esperando',
    mensaje: 'Se está buscando un rival nuevo.',
  })
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
