import { test as prueba, expect as esperar } from '@playwright/test'
import { prepararSesion } from './datosSesion.js'

prueba('renderiza la partida de duelo y avanza hasta el resultado', async ({ page: pagina }) => {
  await prepararSesion(pagina)

  await pagina.goto('/duelo/partida')

  await esperar(pagina.getByText('Lucas', { exact: false })).toBeVisible()
  await esperar(pagina.getByText('Rival', { exact: false })).toBeVisible()
  await esperar(pagina.getByText('Pregunta 1', { exact: false })).toBeVisible()

  const botones = pagina.locator('button[data-testid="opcion-duelo"]')
  await esperar(botones.first()).toBeVisible()
  await botones.first().click()

  await esperar(botones.first()).toBeDisabled()

  await pagina.waitForURL(/\/duelo\/resultado/)
})

prueba('mantiene el layout responsive en móvil', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.setViewportSize({ width: 390, height: 844 })
  await pagina.goto('/duelo/partida')

  await esperar(pagina.locator('.partida-duelo__marcadores')).toBeVisible()
  await esperar(pagina.locator('.partida-duelo__tarjeta')).toBeVisible()

  const overflowX = await pagina.evaluate(() => {
    const doc = document.documentElement
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
    }
  })

  esperar(overflowX.scrollWidth).toBeLessThanOrEqual(overflowX.clientWidth + 2)
})
