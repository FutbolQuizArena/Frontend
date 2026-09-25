// TODO (5.1.1): reemplazar estos datos por el endpoint autenticado de listado
// cuando el backend publique su ruta, filtros, paginación y contrato de respuesta.
const preguntasTemporales = [
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

export async function obtenerPreguntasAdmin() {
  return preguntasTemporales.map((pregunta) => ({ ...pregunta }))
}
