// Las pruebas interceptan HTTP con el contrato del backend para controlar cada recorrido.
export function crearPreguntaPartida(id = 901) {
  return { id, orden: id - 900, enunciado: `Pregunta de prueba ${id}`, opcion_a: 'A', opcion_b: 'B', opcion_c: 'C', opcion_d: 'D' }
}

export async function prepararPartidaIndividual(pagina, cantidad) {
  await pagina.route('**/api/partidas/individual', (ruta) => ruta.fulfill({ json: {
    id: 42, estado: 'EN_CURSO', categoria_id: 1, categoria_nombre: 'Historia',
    preguntas: Array.from({ length: cantidad }, (_, indice) => crearPreguntaPartida(901 + indice)),
  } }))
  await pagina.route('**/api/partidas/preguntas/*/respuesta', (ruta) => {
    const correcta = ruta.request().postDataJSON().opcion_seleccionada === 'A'
    return ruta.fulfill({ json: { es_correcta: correcta, puntaje_obtenido: correcta ? 100 : 0 } })
  })
  await pagina.route('**/api/partidas/42/resultado', (ruta) => ruta.fulfill({ json: {
    partida_id: 42, puntaje_final: cantidad * 100, fecha_fin: '2026-10-29T12:00:00Z',
  } }))
}

export async function prepararResultadoDuelo(pagina, datos = {}) {
  await pagina.route('**/api/duelos/42', (ruta) => ruta.fulfill({ json: {
    id: 42, estado: 'FINALIZADA', jugador1_id: 1, jugador1_nombre: 'Lucas',
    jugador2_id: 2, jugador2_nombre: 'Rival', numero_ganador: 1,
    puntaje_jugador1: 100, puntaje_jugador2: 0, aciertos_jugador1: 1, aciertos_jugador2: 0,
    ...datos,
  } }))
}

export async function prepararDueloOnline(pagina) {
  await pagina.route('**/api/duelos/online', (ruta) => ruta.fulfill({ json: {
    id: 42, estado: 'EN_CURSO', categoria_nombre: 'Historia', jugador1_id: 1,
    jugador1_nombre: 'Lucas', jugador2_id: 2, jugador2_nombre: 'Rival',
    preguntas: [crearPreguntaPartida()],
  } }))
  await pagina.route('**/api/duelos/preguntas/901/respuesta', (ruta) => ruta.fulfill({ json: {
    es_correcta: true, puntaje_obtenido: 100,
  } }))
  await prepararResultadoDuelo(pagina)
}
