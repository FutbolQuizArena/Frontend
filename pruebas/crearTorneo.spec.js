import { test as prueba, expect as esperar } from '@playwright/test'
import { prepararSesion } from './datosSesion.js'

prueba('sin sesión, crear torneo redirige a login', async ({ page: pagina }) => {
  await pagina.goto('/torneos/crear')
  await esperar(pagina).toHaveURL(/\/login$/)
})

prueba('muestra y valida el formulario de creación', async ({ page: pagina }) => {
  await prepararSesion(pagina)
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

prueba('crea un torneo con el mock y evita envíos duplicados', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.goto('/torneos/crear')

  await pagina.getByLabel('Nombre').fill('Copa del Barrio')
  await pagina.getByRole('button', { name: '16 jugadores' }).click()
  await pagina.getByLabel('Contraseña de acceso (opcional)').fill('tribuna')
  await pagina.getByRole('button', { name: 'Crear torneo', exact: true }).click()

  await esperar(pagina.getByRole('button', { name: 'Creando torneo…' })).toBeDisabled()
  await esperar(pagina.getByRole('status')).toContainText('Torneo creado correctamente. Código temporal:')
  await esperar(pagina).toHaveURL(/\/torneos\/crear$/)
})

prueba('muestra el mensaje de error devuelto por el servicio mock', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.goto('/torneos/crear')

  await pagina.getByLabel('Nombre').fill('Copa repetida')
  await pagina.getByRole('button', { name: 'Crear torneo', exact: true }).click()
  await esperar(pagina.getByRole('status')).toBeVisible()
  await pagina.getByRole('button', { name: 'Crear torneo', exact: true }).click()

  await esperar(pagina.getByRole('alert')).toHaveText('Ya existe un torneo temporal con ese nombre.')
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
