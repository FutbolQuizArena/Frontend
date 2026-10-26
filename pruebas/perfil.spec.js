import { test as prueba, expect as esperar } from './fixturesCobertura.js'
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

prueba('mi perfil abre la edición y guarda los datos con el backend', async ({ page: pagina }) => {
  await pagina.setViewportSize({ width: 1440, height: 1024 })
  await pagina.goto('/perfil')

  await esperar(pagina.getByRole('heading', { name: 'Mi perfil' })).toBeVisible()
  await esperar(pagina.getByText('2.450 puntos')).toBeVisible()
  await pagina.getByRole('link', { name: /Editar perfil/ }).click()
  await esperar(pagina.getByRole('heading', { name: 'Editar perfil' })).toBeVisible()
  await esperar(pagina.getByLabel('Nombre')).toHaveValue('Lucas Agüero')
  await esperar(pagina.getByLabel('Correo electrónico')).toHaveValue('lucas@futbolquiz.com')

  await pagina.getByLabel('Nombre').fill('Lucía Pérez')
  await pagina.getByRole('button', { name: 'Guardar cambios' }).click()
  await esperar(pagina.getByRole('status')).toHaveText('Tus cambios se guardaron correctamente.')
  await esperar(pagina.getByLabel('Nombre')).toHaveValue('Lucía Pérez')

  await pagina.getByRole('button', { name: 'Cancelar' }).click()
  await esperar(pagina).toHaveURL(/\/perfil$/)
})

prueba('mi perfil se adapta al celular y permite editar la contraseña', async ({ page: pagina }) => {
  await pagina.setViewportSize({ width: 390, height: 844 })
  await pagina.goto('/perfil')

  await esperar(pagina.getByRole('banner').getByText('Mi perfil', { exact: true })).toBeVisible()
  await pagina.getByRole('link', { name: /Editar perfil/ }).click()
  await esperar(pagina.getByRole('banner').getByText('Datos personales', { exact: true })).toBeVisible()
  await esperar(pagina.getByLabel('Contraseña actual')).toBeVisible()
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
  await pagina.goto('/perfil/editar')
  await pagina.getByLabel('Contraseña actual').fill('anterior123')
  await pagina.getByLabel('Nueva contraseña').fill('nueva12345')
  await pagina.getByRole('button', { name: 'Guardar cambios' }).click()
  await esperar(pagina.getByRole('alert')).toHaveText('La contraseña actual no coincide.')
  esperar(datosEnviados).toEqual({ nombre: 'Lucas Agüero', email: 'lucas@futbolquiz.com', password_actual: 'anterior123', nueva_password: 'nueva12345' })
})

prueba('mi perfil enlaza al historial y a los torneos sin inventar estadísticas', async ({ page: pagina }) => {
  await pagina.goto('/perfil')
  await esperar(pagina.getByRole('heading', { name: 'Cuenta y actividad' })).toBeVisible()
  await esperar(pagina.getByRole('heading', { name: 'Resumen' })).toBeVisible()
  await esperar(pagina.getByText('Las estadísticas estarán disponibles cuando se integre el historial.')).toBeVisible()

  await pagina.getByRole('link', { name: /Historial de partidas/ }).click()
  await esperar(pagina.getByRole('heading', { name: 'Historial próximamente' })).toBeVisible()
  await pagina.getByRole('link', { name: 'Volver a mi perfil' }).click()
  await pagina.getByRole('link', { name: /Mis torneos/ }).click()
  await esperar(pagina).toHaveURL(/\/torneos$/)
})

prueba('mi perfil muestra un error si no se pueden cargar los datos', async ({ page: pagina }) => {
  await pagina.route('**/api/usuarios/me', (ruta) => ruta.fulfill({
    status: 503, contentType: 'application/json',
    body: JSON.stringify({ message: 'Servicio temporalmente no disponible.' }),
  }))
  await pagina.goto('/perfil')
  await esperar(pagina.getByRole('alert')).toBeVisible()
  await esperar(pagina.getByRole('link', { name: /Editar perfil/ })).toHaveCount(0)
})
