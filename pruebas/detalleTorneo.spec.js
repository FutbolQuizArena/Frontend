import { test as prueba, expect as esperar } from '@playwright/test'
import { prepararSesion } from './datosSesion.js'
import { interceptarDetallesTorneo } from './datosTorneoDetalle.js'

prueba.beforeEach(async ({ page: pagina }) => { await interceptarDetallesTorneo(pagina) })

prueba('sin sesión, el detalle redirige a login', async ({ page: pagina }) => {
  await pagina.goto('/torneos/1')
  await esperar(pagina).toHaveURL(/\/login$/)
})

prueba('obtiene el ID de la ruta y muestra el detalle activo', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.goto('/torneos/1')

  const dialogo = pagina.getByRole('dialog')
  await esperar(dialogo.getByRole('heading', { name: 'Copa de Campeones' })).toBeVisible()
  await esperar(dialogo.getByText('EN CURSO')).toBeVisible()
  await esperar(dialogo.getByText('Eliminación directa')).toBeVisible()
  await esperar(dialogo.getByText('8 participantes')).toBeVisible()
  await esperar(dialogo.getByText('Semifinales')).toBeVisible()
  await esperar(dialogo.getByRole('link', { name: 'Ver cuadro' })).toHaveAttribute('href', '/torneos/1/cuadro')
})

prueba('muestra el resultado de un torneo finalizado', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.goto('/torneos/9')

  const dialogo = pagina.getByRole('dialog')
  await esperar(dialogo.getByText('FINALIZADO')).toBeVisible()
  await esperar(dialogo.getByText('Campeón: SofiGol')).toBeVisible()
  await esperar(dialogo.getByRole('link', { name: 'Ver cuadro' })).toHaveAttribute('href', '/torneos/9/cuadro')
})

prueba('un torneo en espera permite volver a su sala', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.goto('/torneos/14')

  await esperar(pagina.getByRole('dialog').getByRole('link', { name: 'Ir a la sala' })).toHaveAttribute('href', '/torneos/14/sala')
})

prueba('distingue torneo inexistente y error de carga', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.goto('/torneos/404')
  await esperar(pagina.getByRole('alert').getByText('Torneo inexistente')).toBeVisible()

  await pagina.goto('/torneos/500')
  await esperar(pagina.getByRole('alert').getByText('No pudimos cargar el detalle')).toBeVisible()
  await esperar(pagina.getByRole('button', { name: 'Reintentar' })).toBeVisible()
})

prueba('el detalle coincide con desktop y mobile sin desbordar', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.setViewportSize({ width: 1440, height: 1024 })
  await pagina.goto('/torneos/1')
  await esperar(pagina.getByRole('dialog')).toBeVisible()
  esperar(await pagina.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await pagina.screenshot({ path: 'test-results/detalle-torneo-escritorio.png', fullPage: true })

  await pagina.setViewportSize({ width: 390, height: 844 })
  await pagina.reload()
  await esperar(pagina.getByRole('dialog')).toBeVisible()
  esperar(await pagina.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await pagina.screenshot({ path: 'test-results/detalle-torneo-movil.png', fullPage: true })
})
