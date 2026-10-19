import { test as prueba, expect as esperar } from '@playwright/test'
import { prepararSesion } from './datosSesion.js'

prueba.beforeEach(async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.route('**/api/usuarios/me', (ruta) => {
    const datos = ruta.request().method() === 'PATCH' ? ruta.request().postDataJSON() : {}
    return ruta.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      id: 1, nombre: datos.nombre || 'Lucas Agüero', email: datos.email || 'lucas@futbolquiz.com',
      rol: 'JUGADOR', puntaje_total: 2450, esta_habilitado: true, fecha_alta: '2026-09-01T12:00:00Z',
    }) })
  })
})

prueba('el perfil guarda los datos con el backend y vuelve a la Home', async ({ page: pagina }) => {
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
  await esperar(pagina.getByLabel('Nombre')).toHaveValue('Lucas Agüero')
  await esperar(pagina.getByLabel('Correo electrónico')).toHaveValue('lucas@futbolquiz.com')
  esperar(await pagina.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

  await pagina.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Inicio' }).click()
  await esperar(pagina).toHaveURL(/\/home$/)
})

prueba('el perfil envía el contrato de contraseña y muestra errores del backend', async ({ page: pagina }) => {
  let datosEnviados
  await pagina.route('**/api/usuarios/me', (ruta) => {
    if (ruta.request().method() === 'PATCH') {
      datosEnviados = ruta.request().postDataJSON()
      return ruta.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ code: 'PASSWORD_INVALIDA', message: 'La contraseña actual no coincide.' }) })
    }
    return ruta.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 1, nombre: 'Lucas Agüero', email: 'lucas@futbolquiz.com', rol: 'JUGADOR', puntaje_total: 2450 }) })
  })
  await pagina.goto('/perfil')
  await pagina.getByLabel('Contraseña actual').fill('anterior123')
  await pagina.getByLabel('Nueva contraseña').fill('nueva12345')
  await pagina.getByRole('button', { name: 'Guardar cambios' }).click()
  await esperar(pagina.getByRole('alert')).toHaveText('La contraseña actual no coincide.')
  esperar(datosEnviados).toEqual({ nombre: 'Lucas Agüero', email: 'lucas@futbolquiz.com', password_actual: 'anterior123', nueva_password: 'nueva12345' })
})
