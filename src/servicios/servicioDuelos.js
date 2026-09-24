const preguntasDueloBase = [
  {
    id: 'duelo-historia-1',
    categoria: 'Historia',
    enunciado: '¿Qué selección ganó la Copa Mundial de 2018?',
    opciones: [
      { id: 'a', texto: 'Francia' },
      { id: 'b', texto: 'Alemania' },
      { id: 'c', texto: 'Brasil' },
      { id: 'd', texto: 'Argentina' },
    ],
    opcionCorrectaId: 'a',
  },
  {
    id: 'duelo-mundiales-1',
    categoria: 'Mundiales',
    enunciado: '¿Cuál selección fue campeona del Mundial 2022?',
    opciones: [
      { id: 'a', texto: 'Francia' },
      { id: 'b', texto: 'Argentina' },
      { id: 'c', texto: 'Brasil' },
      { id: 'd', texto: 'Alemania' },
    ],
    opcionCorrectaId: 'b',
  },
  {
    id: 'duelo-clubes-1',
    categoria: 'Clubes',
    enunciado: '¿Qué club es conocido como “Los Blancos”?',
    opciones: [
      { id: 'a', texto: 'Barcelona' },
      { id: 'b', texto: 'Real Madrid' },
      { id: 'c', texto: 'Juventus' },
      { id: 'd', texto: 'Bayern' },
    ],
    opcionCorrectaId: 'b',
  },
  {
    id: 'duelo-jugadores-1',
    categoria: 'Jugadores',
    enunciado: '¿Quién ganó el Balón de Oro 2023?',
    opciones: [
      { id: 'a', texto: 'Kylian Mbappé' },
      { id: 'b', texto: 'Erling Haaland' },
      { id: 'c', texto: 'Lionel Messi' },
      { id: 'd', texto: 'Kevin De Bruyne' },
    ],
    opcionCorrectaId: 'c',
  },
  {
    id: 'duelo-reglas-1',
    categoria: 'Reglas',
    enunciado: '¿Cuántos jugadores puede haber en el campo por equipo al inicio del partido?',
    opciones: [
      { id: 'a', texto: '9' },
      { id: 'b', texto: '10' },
      { id: 'c', texto: '11' },
      { id: 'd', texto: '12' },
    ],
    opcionCorrectaId: 'c',
  },
]

// TODO: reemplazar por endpoint real cuando el backend de duelos esté listo (GET /api/duelos/:id/resultado)
export function obtenerResultadoDuelo(idDuelo) {
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

  return Promise.resolve(base)
}

// TODO: reemplazar por endpoint real cuando el backend de duelos esté listo (POST /api/duelos/:id/revancha)
export function solicitarRevanchaDuelo(idDuelo) {
  return Promise.resolve({
    idDuelo,
    solicitudEnviada: true,
    destino: '/duelo/esperando',
    mensaje: 'Se está buscando un rival nuevo.',
  })
}

export function buscarRivalDuelo() {
  const demoraBase = typeof window !== 'undefined' && Number.isFinite(window.__DUELO_TIMEOUT__)
    ? Number(window.__DUELO_TIMEOUT__)
    : 3500

  const demora = demoraBase + Math.floor(Math.random() * 1000)

  return new Promise((resolver) => {
    window.setTimeout(() => {
      const rivalMock = typeof window !== 'undefined' ? window.__DUELO_RIVAL__ : undefined
      resolver(rivalMock ?? {
        id: 'rival-demo',
        nombre: 'Rival',
        alias: 'Oponente',
        avatar: 'RV',
        nivel: 'Pro',
        puntuacion: 1400,
      })
    }, demora)
  })
}

export function cancelarBusquedaDuelo() {
  return true
}

// TODO: reemplazar por endpoint real cuando el backend de duelos esté listo (GET /api/duelos/:id/preguntas)
export function obtenerPreguntasDuelo(idDuelo) {
  return preguntasDueloBase.map((pregunta, indice) => ({
    ...pregunta,
    id: `${pregunta.id}-${idDuelo ?? 'duelo-demo'}-${indice}`,
  }))
}

// TODO: reemplazar por endpoint real cuando el backend de duelos esté listo (POST /api/duelos/:id/respuestas)
export function registrarRespuestaDuelo(idDuelo, idPregunta, opcionSeleccionada, tiempoEmpleado) {
  return {
    idDuelo,
    idPregunta,
    opcionSeleccionada,
    tiempoEmpleado,
    registrado: true,
  }
}

// TODO: reemplazar por endpoint real cuando el backend de duelos esté listo (GET /api/duelos/:id/rival-respuesta)
export function simularRespuestaRival(idPregunta) {
  const correcta = Math.random() > 0.45

  return {
    idPregunta,
    correcta,
    opcionSeleccionada: correcta ? 'a' : 'd',
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
