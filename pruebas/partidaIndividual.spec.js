import { test as prueba, expect as esperar } from '@playwright/test'
import { prepararSesion } from './datosSesion.js'

prueba.beforeEach(async ({ page: pagina }) => {
  await prepararSesion(pagina)
})

prueba('renderiza la partida individual con sus preguntas y 4 opciones', async ({ page: pagina }) => {
  await pagina.goto('/partida/juegan?segundosPorPregunta=15&totalPreguntas=1')
  await esperar(pagina.getByRole('heading', { name: /Pregunta 1 de 1/ })).toBeVisible()
  await esperar(pagina.getByRole('heading', { level: 2 })).toBeVisible()
  const opciones = pagina.getByTestId('opcion-pregunta')
  await esperar(opciones).toHaveCount(4)
})

prueba('responder una pregunta actualiza el progreso y avanza a la siguiente', async ({ page: pagina }) => {
  await pagina.goto('/partida/juegan?segundosPorPregunta=15&totalPreguntas=2')
  await esperar(pagina.getByRole('heading', { name: /Pregunta 1 de 2/ })).toBeVisible()
  await pagina.getByTestId('opcion-pregunta').first().click()
  await esperar(pagina.getByRole('heading', { name: /Pregunta 2 de 2/ })).toBeVisible()
})

prueba('cuando se agota el tiempo marca la respuesta como incorrecta y avanza', async ({ page: pagina }) => {
  await pagina.goto('/partida/juegan?segundosPorPregunta=1&totalPreguntas=2')
  await esperar(pagina.getByRole('heading', { name: /Pregunta 1 de 2/ })).toBeVisible()
  await esperar(pagina.getByText('Respuesta incorrecta o tiempo agotado.')).toBeVisible({ timeout: 5000 })
  await esperar(pagina.getByRole('heading', { name: /Pregunta 2 de 2/ })).toBeVisible({ timeout: 5000 })
})

prueba('al completar 10 preguntas finaliza la partida y navega a resultados', async ({ page: pagina }) => {
  await pagina.goto('/partida/juegan?segundosPorPregunta=1&totalPreguntas=10')
  for (let indice = 0; indice < 9; indice++) {
    await pagina.getByTestId('opcion-pregunta').first().click()
    await esperar(pagina.getByRole('heading', { name: new RegExp(`Pregunta ${indice + 2} de 10`) })).toBeVisible({ timeout: 5000 })
  }

  await pagina.getByTestId('opcion-pregunta').first().click()
  await esperar(pagina).toHaveURL(/\/partida\/resultado$/)
  await esperar(pagina.getByRole('heading', { name: 'Resultado de la partida' })).toBeVisible()
})
