import { test as prueba, expect as esperar } from '@playwright/test'
import { obtenerPreguntasDueloLocal } from '../src/servicios/servicioDuelosLocales.js'
import { prepararSesion } from './datosSesion.js'

prueba.beforeEach(async ({ page: pagina }) => {
  await prepararSesion(pagina)
})

prueba('cada jugador responde 4 preguntas en el duelo local', () => {
  const preguntas = obtenerPreguntasDueloLocal()

  esperar(preguntas.length).toBe(8)
  esperar(preguntas.filter((_, indice) => indice % 2 === 0).length).toBe(4)
  esperar(preguntas.filter((_, indice) => indice % 2 !== 0).length).toBe(4)
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
