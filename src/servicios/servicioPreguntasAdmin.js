import { solicitarApi } from './clienteApi.js'
import { esSesionAdminPrueba, obtenerToken } from './servicioSesion.js'

function usarEjemplos({ vistaPrevia = false } = {}) {
  return import.meta.env.DEV && (vistaPrevia || esSesionAdminPrueba(obtenerToken()))
}

function adaptarPregunta(pregunta) {
  return {
    id: pregunta.id, enunciado: pregunta.enunciado, categoria: pregunta.categoria_nombre || '',
    categoriaId: pregunta.categoria_id, dificultad: pregunta.dificultad || 'Media', estado: pregunta.estado,
    opciones: [pregunta.opcion_a, pregunta.opcion_b, pregunta.opcion_c, pregunta.opcion_d],
    respuestaCorrecta: 'ABCD'.indexOf(pregunta.respuesta_correcta),
  }
}

async function datosParaApi(pregunta) {
  const categorias = await solicitarApi('/api/admin/categorias')
  const categoria = categorias.find((item) => item.nombre === pregunta.categoria)
  if (!categoria) throw new Error('La categoría seleccionada ya no está disponible.')
  return {
    enunciado: pregunta.enunciado, categoria_id: categoria.id, dificultad: pregunta.dificultad,
    opcion_a: pregunta.opciones[0], opcion_b: pregunta.opciones[1],
    opcion_c: pregunta.opciones[2], opcion_d: pregunta.opciones[3],
    respuesta_correcta: 'ABCD'[pregunta.respuestaCorrecta], estado: pregunta.estado || 'ACTIVA',
  }
}

// Los datos siguientes se conservan solo para la vista previa y la cuenta local de desarrollo.
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
  estado: pregunta.id % 3 === 0 ? 'BORRADOR' : 'ACTIVA',
  opciones: respuestasTemporales[pregunta.id],
  respuestaCorrecta: 0,
}))

function copiarPregunta(pregunta) {
  return { ...pregunta, estado: pregunta.estado || 'ACTIVA', opciones: [...pregunta.opciones] }
}

export async function obtenerPreguntasAdmin(opciones = {}) {
  if (!usarEjemplos(opciones)) {
    const parametros = new URLSearchParams({ page: String(opciones.pagina || 1) })
    if (opciones.buscar?.trim()) parametros.set('buscar', opciones.buscar.trim())
    if (opciones.categoriaId && opciones.categoriaId !== 'todas') parametros.set('categoria_id', opciones.categoriaId)
    if (opciones.estado && opciones.estado !== 'todas') parametros.set('estado', opciones.estado)
    const respuesta = await solicitarApi(`/api/admin/preguntas?${parametros}`)
    if (!Array.isArray(respuesta?.items) || !Number.isInteger(respuesta.total_paginas)) throw new Error('El servidor devolvió un listado de preguntas inesperado.')
    return {
      preguntas: respuesta.items.map(adaptarPregunta),
      total: respuesta.total,
      totalPaginas: Math.max(1, respuesta.total_paginas),
    }
  }
  return preguntasTemporales.map(copiarPregunta)
}

export async function obtenerPreguntaAdmin(idPregunta, opciones = {}) {
  if (!usarEjemplos(opciones)) return adaptarPregunta(await solicitarApi(`/api/admin/preguntas/${idPregunta}`))
  const pregunta = preguntasTemporales.find((elemento) => elemento.id === Number(idPregunta))
  if (!pregunta) throw new Error('No encontramos esa pregunta.')
  return copiarPregunta(pregunta)
}

export async function crearPreguntaAdmin(datosPregunta, opciones = {}) {
  if (!usarEjemplos(opciones)) return adaptarPregunta(await solicitarApi('/api/admin/preguntas', { metodo: 'POST', datos: await datosParaApi(datosPregunta) }))
  const id = Math.max(0, ...preguntasTemporales.map((pregunta) => pregunta.id)) + 1
  const pregunta = copiarPregunta({ id, ...datosPregunta })
  preguntasTemporales = [pregunta, ...preguntasTemporales]
  return copiarPregunta(pregunta)
}

export async function actualizarPreguntaAdmin(idPregunta, datosPregunta, opciones = {}) {
  if (!usarEjemplos(opciones)) return adaptarPregunta(await solicitarApi(`/api/admin/preguntas/${idPregunta}`, { metodo: 'PATCH', datos: await datosParaApi(datosPregunta) }))
  const indice = preguntasTemporales.findIndex((pregunta) => pregunta.id === Number(idPregunta))
  if (indice < 0) throw new Error('No encontramos esa pregunta.')
  const pregunta = copiarPregunta({ ...preguntasTemporales[indice], ...datosPregunta, id: Number(idPregunta) })
  preguntasTemporales = preguntasTemporales.map((elemento, posicion) => posicion === indice ? pregunta : elemento)
  return copiarPregunta(pregunta)
}

export async function eliminarPreguntaAdmin(idPregunta, opciones = {}) {
  if (!usarEjemplos(opciones)) return solicitarApi(`/api/admin/preguntas/${idPregunta}`, { metodo: 'DELETE' })
  const indice = preguntasTemporales.findIndex((pregunta) => pregunta.id === Number(idPregunta))
  if (indice < 0) throw new Error('No encontramos esa pregunta.')
  preguntasTemporales = preguntasTemporales.filter((pregunta) => pregunta.id !== Number(idPregunta))
}

export async function renombrarCategoriaPreguntasAdmin(nombreAnterior, nombreNuevo) {
  preguntasTemporales = preguntasTemporales.map((pregunta) => pregunta.categoria === nombreAnterior ? { ...pregunta, categoria: nombreNuevo } : pregunta)
}
