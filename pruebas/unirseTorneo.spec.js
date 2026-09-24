import { test as prueba, expect as esperar } from '@playwright/test'
import { prepararSesion } from './datosSesion.js'

const torneoUnido = {
  nombre: 'Liga de Campeones',
  cantidad_participantes: 8,
  id: 5,
  codigo_acceso: 'LIGA24',
  estado: 'ESPERANDO_JUGADORES',
  creador_id: 2,
  fecha_creacion: '2026-09-24T12:00:00Z',
}

async function interceptarListadoDisponible(pagina) {
  await pagina.route('**/api/torneos?*', (ruta) => ruta.fulfill({ status: 200, contentType: 'application/json', body: '[]' }))
}

prueba('sin sesión, unirse a torneo redirige a login', async ({ page: pagina }) => {
  await pagina.goto('/torneos/unirse')
  await esperar(pagina).toHaveURL(/\/login$/)
})

prueba('abre el ingreso desde el listado y valida el código vacío', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await interceptarListadoDisponible(pagina)
  await pagina.goto('/torneos')
  await pagina.getByRole('button', { name: 'Disponibles' }).click()
  await pagina.getByRole('link', { name: 'Ingresar código' }).click()

  await esperar(pagina).toHaveURL(/\/torneos\/unirse$/)
  await pagina.getByRole('button', { name: 'Unirme al torneo' }).click()
  await esperar(pagina.getByText('Ingresá el código del torneo.')).toBeVisible()
  await esperar(pagina.getByRole('textbox', { name: /Código/ })).toBeFocused()
})

prueba('ingresa con un código abierto y bloquea envíos duplicados', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await interceptarListadoDisponible(pagina)
  let cantidadSolicitudes = 0
  await pagina.route('**/api/torneos/unirse', async (ruta) => {
    cantidadSolicitudes += 1
    esperar(ruta.request().headers().authorization).toMatch(/^Bearer /)
    esperar(ruta.request().postDataJSON()).toEqual({ codigo_acceso: 'LIGA24', contrasena: null })
    await new Promise((resolver) => setTimeout(resolver, 180))
    await ruta.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(torneoUnido) })
  })
  await pagina.goto('/torneos/unirse')
  await pagina.getByRole('textbox', { name: /Código/ }).fill('liga 24')
  await pagina.getByRole('button', { name: 'Unirme al torneo' }).evaluate((boton) => boton.click())

  await esperar(pagina.locator('button[aria-busy="true"]')).toBeDisabled()
  await esperar(pagina.getByRole('status')).toContainText('Liga de Campeones')
  await esperar(pagina).toHaveURL(/\/torneos$/)
  esperar(cantidadSolicitudes).toBe(1)
})

prueba('permite ingresar a un torneo protegido con la contraseña correcta', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await interceptarListadoDisponible(pagina)
  await pagina.route('**/api/torneos/unirse', async (ruta) => {
    esperar(ruta.request().postDataJSON()).toEqual({ codigo_acceso: 'FQA8K2', contrasena: 'cancha' })
    await ruta.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...torneoUnido, id: 14, nombre: 'Copa de Amigos', codigo_acceso: 'FQA8K2' }) })
  })
  await pagina.goto('/torneos/unirse')
  await pagina.getByRole('textbox', { name: /Código/ }).fill('fqa8k2')
  await pagina.getByLabel('Contraseña (si corresponde)').fill('cancha')
  await pagina.getByRole('button', { name: 'Unirme al torneo' }).click()

  await esperar(pagina.getByRole('status')).toContainText('Copa de Amigos')
  await esperar(pagina).toHaveURL(/\/torneos$/)
})

for (const [codigo, contrasena, mensaje] of [
  ['XXXXXX', '', 'No encontramos un torneo con ese código.'],
  ['FQA8K2', 'incorrecta', 'La contraseña del torneo es incorrecta.'],
  ['LLENO8', '', 'El torneo ya alcanzó el máximo de participantes.'],
  ['INSCR1', '', 'Ya estás registrado en este torneo.'],
]) {
  prueba(`muestra el error del backend para el código ${codigo}`, async ({ page: pagina }) => {
    await prepararSesion(pagina)
    await pagina.route('**/api/torneos/unirse', (ruta) => ruta.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ code: 'TORNEO_NO_DISPONIBLE', message: mensaje, detail: null }),
    }))
    await pagina.goto('/torneos/unirse')
    await pagina.getByRole('textbox', { name: /Código/ }).fill(codigo)
    if (contrasena) await pagina.getByLabel('Contraseña (si corresponde)').fill(contrasena)
    await pagina.getByRole('button', { name: 'Unirme al torneo' }).click()
    await esperar(pagina.getByRole('alert')).toHaveText(mensaje)
    await esperar(pagina).toHaveURL(/\/torneos\/unirse$/)
  })
}

prueba('la pantalla coincide con las composiciones desktop y mobile sin desbordar', async ({ page: pagina }) => {
  await prepararSesion(pagina)

  await pagina.setViewportSize({ width: 1440, height: 1024 })
  await pagina.goto('/torneos/unirse')
  await pagina.getByRole('textbox', { name: /Código/ }).fill('FQA8K2')
  await esperar(pagina.getByText('El backend verificará el código, el cupo y la contraseña del torneo.')).toBeVisible()
  esperar(await pagina.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await pagina.screenshot({ path: 'test-results/unirse-torneo-escritorio.png', fullPage: true })

  await pagina.setViewportSize({ width: 390, height: 844 })
  await pagina.reload()
  await esperar(pagina.getByRole('heading', { name: 'Entrá a una sala' })).toBeVisible()
  await esperar(pagina.getByText('Dejala vacía si el torneo no tiene contraseña.')).toBeVisible()
  esperar(await pagina.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await pagina.screenshot({ path: 'test-results/unirse-torneo-movil.png', fullPage: true })
})
