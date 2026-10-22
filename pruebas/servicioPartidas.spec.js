import { test as prueba, expect as esperar } from './fixturesCobertura.js'
import { prepararSesion } from './datosSesion.js'

prueba.beforeEach(async ({ page: pagina }) => {
  await prepararSesion(pagina)
})

async function llamarServicio(pagina, nombre, argumentos = []) {
  return pagina.evaluate(async ({ nombreFuncion, argumentosFuncion }) => {
    const servicio = await import('/src/servicios/servicioPartidas.js')
    return servicio[nombreFuncion](...argumentosFuncion)
  }, { nombreFuncion: nombre, argumentosFuncion: argumentos })
}

prueba('normaliza categorias de varias respuestas y usa el respaldo local', async ({ page: pagina }) => {
  let llamadasCategorias = 0
  let llamadasAlternativas = 0

  await pagina.route('https://api.futbolquiz.test/api/categorias', (ruta) => {
    llamadasCategorias += 1

    if (llamadasCategorias === 1) {
      return ruta.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          null,
          'Historia',
          { id: 1, nombre: 'Mundiales', color: 'azul' },
          { categoria_id: 2, titulo: 'Clubes' },
          { slug: 'reglas', descripcion: 'Reglas' },
          {},
        ]),
      })
    }

    if (llamadasCategorias === 2) {
      return ruta.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [] }),
      })
    }

    if (llamadasCategorias === 3) {
      return ruta.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [{ id: 3, nombre: 'Reglas' }] }),
      })
    }

    if (llamadasCategorias === 4) {
      return ruta.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [] }),
      })
    }

    return ruta.fulfill({ status: 503, contentType: 'application/json', body: '{}' })
  })

  await pagina.route('https://api.futbolquiz.test/api/partidas/categorias', (ruta) => {
    llamadasAlternativas += 1

    if (llamadasAlternativas === 1) {
      return ruta.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ categorias: [{ id: 4, nombre: 'Alternativa' }] }),
      })
    }

    return ruta.fulfill({ status: 503, contentType: 'application/json', body: '{}' })
  })

  const categoriasDirectas = await llamarServicio(pagina, 'obtenerCategoriasDisponibles')
  esperar(categoriasDirectas.slice(0, 4)).toEqual([
    { nombre: 'Historia' },
    { id: 1, nombre: 'Mundiales', color: 'azul' },
    { id: 2, nombre: 'Clubes', color: null },
    { id: 'reglas', nombre: 'Reglas', color: null },
  ])
  esperar(categoriasDirectas[4]).toMatchObject({ id: null, color: null })
  esperar(categoriasDirectas[4].nombre).toBeTruthy()

  esperar(await llamarServicio(pagina, 'obtenerCategoriasDisponibles')).toEqual([
    { id: 4, nombre: 'Alternativa', color: null },
  ])
  esperar(await llamarServicio(pagina, 'obtenerCategoriasDisponibles')).toEqual([
    { id: 3, nombre: 'Reglas', color: null },
  ])

  const categoriasLocales = await llamarServicio(pagina, 'obtenerCategoriasDisponibles')
  esperar(categoriasLocales).toHaveLength(6)
  esperar(categoriasLocales[0]).toEqual({ nombre: 'Historia' })
  esperar(await llamarServicio(pagina, 'obtenerCategoriasDisponibles')).toHaveLength(6)
  esperar(await llamarServicio(pagina, 'obtenerPreguntasPorCategoria', ['Historia', 3])).toEqual([])
})

prueba('inicia partidas con preguntas del backend o preguntas de demostracion', async ({ page: pagina }) => {
  let llamadas = 0

  await pagina.route('https://api.futbolquiz.test/api/partidas/individual', (ruta) => {
    llamadas += 1

    if (llamadas === 1) {
      return ruta.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '15',
          categoria_id: 3,
          estado: 'en_curso',
          preguntas: [{
            id: 7,
            orden: 1,
            enunciado: 'Pregunta de prueba',
            opcion_a: 'A',
            opcion_b: 'B',
            opcion_c: 'C',
            opcion_d: 'D',
          }],
        }),
      })
    }

    if (llamadas === 2) {
      return ruta.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 16, categoria_id: null, estado: 'en_curso', preguntas: null }),
      })
    }

    return ruta.fulfill({ status: 503, contentType: 'application/json', body: '{}' })
  })

  const partidaReal = await llamarServicio(pagina, 'iniciarPartidaIndividual', [1, 'Historia'])
  esperar(partidaReal).toMatchObject({
    id: 15,
    categoriaId: 3,
    estado: 'en_curso',
    preguntas: [{
      id: '7',
      orden: 1,
      categoria: 'Aleatoria',
      enunciado: 'Pregunta de prueba',
      opciones: [{ id: 'A', texto: 'A' }, { id: 'B', texto: 'B' }, { id: 'C', texto: 'C' }, { id: 'D', texto: 'D' }],
    }],
  })

  const partidaSinPreguntas = await llamarServicio(pagina, 'iniciarPartidaIndividual', [2, 'Clubes'])
  esperar(partidaSinPreguntas.preguntas).toHaveLength(2)
  esperar(partidaSinPreguntas.preguntas[0]).toMatchObject({ id: '1', categoria: 'Clubes' })

  const partidaDeRespaldo = await llamarServicio(pagina, 'iniciarPartidaIndividual', [0, 'Historia'])
  esperar(partidaDeRespaldo).toMatchObject({ categoriaId: null, estado: 'fallback' })
  esperar(partidaDeRespaldo.preguntas).toHaveLength(1)
})

prueba('registra respuestas, obtiene resultados y calcula el resumen final', async ({ page: pagina }) => {
  let llamadasRespuesta = 0
  let llamadasResultado = 0
  let datosRespuesta

  await pagina.route('https://api.futbolquiz.test/api/partidas/preguntas/*/respuesta', (ruta) => {
    llamadasRespuesta += 1
    datosRespuesta = ruta.request().postDataJSON()

    if (llamadasRespuesta === 1) {
      return ruta.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ es_correcta: true, puntaje_obtenido: 50 }),
      })
    }

    return ruta.fulfill({ status: 503, contentType: 'application/json', body: '{}' })
  })

  await pagina.route('https://api.futbolquiz.test/api/partidas/*/resultado', (ruta) => {
    llamadasResultado += 1

    if (llamadasResultado === 1) {
      return ruta.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ partida_id: 8, puntaje_final: 75, fecha_fin: '2026-10-22T12:00:00Z' }),
      })
    }

    if (llamadasResultado === 2) {
      return ruta.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    }

    return ruta.fulfill({ status: 503, contentType: 'application/json', body: '{}' })
  })

  const respuestaApi = await llamarServicio(pagina, 'registrarRespuestaPartida', [8, 7, ' b ', 3])
  esperar(datosRespuesta).toEqual({ opcion_seleccionada: 'B', tiempo_respuesta_segundos: 3 })
  esperar(respuestaApi).toMatchObject({ opcionSeleccionada: 'B', registrado: true, esCorrecta: true, puntajeObtenido: 50 })

  esperar(await llamarServicio(pagina, 'registrarRespuestaPartida', [8, 0, 'A', 2]))
    .toMatchObject({ esCorrecta: true, puntajeObtenido: 100 })
  esperar(await llamarServicio(pagina, 'registrarRespuestaPartida', [8, 0, 'B', 2]))
    .toMatchObject({ esCorrecta: false, puntajeObtenido: 0 })

  esperar(await llamarServicio(pagina, 'obtenerResultadoPartida', [8])).toMatchObject({
    partidaId: 8,
    puntajeFinal: 75,
    fechaFin: '2026-10-22T12:00:00Z',
    finalizada: true,
  })
  esperar(await llamarServicio(pagina, 'obtenerResultadoPartida', [9])).toMatchObject({
    partidaId: 9,
    puntajeFinal: 0,
    finalizada: true,
  })
  esperar(await llamarServicio(pagina, 'obtenerResultadoPartida', [10])).toMatchObject({
    partidaId: 10,
    puntajeFinal: 0,
    finalizada: true,
  })

  esperar(await llamarServicio(pagina, 'finalizarPartidaIndividual', [8, [
    { esCorrecta: true, puntajeObtenido: 40 },
    { esCorrecta: false, puntajeObtenido: 30 },
    { esCorrecta: true },
  ]])).toMatchObject({
    idPartida: 8,
    puntaje: 40,
    totalRespuestas: 3,
    respuestasCorrectas: 2,
    finalizada: true,
  })
})
