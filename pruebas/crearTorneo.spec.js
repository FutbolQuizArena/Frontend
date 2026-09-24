import { test as prueba, expect as esperar } from '@playwright/test'
import { prepararSesion } from './datosSesion.js'

const torneoCreado = {
  id: 27,
  nombre: 'Copa del Barrio',
  cantidad_participantes: 16,
  codigo_acceso: 'BARR27',
  estado: 'ESPERANDO_JUGADORES',
  creador_id: 1,
  fecha_creacion: '2026-09-24T12:00:00Z',
}

async function interceptarMisTorneos(pagina) {
  await pagina.route('**/api/torneos?filtro=mios', (ruta) => ruta.fulfill({ status: 200, contentType: 'application/json', body: '[]' }))
}

prueba('sin sesión, crear torneo redirige a login', async ({ page: pagina }) => {
  await pagina.goto('/torneos/crear')
  await esperar(pagina).toHaveURL(/\/login$/)
})

prueba('muestra y valida el formulario de creación', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await interceptarMisTorneos(pagina)
  await pagina.setViewportSize({ width: 1440, height: 1024 })
  await pagina.goto('/torneos')
  await pagina.getByRole('link', { name: 'Crear torneo' }).click()

  await esperar(pagina).toHaveURL(/\/torneos\/crear$/)
  await esperar(pagina.getByRole('heading', { name: 'Crear torneo', level: 1 })).toBeVisible()
  await esperar(pagina.getByRole('button', { name: '8 jugadores' })).toHaveAttribute('aria-pressed', 'true')
  await pagina.getByRole('button', { name: 'Crear torneo', exact: true }).click()
  await esperar(pagina.getByText('Ingresá el nombre del torneo.')).toBeVisible()
  await esperar(pagina.getByLabel('Nombre')).toBeFocused()
  await pagina.screenshot({ path: 'test-results/crear-torneo-escritorio.png', fullPage: true })
})

prueba('crea un torneo con el endpoint real y evita envíos duplicados', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  let cantidadSolicitudes = 0
  await pagina.route('**/api/torneos', async (ruta) => {
    cantidadSolicitudes += 1
    const solicitud = ruta.request()
    esperar(solicitud.headers().authorization).toMatch(/^Bearer /)
    esperar(solicitud.postDataJSON()).toEqual({ nombre: 'Copa del Barrio', cantidad_participantes: 16, contrasena_acceso: 'tribuna' })
    await new Promise((resolver) => setTimeout(resolver, 180))
    await ruta.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(torneoCreado) })
  })
  await pagina.goto('/torneos/crear')

  await pagina.getByLabel('Nombre').fill('Copa del Barrio')
  await pagina.getByRole('button', { name: '16 jugadores' }).click()
  await pagina.getByLabel('Contraseña de acceso (opcional)').fill('tribuna')
  await pagina.getByRole('button', { name: 'Crear torneo', exact: true }).click()

  await esperar(pagina.getByRole('button', { name: 'Creando torneo…' })).toBeDisabled()
  await esperar(pagina.getByRole('status')).toHaveText('Torneo creado correctamente. Código de acceso: BARR27')
  esperar(cantidadSolicitudes).toBe(1)
  await esperar(pagina).toHaveURL(/\/torneos\/crear$/)
})

prueba('muestra el message real devuelto por el backend', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.route('**/api/torneos', (ruta) => ruta.fulfill({
    status: 422,
    contentType: 'application/json',
    body: JSON.stringify({ code: 'ERROR_VALIDACION', message: 'El nombre del torneo no es válido', detail: null }),
  }))
  await pagina.goto('/torneos/crear')

  await pagina.getByLabel('Nombre').fill('Copa inválida')
  await pagina.getByRole('button', { name: 'Crear torneo', exact: true }).click()
  await esperar(pagina.getByRole('alert')).toHaveText('El nombre del torneo no es válido')
})

prueba('la versión móvil conserva el diseño y la navegación', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.setViewportSize({ width: 390, height: 844 })
  await pagina.goto('/torneos/crear')

  await esperar(pagina.getByRole('banner').getByText('Configuración')).toBeVisible()
  await esperar(pagina.getByRole('heading', { name: 'Armá tu torneo' })).toBeVisible()
  await esperar(pagina.getByText('CÓDIGO DE ACCESO')).toBeVisible()
  await esperar(pagina.getByRole('button', { name: 'Crear y obtener código' })).toBeVisible()
  esperar(await pagina.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await pagina.screenshot({ path: 'test-results/crear-torneo-movil.png', fullPage: true })
})
