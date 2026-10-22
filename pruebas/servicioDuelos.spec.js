import { test as prueba, expect as esperar } from './fixturesCobertura.js'
import { prepararSesion } from './datosSesion.js'

prueba.beforeEach(async ({ page: pagina }) => {
  await prepararSesion(pagina)
})

async function llamarServicio(pagina, nombre, argumentos = []) {
  return pagina.evaluate(async ({ nombreFuncion, argumentosFuncion }) => {
    const servicio = await import('/src/servicios/servicioDuelos.js')
    return servicio[nombreFuncion](...argumentosFuncion)
  }, { nombreFuncion: nombre, argumentosFuncion: argumentos })
}

prueba('genera alias y avatar con nombres vacíos, simples y compuestos', async ({ page: pagina }) => {
  const resultado = await pagina.evaluate(async () => {
    const servicio = await import('/src/servicios/servicioDuelos.js')
    return {
      avatarVacio: servicio.generarAvatar(''),
      avatarSimple: servicio.generarAvatar('lucas'),
      avatarCompuesto: servicio.generarAvatar('  lucas   agüero '),
      aliasVacio: servicio.generarAlias(null),
      aliasCompuesto: servicio.generarAlias('  lucas   agüero '),
    }
  })

  esperar(resultado).toEqual({
    avatarVacio: 'JQ',
    avatarSimple: 'LU',
    avatarCompuesto: 'LA',
    aliasVacio: 'Jugador',
    aliasCompuesto: 'lucas',
  })
})

prueba('normaliza la búsqueda exitosa para ambos formatos de respuesta', async ({ page: pagina }) => {
  let llamada = 0
  await pagina.route('https://api.futbolquiz.test/api/duelos/online', (ruta) => {
    llamada += 1
    const respuesta = llamada === 1
      ? {
          id: 81,
          estado: 'en_curso',
          categoria_nombre: 'Historia',
          jugador1_id: 1,
          jugador1_nombre: 'Lucas Agüero',
          jugador2_id: 2,
          jugador2_nombre: 'Ana Ruiz',
          puntaje_jugador1: 40,
          puntaje_jugador2: 70,
          preguntas: [{ id: 12, orden: 1, enunciado: 'Pregunta de prueba', opcion_a: 'A' }],
        }
      : { id: 82, estado: 'pendiente_rival', categoriaNombre: 'Copa', preguntas: null }

    return ruta.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(respuesta) })
  })

  const dueloConRival = await llamarServicio(pagina, 'buscarRivalDuelo', [{ id: 2, nombre: 'Ana Ruiz', puntajeTotal: 90 }])
  esperar(dueloConRival.jugadorLocal).toMatchObject({ id: 2, nombre: 'Ana Ruiz', alias: 'Ana', avatar: 'AR', puntuacion: 90 })
  esperar(dueloConRival.rival).toMatchObject({ id: 1, nombre: 'Lucas Agüero', puntuacion: 40, nivel: 'Online' })
  esperar(dueloConRival.preguntas[0]).toMatchObject({ id: '12', categoria: 'Historia', enunciado: 'Pregunta de prueba' })
  esperar(dueloConRival.estado).toBe('EN_CURSO')

  const dueloPendiente = await llamarServicio(pagina, 'buscarRivalDuelo')
  esperar(dueloPendiente.rival).toBeNull()
  esperar(dueloPendiente.preguntas[0].categoria).toBe('Copa')
  esperar(await pagina.evaluate(() => JSON.parse(sessionStorage.getItem('dueloActual')).id)).toBe(82)
})

prueba('usa el duelo de demostración si falla la búsqueda y permite cancelar', async ({ page: pagina }) => {
  await pagina.route('https://api.futbolquiz.test/api/duelos/online', (ruta) => ruta.fulfill({
    status: 503,
    contentType: 'application/json',
    body: JSON.stringify({ message: 'No disponible' }),
  }))

  const duelo = await llamarServicio(pagina, 'buscarRivalDuelo')
  esperar(duelo).toMatchObject({ estado: 'PENDIENTE_RIVAL', modalidad: 'online', categoriaNombre: 'Fútbol', rival: null })
  esperar(duelo.preguntas).toHaveLength(1)
  esperar(await pagina.evaluate(() => JSON.parse(sessionStorage.getItem('dueloActual')).estado)).toBe('PENDIENTE_RIVAL')

  esperar(await llamarServicio(pagina, 'cancelarBusquedaDuelo')).toBe(true)
  esperar(await pagina.evaluate(() => sessionStorage.getItem('dueloActual'))).toBeNull()
})

prueba('calcula resultados pendientes, empate y ganadores desde cada jugador', async ({ page: pagina }) => {
  const respuestas = [
    { id: 1, estado: 'pendiente_rival', jugador1_id: 1, jugador1_nombre: 'Lucas', jugador2_id: 2, jugador2_nombre: 'Ana' },
    { id: 2, estado: 'FINALIZADO', jugador1_id: 1, jugador1_nombre: 'Lucas', jugador2_id: 2, jugador2_nombre: 'Ana', es_empate: true },
    { id: 3, estado: 'FINALIZADA', jugador1_id: 1, jugador1_nombre: 'Lucas', jugador2_id: 2, jugador2_nombre: 'Ana', numero_ganador: 1, puntaje_jugador1: 100, puntaje_jugador2: 50, aciertos_jugador1: 8, aciertos_jugador2: 4 },
    { id: 4, estado: 'FINALIZADA', jugador1_id: 1, jugador1_nombre: 'Lucas', jugador2_id: 2, jugador2_nombre: 'Ana', numero_ganador: 2, puntaje_jugador1: 50, puntaje_jugador2: 100, aciertos_jugador1: 4, aciertos_jugador2: 8 },
  ]
  let llamada = 0
  await pagina.route('https://api.futbolquiz.test/api/duelos/*', (ruta) => ruta.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(respuestas[llamada++]),
  }))

  const pendiente = await llamarServicio(pagina, 'obtenerResultadoDuelo', [1, { id: 1, nombre: 'Lucas' }])
  const empate = await llamarServicio(pagina, 'obtenerResultadoDuelo', [2, { id: 2, nombre: 'Ana' }])
  const ganaJugador1 = await llamarServicio(pagina, 'obtenerResultadoDuelo', [3, { id: 1, nombre: 'Lucas' }])
  const ganaJugador2 = await llamarServicio(pagina, 'obtenerResultadoDuelo', [4, { id: 2, nombre: 'Ana' }])

  esperar(pendiente).toMatchObject({ estado: 'PENDIENTE_RIVAL', ganador: 'pendiente', resultadoTexto: 'PENDIENTE' })
  esperar(empate).toMatchObject({ ganador: 'empate', resultadoTexto: 'EMPATE' })
  esperar(ganaJugador1).toMatchObject({ ganador: 'local', resultadoTexto: '¡VICTORIA!', jugadorLocal: { puntaje: 100, aciertos: 8 } })
  esperar(ganaJugador2).toMatchObject({ ganador: 'local', resultadoTexto: '¡VICTORIA!', jugadorLocal: { puntaje: 100, aciertos: 8 } })

  await pagina.unroute('https://api.futbolquiz.test/api/duelos/*')
  await pagina.route('https://api.futbolquiz.test/api/duelos/5', (ruta) => ruta.fulfill({ status: 503, body: '{}' }))
  const fallback = await llamarServicio(pagina, 'obtenerResultadoDuelo', [5, { nombre: 'Lucas' }])
  esperar(fallback).toMatchObject({ estado: 'PENDIENTE', ganador: 'local', resultadoTexto: 'PENDIENTE', jugadorLocal: { nombre: 'Lucas' } })
})

prueba('consulta el estado sin id, pendiente, en curso y ante error', async ({ page: pagina }) => {
  let llamada = 0
  await pagina.route('https://api.futbolquiz.test/api/duelos/*', (ruta) => {
    llamada += 1
    if (llamada === 3) return ruta.fulfill({ status: 503, body: '{}' })

    const respuesta = llamada === 1
      ? { id: 21, estado: 'pendiente_rival', jugador1_id: 1, jugador1_nombre: 'Lucas' }
      : { id: 22, estado: 'FINALIZADO', categoriaNombre: 'Copa', jugador1_id: 1, jugador1_nombre: 'Lucas', jugador2_id: 2, jugador2_nombre: 'Ana', puntaje_jugador1: 30, puntaje_jugador2: 60, aciertos_jugador1: 3, aciertos_jugador2: 6 }

    return ruta.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(respuesta) })
  })

  esperar(await llamarServicio(pagina, 'consultarEstadoDuelo', [null])).toBeNull()
  const pendiente = await llamarServicio(pagina, 'consultarEstadoDuelo', [21, { id: 1, nombre: 'Lucas' }])
  const enCurso = await llamarServicio(pagina, 'consultarEstadoDuelo', [22, { id: 2, nombre: 'Ana' }])
  const error = await llamarServicio(pagina, 'consultarEstadoDuelo', [23])

  esperar(pendiente).toMatchObject({ id: 21, rival: null, jugadorLocal: { nombre: 'Lucas' } })
  esperar(enCurso).toMatchObject({ id: 22, categoriaNombre: 'Copa', rival: { nombre: 'Lucas', puntuacion: 30, aciertos: 3 }, jugadorLocal: { nombre: 'Ana', puntuacion: 60, aciertos: 6 } })
  esperar(error).toBeNull()
})

prueba('solicita revancha con respuesta y conserva el id si la API falla', async ({ page: pagina }) => {
  let llamada = 0
  await pagina.route('https://api.futbolquiz.test/api/duelos/online', (ruta) => {
    llamada += 1
    return ruta.fulfill(llamada === 1
      ? { status: 200, contentType: 'application/json', body: JSON.stringify({ id: 91 }) }
      : { status: 503, body: '{}' })
  })

  esperar(await llamarServicio(pagina, 'solicitarRevanchaDuelo', [10])).toMatchObject({ idDuelo: 91, solicitudEnviada: true, destino: '/duelo/esperando' })
  esperar(await llamarServicio(pagina, 'solicitarRevanchaDuelo', [11])).toMatchObject({ idDuelo: 11, solicitudEnviada: true, mensaje: 'Se está buscando un rival nuevo.' })
})

prueba('recupera preguntas guardadas y usa preguntas base ante datos inválidos', async ({ page: pagina }) => {
  await pagina.evaluate(() => sessionStorage.setItem('dueloActual', JSON.stringify({
    categoria_nombre: 'Copa',
    preguntas: [{ categoria: 'Aleatoria' }, { id: 99, categoria: 'Historia' }],
  })))
  const guardadas = await llamarServicio(pagina, 'obtenerPreguntasDuelo', [44])
  esperar(guardadas[0]).toMatchObject({ id: '44-1', categoria: 'Copa' })
  esperar(guardadas[1]).toMatchObject({ id: '99', categoria: 'Historia' })

  await pagina.evaluate(() => sessionStorage.setItem('dueloActual', '{ JSON inválido'))
  const corruptas = await llamarServicio(pagina, 'obtenerPreguntasDuelo', [44])
  esperar(corruptas[0]).toMatchObject({ id: 'duelo-historia-1-44-0', categoria: 'Fútbol' })

  await pagina.evaluate(() => sessionStorage.setItem('dueloActual', JSON.stringify({ preguntas: [] })))
  esperar(await llamarServicio(pagina, 'obtenerPreguntasDuelo', [44])).toHaveLength(1)
})

prueba('registra respuestas locales, exitosas y con fallback correcto o incorrecto', async ({ page: pagina }) => {
  let llamada = 0
  await pagina.route('https://api.futbolquiz.test/api/duelos/preguntas/*/respuesta', (ruta) => {
    llamada += 1
    return ruta.fulfill(llamada === 1
      ? { status: 200, contentType: 'application/json', body: JSON.stringify({ es_correcta: true, puntaje_obtenido: 120 }) }
      : { status: 503, body: '{}' })
  })

  const local = await llamarServicio(pagina, 'registrarRespuestaDuelo', [7, 'no-id', 'a', 'sin-tiempo'])
  const exitosa = await llamarServicio(pagina, 'registrarRespuestaDuelo', [7, 15, 'b', 8])
  const fallbackCorrecta = await llamarServicio(pagina, 'registrarRespuestaDuelo', [7, 1, 'a', 4])
  const fallbackIncorrecta = await llamarServicio(pagina, 'registrarRespuestaDuelo', [7, 1, 'd', 4])

  esperar(local).toMatchObject({ opcionSeleccionada: 'A', tiempoEmpleado: 0, registrado: true, esCorrecta: true, puntajeObtenido: 0 })
  esperar(exitosa).toMatchObject({ opcionSeleccionada: 'B', tiempoEmpleado: 8, esCorrecta: true, puntajeObtenido: 120 })
  esperar(fallbackCorrecta).toMatchObject({ esCorrecta: true, puntajeObtenido: 100 })
  esperar(fallbackIncorrecta).toMatchObject({ esCorrecta: false, puntajeObtenido: 0 })
})
