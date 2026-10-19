import { test as prueba, expect as esperar } from '@playwright/test'
import { prepararSesion } from './datosSesion.js'
import { interceptarDetallesTorneo } from './datosTorneoDetalle.js'

prueba.beforeEach(async ({ page: pagina }) => { await interceptarDetallesTorneo(pagina) })

prueba('sin sesión, el cuadro redirige a login', async ({ page: pagina }) => {
  await pagina.goto('/torneos/1/cuadro')
  await esperar(pagina).toHaveURL(/\/login$/)
})

prueba('muestra las rondas y cruces del torneo en curso', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.setViewportSize({ width: 390, height: 844 })
  await pagina.goto('/torneos/1/cuadro')
  await esperar(pagina.getByRole('heading', { name: 'Copa de Campeones', exact: true })).toBeVisible()
  await esperar(pagina.getByText('Semifinales', { exact: true }).first()).toBeVisible()
  await esperar(pagina.getByText('Final', { exact: true }).first()).toBeVisible()
  await esperar(pagina.getByLabel('Partido entre Lucas y SofiGol')).toBeVisible()
})

prueba('si el torneo espera jugadores, ofrece volver a la sala', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.goto('/torneos/14/cuadro')
  await esperar(pagina.getByText('Los cruces todavía no están disponibles')).toBeVisible()
  await esperar(pagina.getByRole('link', { name: 'Volver a la sala' })).toHaveAttribute('href', '/torneos/14/sala')
})

prueba('muestra el campeón y el resumen de un torneo finalizado', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.goto('/torneos/9/cuadro')
  await esperar(pagina.getByText('¡CAMPEÓN!')).toBeVisible()
  await esperar(pagina.getByRole('heading', { name: 'SofiGol' })).toBeVisible()
  await esperar(pagina.getByText('El resumen personal estará disponible cuando el backend publique los resultados de las partidas.')).toBeVisible()
  await esperar(pagina.getByRole('link', { name: 'Volver a torneos' })).toHaveAttribute('href', '/torneos')
})

prueba('permite abrir el cuadro completo desde el resultado', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.goto('/torneos/9/cuadro')
  await pagina.getByRole('button', { name: 'Ver cuadro completo' }).click()
  await esperar(pagina.getByLabel('Cuadro de llaves')).toBeVisible()
  await esperar(pagina.getByText('Campeón', { exact: true }).first()).toBeVisible()
  await esperar(pagina.getByRole('button', { name: 'Ver resultado' })).toBeVisible()
})

prueba('confirma cuando se comparte el resultado', async ({ page: pagina }) => {
  await pagina.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: async () => {} })
  })
  await prepararSesion(pagina)
  await pagina.goto('/torneos/9/cuadro')
  await pagina.getByRole('button', { name: 'Compartir resultado' }).click()
  await esperar(pagina.getByRole('status')).toHaveText('Resultado listo para compartir.')
})

prueba('distingue torneo inexistente y error de carga', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.goto('/torneos/404/cuadro')
  await esperar(pagina.getByRole('alert').getByText('Torneo inexistente')).toBeVisible()
  await pagina.goto('/torneos/500/cuadro')
  await esperar(pagina.getByRole('alert').getByText('No pudimos cargar el cuadro', { exact: true })).toBeVisible()
  await esperar(pagina.getByRole('button', { name: 'Reintentar' })).toBeVisible()
})

prueba('el cuadro se adapta a escritorio y celular sin desbordar', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.setViewportSize({ width: 1440, height: 1024 })
  await pagina.goto('/torneos/1/cuadro')
  await esperar(pagina.getByLabel('Cuadro de llaves')).toBeVisible()
  esperar(await pagina.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await pagina.screenshot({ path: 'test-results/cuadro-torneo-escritorio.png', fullPage: true })

  await pagina.setViewportSize({ width: 390, height: 844 })
  await pagina.reload()
  await esperar(pagina.getByText('Tu camino a la final')).toBeVisible()
  esperar(await pagina.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await pagina.screenshot({ path: 'test-results/cuadro-torneo-movil.png', fullPage: true })
})
