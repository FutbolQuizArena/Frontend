import { test as prueba, expect as esperar } from './fixturesCobertura.js'
import { prepararSesion } from './datosSesion.js'

const preguntas = [
  { id: 901, orden: 1, enunciado: 'Primera pregunta', opcion_a: 'A', opcion_b: 'B', opcion_c: 'C', opcion_d: 'D', esta_respondida: false },
  { id: 902, orden: 2, enunciado: 'Segunda pregunta', opcion_a: 'A', opcion_b: 'B', opcion_c: 'C', opcion_d: 'D', esta_respondida: false },
]

async function prepararDueloTorneo(pagina, { respondida = false, errorInicio = false, errorRespuesta = false } = {}) {
  const jugadorA = { id: 11, usuario_id: 1, nombre: 'Lucas' }
  const jugadorB = { id: 12, usuario_id: 2, nombre: 'Sofi' }
  let respuestas = 0

  await pagina.route('**/api/torneos/21', (ruta) => ruta.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      id: 21,
      nombre: 'Copa de prueba',
      estado: 'EN_CURSO',
      cantidad_participantes: 2,
      cantidad_participantes_actual: 2,
      cuadro: [{ id: 51, ronda: 1, jugador_a_id: 11, jugador_b_id: 12, jugador_a: jugadorA, jugador_b: jugadorB, estado: 'PENDIENTE', duelo_id: respondida ? 77 : null }],
    }),
  }))

  await pagina.route('**/api/torneos/21/cruces/51/iniciar-duelo', (ruta) => ruta.fulfill({
    status: errorInicio ? 503 : 200,
    contentType: 'application/json',
    body: JSON.stringify(errorInicio ? { message: 'No disponible' } : {
      duelo_id: 77,
      cruce_id: 51,
      torneo_id: 21,
      ronda: 1,
      duelo: {
        id: 77,
        estado: 'EN_CURSO',
        modalidad: 'online',
        jugador1_id: 1,
        jugador2_id: 2,
        jugador1_nombre: 'Lucas',
        jugador2_nombre: 'Sofi',
        categoria_nombre: 'Historia',
        preguntas: respondida ? [{ ...preguntas[0], esta_respondida: true }, preguntas[1]] : [preguntas[0]],
      },
    }),
  }))

  await pagina.route('**/api/duelos/preguntas/901/respuesta', (ruta) => {
    respuestas += 1
    return ruta.fulfill({
      status: errorRespuesta && respuestas === 1 ? 503 : 200,
      contentType: 'application/json',
      body: JSON.stringify({ es_correcta: true, puntaje_obtenido: 100 }),
    })
  })

  await pagina.route('**/api/duelos/77', (ruta) => ruta.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      id: 77,
      estado: 'FINALIZADA',
      jugador1_id: 1,
      jugador2_id: 2,
      jugador1_nombre: 'Lucas',
      jugador2_nombre: 'Sofi',
      puntaje_jugador1: 100,
      puntaje_jugador2: 0,
      aciertos_jugador1: 1,
      aciertos_jugador2: 0,
      numero_ganador: 1,
    }),
  }))

  return () => respuestas
}

prueba('desde un cruce inicia el duelo y vuelve al cuadro al terminar', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  const contarRespuestas = await prepararDueloTorneo(pagina, { errorRespuesta: true })
  await pagina.goto('/torneos/21/cuadro')
  await pagina.getByRole('button', { name: 'Jugar duelo' }).click()
  await esperar(pagina).toHaveURL(/\/duelo\/juegan$/)
  await esperar(pagina.getByRole('heading', { name: 'Duelo de torneo' })).toBeVisible()

  await pagina.getByRole('button', { name: 'A', exact: true }).click()
  await esperar(pagina.getByRole('alert')).toBeVisible()
  await esperar(pagina.getByRole('button', { name: 'A', exact: true })).toBeEnabled()
  await pagina.getByRole('button', { name: 'A', exact: true }).click()

  await pagina.getByRole('button', { name: 'Siguiente', exact: true }).click()
  await esperar(pagina).toHaveURL(/\/duelo\/77\/resultado$/)
  await esperar(pagina.getByRole('link', { name: 'Volver al cuadro' })).toBeVisible()
  esperar(contarRespuestas()).toBe(2)
})

prueba('retoma un duelo desde la primera pregunta pendiente', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await prepararDueloTorneo(pagina, { respondida: true })
  await pagina.goto('/torneos/21/cuadro')
  await pagina.getByRole('button', { name: 'Continuar duelo' }).click()
  await esperar(pagina.getByText('Segunda pregunta')).toBeVisible()
  await pagina.reload()
  await esperar(pagina.getByText('Segunda pregunta')).toBeVisible()
})

prueba('muestra el error si el servidor no puede iniciar el cruce', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await prepararDueloTorneo(pagina, { errorInicio: true })
  await pagina.goto('/torneos/21/cuadro')
  await pagina.getByRole('button', { name: 'Jugar duelo' }).click()
  await esperar(pagina.getByRole('alert')).toBeVisible()
  await esperar(pagina).toHaveURL(/\/torneos\/21\/cuadro$/)
})

prueba('la ruta antigua de partida abre la selección de modos', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.route('**/api/torneos?filtro=mios', (ruta) => ruta.fulfill({ status: 200, contentType: 'application/json', body: '[]' }))
  await pagina.goto('/torneos')
  await pagina.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Jugar' }).click()
  await esperar(pagina).toHaveURL(/\/jugar$/)
  await pagina.goto('/partida-individual')
  await esperar(pagina).toHaveURL(/\/jugar$/)
  await esperar(pagina.getByRole('heading', { name: 'Selecciona un Modo de Juego' })).toBeVisible()
})
