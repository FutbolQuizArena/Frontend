import { test as prueba, expect as esperar } from '@playwright/test'
import { prepararSesion } from './datosSesion.js'

prueba.beforeEach(async ({ page: pagina }) => {
  await prepararSesion(pagina)
})

prueba('la ruleta gira y habilita la opción de continuar', async ({ page: pagina }) => {
  await pagina.goto('/partida/ruleta')
  await esperar(pagina.getByRole('heading', { name: 'Ruleta de categorías' })).toBeVisible()

  const botonGirar = pagina.getByRole('button', { name: /girar ruleta/i })
  await esperar(botonGirar).toBeEnabled()
  await botonGirar.click()

  await esperar(pagina.getByRole('button', { name: /continuar a la partida/i })).toBeEnabled({ timeout: 15000 })
  await esperar(pagina.getByText(/categoría seleccionada:/i)).toBeVisible()
})

prueba('la ruleta mantiene un diseño responsive en pantallas pequeñas', async ({ page: pagina }) => {
  for (const ancho of [320, 390, 768, 1024]) {
    await pagina.setViewportSize({ width: ancho, height: 844 })
    await pagina.goto('/partida/ruleta')
    await esperar(pagina.getByRole('heading', { name: 'Ruleta de categorías' })).toBeVisible()

    const desborde = await pagina.evaluate(() => ({
      ancho: document.documentElement.scrollWidth,
      ventana: window.innerWidth,
    }))

    esperar(desborde.ancho).toBeLessThanOrEqual(desborde.ventana + 2)
  }
})
