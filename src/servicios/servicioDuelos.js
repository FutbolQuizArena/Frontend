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
  {
    id: 'duelo-mundiales-1',
    categoria: 'Mundiales',
    enunciado: '¿Cuál selección fue campeona del Mundial 2022?',
    opciones: [
      { id: 'A', texto: 'Francia' },
      { id: 'B', texto: 'Argentina' },
      { id: 'C', texto: 'Brasil' },
      { id: 'D', texto: 'Alemania' },
    ],
    opcionCorrectaId: 'B',
  },
  {
    id: 'duelo-clubes-1',
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
    id: 'duelo-jugadores-1',
    categoria: 'Jugadores',
    enunciado: '¿Quién ganó el Balón de Oro 2023?',
    opciones: [
      { id: 'A', texto: 'Kylian Mbappé' },
      { id: 'B', texto: 'Erling Haaland' },
      { id: 'C', texto: 'Lionel Messi' },
      { id: 'D', texto: 'Kevin De Bruyne' },
    ],
    opcionCorrectaId: 'C',
  },
  {
    id: 'duelo-reglas-1',
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
]

function mapearPreguntaDuelo(pregunta) {
  return {
    id: String(pregunta.id),
    categoria: 'Aleatoria',
    enunciado: pregunta.enunciado,
    opciones: [
      { id: 'A', texto: pregunta.opcion_a },
      { id: 'B', texto: pregunta.opcion_b },
      { id: 'C', texto: pregunta.opcion_c },
      { id: 'D', texto: pregunta.opcion_d },
    ],
    opcionCorrectaId: 'A',
  }
}

function normalizarDueloOnline(respuesta) {
  const preguntas = Array.isArray(respuesta?.preguntas) ? respuesta.preguntas.map(mapearPreguntaDuelo) : []

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
      const jugadorLocal = { nombre: 'Lucas', alias: 'Luki', avatar: 'LM', puntaje: Number(respuesta?.puntaje_jugador1 ?? 0), aciertos: 0, totalPreguntas: 10, tiempoPromedio: 0 }
      const oponente = { nombre: 'Rival', alias: 'Oponente', avatar: 'RV', puntaje: Number(respuesta?.puntaje_jugador2 ?? 0), aciertos: 0, totalPreguntas: 10, tiempoPromedio: 0 }

      const ganador = Number(respuesta?.numero_ganador ?? 0)
      const resultadoTexto = respuesta?.es_empate ? 'EMPATE' : (ganador === 1 ? '¡VICTORIA!' : 'DERROTA')

      return {
        idPartida: idDuelo,
        ganador: respuesta?.es_empate ? 'empate' : (ganador === 1 ? 'local' : 'rival'),
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
          return duelo.preguntas
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
  if (!Number.isFinite(preguntaId) || preguntaId <= 0) {
    return {
      idDuelo,
      idPregunta,
      opcionSeleccionada,
      tiempoEmpleado,
      registrado: true,
    }
  }

  return solicitarApi(`/api/duelos/preguntas/${encodeURIComponent(preguntaId)}/respuesta`, {
    metodo: 'POST',
    datos: {
      opcion_seleccionada: String(opcionSeleccionada ?? '').toUpperCase(),
      tiempo_respuesta_segundos: Number(tiempoEmpleado) || 0,
    },
  }).then((respuesta) => ({
    idDuelo,
    idPregunta,
    opcionSeleccionada: String(opcionSeleccionada ?? '').toUpperCase(),
    tiempoEmpleado: Number(tiempoEmpleado) || 0,
    registrado: true,
    esCorrecta: Boolean(respuesta?.es_correcta),
    puntajeObtenido: Number(respuesta?.puntaje_obtenido ?? 0),
  })).catch(() => ({
    idDuelo,
    idPregunta,
    opcionSeleccionada: String(opcionSeleccionada ?? '').toUpperCase(),
    tiempoEmpleado: Number(tiempoEmpleado) || 0,
    registrado: true,
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
