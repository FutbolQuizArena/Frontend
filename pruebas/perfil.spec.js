import { test as prueba, expect as esperar } from '@playwright/test'

prueba('el perfil permite editar datos temporales y volver a la Home', async ({ page: pagina }) => {
  await pagina.setViewportSize({ width: 1440, height: 1024 })
  await pagina.goto('/perfil')

  await esperar(pagina.getByRole('heading', { name: 'Editar perfil' })).toBeVisible()
  await esperar(pagina.getByLabel('Nombre')).toHaveValue('Lucas Agüero')
  await esperar(pagina.getByLabel('Correo electrónico')).toHaveValue('lucas@futbolquiz.com')

  await pagina.getByLabel('Nombre').fill('Lucía Pérez')
  await pagina.getByRole('button', { name: 'Guardar cambios' }).click()
  await esperar(pagina.getByRole('status')).toHaveText('Tus cambios se guardaron correctamente.')
  await esperar(pagina.getByLabel('Nombre')).toHaveValue('Lucía Pérez')

  await pagina.getByRole('button', { name: 'Cancelar' }).click()
  await esperar(pagina).toHaveURL(/\/home$/)
})

prueba('el perfil se adapta al celular y mantiene la navegación', async ({ page: pagina }) => {
  await pagina.setViewportSize({ width: 390, height: 844 })
  await pagina.goto('/perfil')

  await esperar(pagina.getByRole('banner').getByText('Datos personales', { exact: true })).toBeVisible()
  await esperar(pagina.getByRole('textbox', { name: 'Usuario', exact: true })).toBeVisible()
  await esperar(pagina.getByLabel('Bio')).toBeVisible()
  esperar(await pagina.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

  await pagina.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Inicio' }).click()
  await esperar(pagina).toHaveURL(/\/home$/)
})
