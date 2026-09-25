import { test as prueba, expect as esperar } from '@playwright/test'
import { prepararSesion } from './datosSesion.js'

prueba('el administrador consulta y busca categorías desde el panel', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.goto('/admin?vistaPrevia=1')
  await pagina.getByRole('link', { name: 'Categorías' }).click()
  await esperar(pagina).toHaveURL(/\/admin\/categorias\?vistaPrevia=1$/)
  await esperar(pagina.getByRole('heading', { name: 'Categorías', exact: true })).toBeVisible()
  await esperar(pagina.getByRole('listitem')).toHaveCount(5)
  await pagina.getByLabel('Buscar categoría').fill('mund')
  await esperar(pagina.getByRole('listitem')).toHaveCount(1)
  await esperar(pagina.getByText('Mundiales')).toBeVisible()
  await pagina.getByLabel('Buscar categoría').fill('no existe')
  await esperar(pagina.getByText('No hay categorías que coincidan')).toBeVisible()
  await pagina.setViewportSize({ width: 390, height: 844 })
  esperar(await pagina.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

prueba('un jugador no puede consultar las categorías de administración', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.goto('/admin/categorias')
  await esperar(pagina.getByRole('alert')).toContainText('Solo los administradores')
  await esperar(pagina.getByRole('heading', { name: 'Gestión de categorías' })).toHaveCount(0)
})
