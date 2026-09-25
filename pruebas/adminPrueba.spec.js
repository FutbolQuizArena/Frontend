import { test as prueba, expect as esperar } from '@playwright/test'

prueba('la cuenta admin de prueba abre el panel sin consultar el backend', async ({ page: pagina }) => {
  await pagina.route('**/api/auth/login', (ruta) => ruta.abort())
  await pagina.route('**/api/usuarios/me', (ruta) => ruta.abort())
  await pagina.goto('/login')
  await pagina.getByLabel('Correo electrónico').fill('admin@futbolquiz.local')
  await pagina.getByLabel('Contraseña').fill('Admin1234!')
  await pagina.getByRole('button', { name: 'Ingresar' }).click()
  await esperar(pagina).toHaveURL(/\/admin$/)
  await esperar(pagina.getByRole('heading', { name: 'Preguntas' })).toBeVisible()
  await pagina.getByRole('link', { name: 'Nueva pregunta' }).click()
  await esperar(pagina.getByRole('heading', { name: 'Nueva pregunta' })).toBeVisible()
})
