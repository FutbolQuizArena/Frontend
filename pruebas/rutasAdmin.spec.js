import { test as prueba, expect as esperar } from '@playwright/test'
import { prepararSesion } from './datosSesion.js'

prueba('un jugador no monta ninguna pantalla ni consulta endpoints administrativos', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  let consultasAdmin = 0
  await pagina.route('**/api/admin/**', (ruta) => {
    consultasAdmin += 1
    return ruta.fulfill({ status: 403, json: { message: 'Acceso denegado' } })
  })
  for (const ruta of ['/admin', '/admin/categorias', '/admin/usuarios', '/admin/preguntas/nueva', '/admin/categorias/nueva']) {
    await pagina.goto(ruta)
    await esperar(pagina.getByRole('alert')).toContainText('Solo los administradores')
    await esperar(pagina.getByRole('link', { name: 'Volver al inicio' })).toBeVisible()
  }
  esperar(consultasAdmin).toBe(0)
})

prueba('la vista previa conserva la navegación administrativa en celular', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.setViewportSize({ width: 390, height: 844 })
  await pagina.goto('/admin/preguntas/nueva?vistaPrevia=1')
  const navegacion = pagina.getByRole('navigation', { name: 'Secciones de administración' }).last()
  await esperar(navegacion.getByRole('link', { name: 'Categorías' })).toBeVisible()
  await navegacion.getByRole('link', { name: 'Categorías' }).click()
  await esperar(pagina).toHaveURL(/\/admin\/categorias\?vistaPrevia=1$/)
  await esperar(pagina.getByRole('heading', { name: 'Gestión de categorías' })).toBeVisible()
  await navegacion.getByRole('link', { name: 'Usuarios' }).click()
  await esperar(pagina).toHaveURL(/\/admin\/usuarios\?vistaPrevia=1$/)
  await esperar(pagina.getByRole('heading', { name: 'Gestión de usuarios' })).toBeVisible()
})
