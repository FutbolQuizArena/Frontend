// TODO (5.1.1): reemplazar estos datos por el endpoint autenticado de listado
// cuando el backend publique su ruta, filtros, paginación y contrato de respuesta.
let preguntasTemporales = [
  { id: 1, enunciado: '¿Qué selección ganó el Mundial de 2022?', categoria: 'Mundiales', dificultad: 'Fácil' },
  { id: 2, enunciado: '¿En qué año ganó Argentina su primer Mundial?', categoria: 'Mundiales', dificultad: 'Media' },
  { id: 3, enunciado: '¿Qué club ganó la Champions League de 2023?', categoria: 'Champions League', dificultad: 'Fácil' },
  { id: 4, enunciado: '¿Quién marcó el gol de la final del Mundial de 2014?', categoria: 'Mundiales', dificultad: 'Media' },
  { id: 5, enunciado: '¿Qué equipo ganó la Copa Libertadores de 2018?', categoria: 'Copa Libertadores', dificultad: 'Media' },
  { id: 6, enunciado: '¿Cuántos mundiales ganó Brasil hasta 2022?', categoria: 'Mundiales', dificultad: 'Fácil' },
  { id: 7, enunciado: '¿Qué club tiene más títulos de Champions League?', categoria: 'Champions League', dificultad: 'Media' },
  { id: 8, enunciado: '¿Quién ganó la Copa América de 2021?', categoria: 'Copa América', dificultad: 'Fácil' },
  { id: 9, enunciado: '¿En qué país se jugó el Mundial de 2010?', categoria: 'Mundiales', dificultad: 'Fácil' },
  { id: 10, enunciado: '¿Qué equipo ganó la Libertadores de 2019?', categoria: 'Copa Libertadores', dificultad: 'Media' },
  { id: 11, enunciado: '¿Quién ganó la Eurocopa de 2024?', categoria: 'Eurocopa', dificultad: 'Media' },
  { id: 12, enunciado: '¿Qué país ganó la primera Copa del Mundo?', categoria: 'Mundiales', dificultad: 'Difícil' },
]

const respuestasTemporales = {
  1: ['Argentina', 'Francia', 'Brasil', 'Alemania'],
  2: ['1978', '1986', '1990', '2022'],
  3: ['Manchester City', 'Real Madrid', 'Inter', 'Bayern Múnich'],
  4: ['Mario Götze', 'Lionel Messi', 'Thomas Müller', 'André Schürrle'],
  5: ['River Plate', 'Boca Juniors', 'Flamengo', 'Palmeiras'],
  6: ['5', '4', '3', '6'],
  7: ['Real Madrid', 'Milan', 'Liverpool', 'Bayern Múnich'],
  8: ['Argentina', 'Brasil', 'Chile', 'Uruguay'],
  9: ['Sudáfrica', 'Brasil', 'Alemania', 'Rusia'],
  10: ['Flamengo', 'River Plate', 'Palmeiras', 'Boca Juniors'],
  11: ['España', 'Inglaterra', 'Italia', 'Francia'],
  12: ['Uruguay', 'Argentina', 'Brasil', 'Italia'],
}

preguntasTemporales = preguntasTemporales.map((pregunta) => ({
  ...pregunta,
  opciones: respuestasTemporales[pregunta.id],
  respuestaCorrecta: 0,
}))

function copiarPregunta(pregunta) {
  return { ...pregunta, opciones: [...pregunta.opciones] }
}

export async function obtenerPreguntasAdmin() {
  return preguntasTemporales.map(copiarPregunta)
}

export async function obtenerPreguntaAdmin(idPregunta) {
  const pregunta = preguntasTemporales.find((elemento) => elemento.id === Number(idPregunta))
  if (!pregunta) throw new Error('No encontramos esa pregunta.')
  return copiarPregunta(pregunta)
}

// TODO (5.1.1): conectar alta y edición con los endpoints administrativos reales.
export async function crearPreguntaAdmin(datosPregunta) {
  const id = Math.max(0, ...preguntasTemporales.map((pregunta) => pregunta.id)) + 1
  const pregunta = copiarPregunta({ id, ...datosPregunta })
  preguntasTemporales = [pregunta, ...preguntasTemporales]
  return copiarPregunta(pregunta)
}

export async function actualizarPreguntaAdmin(idPregunta, datosPregunta) {
  const indice = preguntasTemporales.findIndex((pregunta) => pregunta.id === Number(idPregunta))
  if (indice < 0) throw new Error('No encontramos esa pregunta.')
  const pregunta = copiarPregunta({ id: Number(idPregunta), ...datosPregunta })
  preguntasTemporales = preguntasTemporales.map((elemento, posicion) => posicion === indice ? pregunta : elemento)
  return copiarPregunta(pregunta)
}
