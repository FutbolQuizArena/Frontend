import { test as prueba, expect as esperar } from './fixturesCobertura.js'
import { prepararSesion } from './datosSesion.js'

prueba.beforeEach(async ({ page: pagina }) => {
  await prepararSesion(pagina)
  const preguntas = Array.from({ length: 8 }, (_, indice) => ({
    id: indice + 1,
    orden: indice + 1,
    enunciado: `Pregunta local ${indice + 1}`,
    opcion_a: 'Respuesta A',
    opcion_b: 'Respuesta B',
    opcion_c: 'Respuesta C',
    opcion_d: 'Respuesta D',
  }))
  await pagina.route('**/api/duelos/local', (ruta) => ruta.fulfill({
    status: 201,
    json: { id: 1, estado: 'EN_CURSO', modalidad: 'local', preguntas },
  }))
  await pagina.route('**/api/duelos/preguntas/*/respuesta', (ruta) => ruta.fulfill({
    status: 200,
    json: { es_correcta: true, puntaje_obtenido: 100 },
  }))
  await pagina.route('**/api/duelos/1', (ruta) => ruta.fulfill({
    status: 200,
    json: { id: 1, estado: 'FINALIZADA', puntaje_jugador1: 400, puntaje_jugador2: 400, es_empate: true },
  }))
})

prueba('muestra el formulario inicial de preparación del duelo local', async ({ page: pagina }) => {
  await pagina.goto('/duelo/local')

  await esperar(pagina.getByRole('heading', { name: /Preparación del duelo/i })).toBeVisible()
  await esperar(pagina.getByLabel('Jugador 1')).toBeVisible()
  await esperar(pagina.getByLabel('Jugador 2')).toBeVisible()
  await esperar(pagina.getByRole('button', { name: 'Comenzar Duelo' })).toBeVisible()
})

prueba('tras responder el jugador 1 aparece la pantalla de cambio de turno', async ({ page: pagina }) => {
  await pagina.goto('/duelo/local')
  await pagina.getByLabel('Jugador 1').fill('Lucas')
  await pagina.getByLabel('Jugador 2').fill('Mati')
  await pagina.getByRole('button', { name: 'Comenzar Duelo' }).click()

  const boton = pagina.getByRole('button', { name: /opción/i }).first()
  await boton.click()

  await esperar(pagina.getByText('Pasa el dispositivo')).toBeVisible()
  await esperar(pagina.getByText('Mati', { exact: true }).first()).toBeVisible()
  await esperar(pagina.getByRole('button', { name: '¡Estoy Listo!' })).toBeVisible()
})

prueba('al presionar estoy listo se activa el turno del jugador 2', async ({ page: pagina }) => {
  await pagina.goto('/duelo/local')
  await pagina.getByLabel('Jugador 1').fill('Lucas')
  await pagina.getByLabel('Jugador 2').fill('Mati')
  await pagina.getByRole('button', { name: 'Comenzar Duelo' }).click()

  await pagina.getByRole('button', { name: /opción/i }).first().click()
  await pagina.getByRole('button', { name: '¡Estoy Listo!' }).click()

  await esperar(pagina.getByText('Turno de Mati')).toBeVisible()
  await esperar(pagina.getByRole('button', { name: /opción/i }).first()).toBeVisible()
})

prueba('al finalizar calcula ganador y muestra resultado final', async ({ page: pagina }) => {
  await pagina.goto('/duelo/local')
  await pagina.getByLabel('Jugador 1').fill('Lucas')
  await pagina.getByLabel('Jugador 2').fill('Mati')
  await pagina.getByRole('button', { name: 'Comenzar Duelo' }).click()

  for (let i = 0; i < 8; i += 1) {
    await pagina.getByRole('button', { name: /opción/i }).first().click()
    await pagina.getByRole('button', { name: '¡Estoy Listo!' }).click()
  }

  await esperar(pagina.getByText(/Ganador|Empate/i)).toBeVisible()
  await esperar(pagina.getByRole('button', { name: 'Revancha Local' })).toBeVisible()
})

prueba('mantiene la vista responsive sin scroll horizontal en móvil', async ({ page: pagina }) => {
  await pagina.setViewportSize({ width: 390, height: 844 })
  await pagina.goto('/duelo/local')

  const overflow = await pagina.evaluate(() => {
    const doc = document.documentElement
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
    }
  })

  await esperar(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 2)
})

prueba('permite reintentar si fallan el inicio del duelo y el registro de una respuesta', async ({ page: pagina }) => {
  let primerInicio = true
  await pagina.route('**/api/duelos/local', (ruta) => {
    if (primerInicio) {
      primerInicio = false
      return ruta.fulfill({ status: 503, json: { message: 'Duelo no disponible' } })
    }
    return ruta.fallback()
  })

  await pagina.goto('/duelo/local', { waitUntil: 'domcontentloaded' })
  await pagina.getByRole('button', { name: 'Comenzar Duelo' }).click()
  await esperar(pagina.getByRole('alert')).toBeVisible()

  await pagina.getByRole('button', { name: 'Comenzar Duelo' }).click()
  await esperar(pagina.getByRole('button', { name: /opción/i }).first()).toBeVisible()

  await pagina.route('**/api/duelos/preguntas/*/respuesta', (ruta) => ruta.fulfill({
    status: 503,
    json: { message: 'Respuesta no disponible' },
  }))
  await pagina.getByRole('button', { name: /opción/i }).first().click()
  await esperar(pagina.getByRole('alert')).toBeVisible()
  await esperar(pagina.getByRole('button', { name: /opción/i }).first()).toBeEnabled()
})
