import { test as prueba, expect as esperar } from '@playwright/test'
import { prepararSesion } from './datosSesion.js'

prueba('sin sesión, unirse a torneo redirige a login', async ({ page: pagina }) => {
  await pagina.goto('/torneos/unirse')
  await esperar(pagina).toHaveURL(/\/login$/)
})

prueba('abre el ingreso desde el listado y valida el código vacío', async ({ page: pagina }) => {
  await prepararSesion(pagina)
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
  await pagina.goto('/torneos/unirse')
  await pagina.getByRole('textbox', { name: /Código/ }).fill('liga 24')
  await pagina.getByRole('button', { name: 'Unirme al torneo' }).evaluate((boton) => boton.click())

  await esperar(pagina.locator('button[aria-busy="true"]')).toBeDisabled()
  await esperar(pagina.getByRole('status')).toContainText('Liga de Campeones')
  await esperar(pagina).toHaveURL(/\/torneos\/5\/sala$/)
  await esperar(pagina.getByRole('heading', { name: 'Sala del torneo' })).toBeVisible()
})

prueba('permite ingresar a un torneo protegido con la contraseña correcta', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.goto('/torneos/unirse')
  await pagina.getByRole('textbox', { name: /Código/ }).fill('fqa8k2')
  await pagina.getByLabel('Contraseña (si corresponde)').fill('cancha')
  await pagina.getByRole('button', { name: 'Unirme al torneo' }).click()

  await esperar(pagina.getByRole('status')).toContainText('Copa de Amigos')
  await esperar(pagina).toHaveURL(/\/torneos\/14\/sala$/)
})

for (const [codigo, contrasena, mensaje] of [
  ['XXXXXX', '', 'No encontramos un torneo con ese código.'],
  ['FQA8K2', 'incorrecta', 'La contraseña del torneo es incorrecta.'],
  ['LLENO8', '', 'El torneo ya alcanzó el máximo de participantes.'],
  ['INSCR1', '', 'Ya estás registrado en este torneo.'],
]) {
  prueba(`muestra el error mock para el código ${codigo}`, async ({ page: pagina }) => {
    await prepararSesion(pagina)
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
  await esperar(pagina.getByText('El torneo “Copa de Amigos” tiene 6 de 8 participantes.')).toBeVisible()
  esperar(await pagina.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await pagina.screenshot({ path: 'test-results/unirse-torneo-escritorio.png', fullPage: true })

  await pagina.setViewportSize({ width: 390, height: 844 })
  await pagina.reload()
  await esperar(pagina.getByRole('heading', { name: 'Entrá a una sala' })).toBeVisible()
  await esperar(pagina.getByText('Dejala vacía si el torneo no tiene contraseña.')).toBeVisible()
  esperar(await pagina.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await pagina.screenshot({ path: 'test-results/unirse-torneo-movil.png', fullPage: true })
})
