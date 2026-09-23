import { test as prueba, expect as esperar } from '@playwright/test'
import { prepararSesion } from './datosSesion.js'

prueba('sin sesión, el listado de torneos redirige a login', async ({ page: pagina }) => {
  await pagina.goto('/torneos')
  await esperar(pagina).toHaveURL(/\/login$/)
})

prueba('muestra los torneos propios y permite abrir la creación', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.setViewportSize({ width: 1440, height: 1024 })
  await pagina.goto('/torneos')

  await esperar(pagina.getByRole('heading', { name: 'Torneos', level: 1 })).toBeVisible()
  await esperar(pagina.getByRole('region', { name: 'Mis torneos' }).getByText('Copa Leyendas')).toBeVisible()
  await pagina.screenshot({ path: 'test-results/torneos-escritorio.png', fullPage: true })
  await pagina.getByRole('link', { name: 'Crear torneo', exact: true }).click()
  await esperar(pagina).toHaveURL(/\/torneos\/crear$/)
})

prueba('cambia entre disponibles y finalizados usando los datos mock', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.setViewportSize({ width: 1440, height: 1024 })
  await pagina.goto('/torneos')

  await pagina.getByRole('button', { name: 'Disponibles' }).click()
  await esperar(pagina.getByRole('heading', { name: 'Torneos disponibles' })).toBeVisible()
  await esperar(pagina.getByRole('region', { name: 'Disponibles' }).getByText('Liga de Campeones')).toBeVisible()
  await esperar(pagina.getByRole('link', { name: 'Ingresar código' })).toHaveAttribute('href', '/torneos/unirse')
  await pagina.screenshot({ path: 'test-results/torneos-disponibles-escritorio.png', fullPage: true })

  await pagina.getByRole('button', { name: 'Finalizados' }).click()
  await esperar(pagina.getByRole('heading', { name: 'Torneos finalizados' })).toBeVisible()
  await esperar(pagina.getByRole('region', { name: 'Finalizados' }).getByText('Leyendas de América')).toBeVisible()
  await esperar(pagina.getByText('Campeón · Copa Federal')).toBeHidden()
  esperar(await pagina.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await pagina.screenshot({ path: 'test-results/torneos-finalizados-escritorio.png', fullPage: true })
})

prueba('la vista móvil usa tarjetas, acciones rápidas y navegación inferior', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.setViewportSize({ width: 390, height: 844 })
  await pagina.goto('/torneos')

  await esperar(pagina.getByRole('banner').getByText('Competí y llegá a la final')).toBeVisible()
  await esperar(pagina.getByRole('heading', { name: 'ACTIVOS' })).toBeVisible()
  await esperar(pagina.getByRole('region', { name: 'Acciones rápidas' })).toBeVisible()
  await esperar(pagina.getByText('Campeón · Copa Federal')).toBeVisible()
  await esperar(pagina.getByRole('navigation', { name: 'Navegación principal' })).toBeVisible()
  esperar(await pagina.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await pagina.screenshot({ path: 'test-results/torneos-movil.png', fullPage: true })

  await pagina.getByRole('button', { name: 'Disponibles' }).click()
  await esperar(pagina.getByRole('region', { name: 'Disponibles' }).getByText('Liga de Campeones')).toBeVisible()
  await pagina.getByPlaceholder('Buscar por nombre o código').fill('COPA04')
  await esperar(pagina.getByText('Copa Nacional')).toBeVisible()
  await esperar(pagina.getByText('Liga de Campeones')).toBeHidden()
  await pagina.getByPlaceholder('Buscar por nombre o código').clear()
  await pagina.screenshot({ path: 'test-results/torneos-disponibles-movil.png', fullPage: true })

  await pagina.getByRole('button', { name: 'Finalizados' }).click()
  await esperar(pagina.getByRole('region', { name: 'Finalizados' }).getByText('Leyendas de América')).toBeVisible()
  await pagina.screenshot({ path: 'test-results/torneos-finalizados-movil.png', fullPage: true })
})
