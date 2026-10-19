import { test as prueba, expect as esperar } from '@playwright/test'
import { prepararSesion } from './datosSesion.js'
import { interceptarDetallesTorneo } from './datosTorneoDetalle.js'

prueba.beforeEach(async ({ page: pagina }) => { await interceptarDetallesTorneo(pagina) })

prueba('sin sesión, la sala redirige a login', async ({ page: pagina }) => {
  await pagina.goto('/torneos/14/sala')
  await esperar(pagina).toHaveURL(/\/login$/)
})

prueba('obtiene el torneo desde la ruta y muestra participantes y cupos', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.goto('/torneos/14/sala')

  await esperar(pagina.getByRole('heading', { name: 'Copa de Amigos' })).toBeVisible()
  await esperar(pagina.getByRole('heading', { name: 'Participantes · 6/8' })).toBeVisible()
  await esperar(pagina.getByText('Lucas (creador)')).toBeVisible()
  await esperar(pagina.getByText('Lugar disponible').first()).toBeVisible()
})

prueba('copia el código y muestra una confirmación local', async ({ page: pagina, context: contexto }) => {
  await contexto.grantPermissions(['clipboard-read', 'clipboard-write'])
  await prepararSesion(pagina)
  await pagina.goto('/torneos/14/sala')

  await pagina.getByRole('button', { name: 'Copiar código' }).click()
  await esperar(pagina.getByRole('status')).toHaveText('Código copiado al portapapeles.')
  esperar(await pagina.evaluate(() => navigator.clipboard.readText())).toBe('FQA8K2')
})

prueba('un participante espera la generación automática de cruces', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.goto('/torneos/5/sala')

  await esperar(pagina.getByText('Los cruces se generarán automáticamente al completar el cupo.')).toBeVisible()
  await esperar(pagina.getByRole('button', { name: 'Iniciar torneo' })).toHaveCount(0)
})

prueba('la sala incompleta no permite abrir el cuadro', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.goto('/torneos/14/sala')

  await esperar(pagina.getByRole('link', { name: 'Ver cuadro' })).toHaveCount(0)
  await esperar(pagina).toHaveURL(/\/torneos\/14\/sala$/)
})

prueba('salir de la sala llama al backend y vuelve al listado', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  let recibida = false
  await pagina.route('**/api/torneos/14/salir', (ruta) => {
    recibida = true
    esperar(ruta.request().method()).toBe('DELETE')
    return ruta.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Salida exitosa' }) })
  })
  await pagina.goto('/torneos/14/sala')
  await pagina.getByRole('button', { name: 'Salir del torneo' }).first().click()
  await esperar(pagina).toHaveURL(/\/torneos$/)
  esperar(recibida).toBe(true)
})

prueba('el creador puede cancelar la salida antes de cerrar el torneo para todos', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.route('**/api/usuarios/me', (ruta) => ruta.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 10, nombre: 'Lucas', email: 'lucas@futbolquiz.com', rol: 'JUGADOR', puntaje_total: 0 }) }))
  let huboSalida = false
  await pagina.route('**/api/torneos/14/salir', (ruta) => { huboSalida = true; return ruta.fulfill({ status: 200, body: '{}' }) })
  pagina.once('dialog', (dialogo) => dialogo.dismiss())
  await pagina.goto('/torneos/14/sala')
  await pagina.getByRole('button', { name: 'Salir del torneo' }).first().click()
  await esperar(pagina).toHaveURL(/\/torneos\/14\/sala$/)
  esperar(huboSalida).toBe(false)
})

prueba('una sala completa genera cruces y permite abrir el cuadro', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.goto('/torneos/17/sala')

  await esperar(pagina.getByText('Los cruces se generaron automáticamente.').first()).toBeVisible()
  await pagina.getByRole('link', { name: 'Ver cuadro' }).click()
  await esperar(pagina).toHaveURL(/\/torneos\/17\/cuadro$/)
  await esperar(pagina.getByRole('heading', { name: 'Copa Completa', exact: true })).toBeVisible()
})

prueba('muestra un estado específico para un torneo inexistente', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.goto('/torneos/404/sala')

  await esperar(pagina.getByRole('alert').getByText('Torneo inexistente')).toBeVisible()
  await esperar(pagina.getByRole('link', { name: 'Volver a Torneos' })).toBeVisible()
})

prueba('la sala coincide con desktop y mobile sin desbordar', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.setViewportSize({ width: 1440, height: 1024 })
  await pagina.goto('/torneos/14/sala')
  await esperar(pagina.getByRole('heading', { name: 'Participantes · 6/8' })).toBeVisible()
  esperar(await pagina.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await pagina.screenshot({ path: 'test-results/sala-torneo-escritorio.png', fullPage: true })

  await pagina.setViewportSize({ width: 390, height: 844 })
  await pagina.reload()
  await esperar(pagina.getByRole('banner').getByText('Código FQA8K2')).toBeVisible()
  await esperar(pagina.getByText('6 de 8 jugadores listos')).toBeVisible()
  esperar(await pagina.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await pagina.screenshot({ path: 'test-results/sala-torneo-movil.png', fullPage: true })
})
