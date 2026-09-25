import { test as prueba, expect as esperar } from '@playwright/test'
import { prepararSesion } from './datosSesion.js'

prueba('un jugador no puede consultar el banco de preguntas', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.goto('/admin')
  await esperar(pagina.getByRole('alert')).toContainText('Solo los administradores')
  await esperar(pagina.getByRole('heading', { name: 'Preguntas' })).toHaveCount(0)
})

prueba('el administrador busca, filtra y pagina las preguntas de ejemplo', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.route('**/api/usuarios/me', (ruta) => ruta.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 2, nombre: 'Admin', email: 'admin@futbolquiz.com', rol: 'ADMINISTRADOR', puntaje_total: 0 }) }))
  await pagina.goto('/admin')

  await esperar(pagina.getByRole('heading', { name: 'Preguntas' })).toBeVisible()
  await esperar(pagina.getByRole('listitem')).toHaveCount(5)
  await pagina.getByRole('button', { name: 'Siguiente' }).click()
  await esperar(pagina.getByText('Página 2 de 3')).toBeVisible()
  await esperar(pagina.getByRole('listitem')).toHaveCount(5)

  await pagina.getByLabel('Buscar pregunta').fill('Argentina')
  await esperar(pagina.getByText('Página 1 de 1')).toBeVisible()
  await esperar(pagina.getByRole('listitem')).toHaveCount(1)
  await pagina.getByLabel('Categoría').selectOption('Champions League')
  await esperar(pagina.getByText('No hay preguntas que coincidan')).toBeVisible()
  await pagina.getByLabel('Buscar pregunta').clear()
  await pagina.getByLabel('Dificultad').selectOption('Media')
  await esperar(pagina.getByRole('listitem')).toHaveCount(1)

  await pagina.setViewportSize({ width: 390, height: 844 })
  esperar(await pagina.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await esperar(pagina.getByRole('heading', { name: 'Preguntas' })).toBeVisible()
})
