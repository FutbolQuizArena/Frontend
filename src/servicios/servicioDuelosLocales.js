const preguntasPorJugador = 4

const preguntasBaseLocal = [
  {
    id: 'local-pregunta-1',
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
    id: 'local-pregunta-2',
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
    id: 'local-pregunta-3',
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
  {
    id: 'local-pregunta-4',
    categoria: 'Duración',
    enunciado: '¿Cuánto dura un partido de fútbol profesional reglamentario?',
    opciones: [
      { id: 'a', texto: '60 minutos' },
      { id: 'b', texto: '75 minutos' },
      { id: 'c', texto: '90 minutos' },
      { id: 'd', texto: '120 minutos' },
    ],
    opcionCorrectaId: 'c',
  },
  {
    id: 'local-pregunta-5',
    categoria: 'Europa',
    enunciado: '¿Qué equipo ganó la Champions League 2022?',
    opciones: [
      { id: 'a', texto: 'Liverpool' },
      { id: 'b', texto: 'Real Madrid' },
      { id: 'c', texto: 'Manchester City' },
      { id: 'd', texto: 'Bayern Munich' },
    ],
    opcionCorrectaId: 'b',
  },
  {
    id: 'local-pregunta-6',
    categoria: 'Mundiales',
    enunciado: '¿Qué selección ganó la Copa del Mundo de 2022?',
    opciones: [
      { id: 'a', texto: 'Argentina' },
      { id: 'b', texto: 'Brasil' },
      { id: 'c', texto: 'Francia' },
      { id: 'd', texto: 'Alemania' },
    ],
    opcionCorrectaId: 'a',
  },
  {
    id: 'local-pregunta-7',
    categoria: 'Sedes',
    enunciado: '¿Qué país organizó el Mundial de 2022?',
    opciones: [
      { id: 'a', texto: 'Rusia' },
      { id: 'b', texto: 'Catar' },
      { id: 'c', texto: 'Brasil' },
      { id: 'd', texto: 'Qatar' },
    ],
    opcionCorrectaId: 'b',
  },
  {
    id: 'local-pregunta-8',
    categoria: 'Técnica',
    enunciado: '¿Qué tarjeta se muestra cuando un jugador comete una falta grave?',
    opciones: [
      { id: 'a', texto: 'Tarjeta amarilla' },
      { id: 'b', texto: 'Tarjeta roja' },
      { id: 'c', texto: 'Tarjeta azul' },
      { id: 'd', texto: 'Tarjeta verde' },
    ],
    opcionCorrectaId: 'b',
  },
]

if (preguntasBaseLocal.length !== preguntasPorJugador * 2) {
  throw new Error(`El duelo local debe tener ${preguntasPorJugador * 2} preguntas para 4 por jugador.`)
}

export function obtenerPreguntasDueloLocal() {
  return preguntasBaseLocal
}

// TODO: reemplazar por endpoint real cuando el backend de duelos locales esté listo (POST /api/duelos/locales)
export function iniciarDueloLocal(nombreJugador1, nombreJugador2, categoriaId = 'general') {
  return Promise.resolve({
    idDueloLocal: `duelo-local-${Date.now()}`,
    categoriaId,
    estado: 'en_curso',
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
    preguntas: obtenerPreguntasDueloLocal(),
  })
}

// TODO: reemplazar por endpoint real cuando el backend de duelos locales esté listo (POST /api/duelos/locales)
export function registrarRespuestaTurnoLocal(idDueloLocal, jugadorId, idPregunta, opcionSeleccionada, tiempoEmpleado) {
  return Promise.resolve({
    idDueloLocal,
    jugadorId,
    idPregunta,
    opcionSeleccionada,
    tiempoEmpleado,
    registrado: true,
  })
}

// TODO: reemplazar por endpoint real cuando el backend de duelos locales esté listo (POST /api/duelos/locales)
export function guardarResultadoDueloLocal(idDueloLocal, datosResumen) {
  return Promise.resolve({
    idDueloLocal,
    ...datosResumen,
    guardado: true,
  })
}

export default {
  iniciarDueloLocal,
  registrarRespuestaTurnoLocal,
  guardarResultadoDueloLocal,
  obtenerPreguntasDueloLocal,
}
