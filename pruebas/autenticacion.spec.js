import { test as prueba, expect as esperar } from '@playwright/test'
import { crearTokenPrueba } from './datosSesion.js'

const urlRegistro = 'https://api.futbolquiz.test/api/auth/registro'
const urlLogin = 'https://api.futbolquiz.test/api/auth/login'

prueba.beforeEach(async ({ context: contexto }) => {
  // Ninguna prueba puede escribir en el backend real.
  await contexto.route('**/api/**', (ruta) => ruta.fulfill({
    status: 503,
    json: { message: 'Solicitud sin respuesta de prueba configurada.' },
  }))
})

async function completarRegistro(pagina, contrasena = 'Clave123') {
  await pagina.getByLabel('Nombre de usuario', { exact: true }).fill('  Martina  ')
  await pagina.getByLabel('Correo electrónico').fill('martina@ejemplo.com')
  await pagina.getByLabel('Contraseña', { exact: true }).fill(contrasena)
  await pagina.getByLabel('Confirmar contraseña').fill(contrasena)
}

prueba('el registro valida los campos antes de hacer una petición', async ({ page: pagina }) => {
  const solicitudes = []
  pagina.on('request', (solicitud) => {
    if (solicitud.url() === urlRegistro) solicitudes.push(solicitud)
  })
  await pagina.goto('/registro')
  await pagina.getByRole('button', { name: 'Crear mi cuenta' }).click()
  await esperar(pagina.getByText('Ingresá tu nombre.')).toBeVisible()
  await esperar(pagina.getByLabel('Nombre de usuario', { exact: true })).toBeFocused()
  await esperar(pagina.getByText('Ingresá tu correo electrónico.')).toBeVisible()
  await esperar(pagina.getByText('Ingresá tu contraseña.')).toBeVisible()
  await esperar(pagina.getByText('Confirmá tu contraseña.')).toBeVisible()
  await completarRegistro(pagina, '1234567')
  await pagina.getByLabel('Correo electrónico').fill('correo@invalido')
  await pagina.getByLabel('Confirmar contraseña').fill('diferente')
  await pagina.getByRole('button', { name: 'Crear mi cuenta' }).click()
  await esperar(pagina.getByText('Ingresá un correo electrónico válido.')).toBeVisible()
  await esperar(pagina.getByText('La contraseña debe tener al menos 8 caracteres.')).toBeVisible()
  await esperar(pagina.getByText('Las contraseñas no coinciden.')).toBeVisible()
  await esperar(pagina.getByLabel('Correo electrónico')).toHaveAttribute('aria-invalid', 'true')
  esperar(solicitudes).toHaveLength(0)
})

prueba('el registro envía el contrato exacto, evita duplicados y confirma sin redirigir', async ({ page: pagina }) => {
  const solicitudes = []
  let liberarSolicitud
  const respuestaPendiente = new Promise((resolver) => { liberarSolicitud = resolver })
  await pagina.route(urlRegistro, async (ruta) => {
    solicitudes.push(ruta.request())
    await respuestaPendiente
    await ruta.fulfill({ status: 201, json: { id: 1, nombre: 'Martina', email: 'martina@ejemplo.com', rol: 'JUGADOR' } })
  })
  await pagina.goto('/registro')
  await completarRegistro(pagina)
  await pagina.getByRole('button', { name: 'Crear mi cuenta' }).click()
  await esperar(pagina.getByRole('button', { name: 'Creando cuenta…' })).toBeDisabled()
  await esperar(pagina.getByLabel('Nombre de usuario', { exact: true })).toBeDisabled()
  await pagina.getByRole('form').dispatchEvent('submit')
  await esperar.poll(() => solicitudes.length).toBe(1)
  esperar(solicitudes[0].method()).toBe('POST')
  esperar(solicitudes[0].headers()['content-type']).toBe('application/json')
  esperar(solicitudes[0].postDataJSON()).toEqual({ nombre: 'Martina', email: 'martina@ejemplo.com', password: 'Clave123' })
  liberarSolicitud()
  await esperar(pagina.getByRole('status')).toContainText('¡Cuenta creada con éxito!')
  await esperar(pagina).toHaveURL(/\/registro$/)
  await esperar(pagina.getByLabel('Contraseña', { exact: true })).toHaveValue('')
  await esperar(pagina.getByRole('button', { name: 'Crear mi cuenta' })).toBeEnabled()
  esperar(solicitudes).toHaveLength(1)
})

prueba('muestra literalmente el message de un 409 y permite corregir el correo', async ({ page: pagina }) => {
  const mensajeServidor = 'Este email ya pertenece a un jugador de la liga.'
  await pagina.route(urlRegistro, (ruta) => ruta.fulfill({
    status: 409, json: { code: 'EMAIL_YA_REGISTRADO', message: mensajeServidor, detail: null },
  }))
  await pagina.goto('/registro')
  await completarRegistro(pagina)
  await pagina.getByRole('button', { name: 'Crear mi cuenta' }).click()
  await esperar(pagina.getByRole('alert')).toHaveText(mensajeServidor)
  await esperar(pagina.getByLabel('Correo electrónico')).toHaveValue('martina@ejemplo.com')
  await esperar(pagina.getByRole('button', { name: 'Crear mi cuenta' })).toBeEnabled()
  await pagina.getByLabel('Correo electrónico').fill('otro@ejemplo.com')
  await esperar(pagina.getByRole('alert')).toHaveCount(0)
})

prueba('permite reintentar el registro tras un fallo de conexión', async ({ page: pagina }) => {
  let intentos = 0
  await pagina.route(urlRegistro, (ruta) => {
    intentos += 1
    if (intentos === 1) return ruta.abort('failed')
    return ruta.fulfill({ status: 201, json: { id: 2, nombre: 'Martina', email: 'martina@ejemplo.com', rol: 'JUGADOR' } })
  })
  await pagina.goto('/registro')
  await completarRegistro(pagina)
  await pagina.getByRole('button', { name: 'Crear mi cuenta' }).click()
  await esperar(pagina.getByRole('alert')).toContainText('No pudimos conectar con el servidor.')
  await pagina.getByRole('button', { name: 'Crear mi cuenta' }).click()
  await esperar(pagina.getByRole('status')).toContainText('¡Cuenta creada con éxito!')
  esperar(intentos).toBe(2)
})

prueba('maneja una respuesta no JSON sin dejar el registro bloqueado', async ({ page: pagina }) => {
  await pagina.route(urlRegistro, (ruta) => ruta.fulfill({ status: 502, contentType: 'text/html', body: '<h1>Bad Gateway</h1>' }))
  await pagina.goto('/registro')
  await completarRegistro(pagina)
  await pagina.getByRole('button', { name: 'Crear mi cuenta' }).click()
  await esperar(pagina.getByRole('alert')).toContainText('El servidor devolvió una respuesta inesperada.')
  await esperar(pagina.getByRole('button', { name: 'Crear mi cuenta' })).toBeEnabled()
})

prueba('el login valida correo y contraseña antes de iniciar sesión', async ({ page: pagina }) => {
  const solicitudes = []
  pagina.on('request', (solicitud) => {
    if (solicitud.url() === urlLogin) solicitudes.push(solicitud)
  })
  await pagina.goto('/login')
  await pagina.getByRole('button', { name: 'Ingresar' }).click()
  await esperar(pagina.getByText('Ingresá tu correo electrónico.')).toBeVisible()
  await esperar(pagina.getByText('Ingresá tu contraseña.')).toBeVisible()
  await pagina.getByLabel('Correo electrónico').fill('no-es-un-correo')
  await pagina.getByRole('button', { name: 'Ingresar' }).click()
  await esperar(pagina.getByText('Ingresá un correo electrónico válido.')).toBeVisible()
  esperar(solicitudes).toHaveLength(0)
})

prueba('el login muestra el message del 401 del backend y permite reintentar', async ({ page: pagina }) => {
  const solicitudesAuth = []
  const mensajeServidor = 'No se pudo verificar el correo o la contraseña de este jugador.'
  await pagina.route(urlLogin, (ruta) => {
    solicitudesAuth.push(ruta.request())
    return ruta.fulfill(solicitudesAuth.length === 1
      ? { status: 401, json: { code: 'CREDENCIALES_INVALIDAS', message: mensajeServidor, detail: null } }
      : { status: 200, json: { access_token: crearTokenPrueba(), token_type: 'bearer' } })
  })
  await pagina.goto('/login')
  await pagina.getByLabel('Correo electrónico').fill('jugador@futbolquiz.com')
  await pagina.getByLabel('Contraseña', { exact: true }).fill('incorrecta')
  await pagina.getByRole('button', { name: 'Ingresar' }).click()
  await esperar(pagina.getByRole('alert')).toHaveText(mensajeServidor)
  await pagina.getByLabel('Contraseña', { exact: true }).fill('FutbolQuiz123')
  await pagina.getByRole('button', { name: 'Ingresar' }).click()
  await esperar(pagina).toHaveURL(/\/home$/)
  await esperar(pagina.getByRole('alert')).toHaveCount(0)
  esperar(solicitudesAuth).toHaveLength(2)
  esperar(await pagina.evaluate(() => ({ local: localStorage.length, sesion: sessionStorage.length }))).toEqual({ local: 0, sesion: 1 })
})

prueba('el login envía el contrato exacto y evita solicitudes duplicadas', async ({ page: pagina }) => {
  const solicitudes = []
  let liberarSolicitud
  const respuestaPendiente = new Promise((resolver) => { liberarSolicitud = resolver })
  await pagina.route(urlLogin, async (ruta) => {
    solicitudes.push(ruta.request())
    await respuestaPendiente
    await ruta.fulfill({ status: 200, json: { access_token: crearTokenPrueba(), token_type: 'bearer' } })
  })
  await pagina.goto('/login')
  await pagina.getByLabel('Correo electrónico').fill('martina@ejemplo.com')
  await pagina.getByLabel('Contraseña', { exact: true }).fill('Clave123')
  await pagina.getByRole('button', { name: 'Ingresar' }).click()
  await esperar(pagina.getByRole('button', { name: 'Ingresando…' })).toBeDisabled()
  await esperar(pagina.getByLabel('Correo electrónico')).toBeDisabled()
  await pagina.getByRole('form').dispatchEvent('submit')
  await esperar.poll(() => solicitudes.length).toBe(1)
  esperar(solicitudes[0].method()).toBe('POST')
  esperar(solicitudes[0].headers()['content-type']).toBe('application/json')
  esperar(solicitudes[0].postDataJSON()).toEqual({ email: 'martina@ejemplo.com', password: 'Clave123' })
  liberarSolicitud()
  await esperar(pagina).toHaveURL(/\/home$/)
  esperar(solicitudes).toHaveLength(1)
})

prueba('el login permite reintentar tras un fallo de red y una respuesta no JSON', async ({ page: pagina }) => {
  let intentos = 0
  await pagina.route(urlLogin, (ruta) => {
    intentos += 1
    if (intentos === 1) return ruta.abort('failed')
    if (intentos === 2) return ruta.fulfill({ status: 502, contentType: 'text/html', body: '<h1>Bad Gateway</h1>' })
    return ruta.fulfill({ status: 200, json: { access_token: crearTokenPrueba(), token_type: 'bearer' } })
  })
  await pagina.goto('/login')
  await pagina.getByLabel('Correo electrónico').fill('martina@ejemplo.com')
  await pagina.getByLabel('Contraseña', { exact: true }).fill('Clave123')
  await pagina.getByRole('button', { name: 'Ingresar' }).click()
  await esperar(pagina.getByRole('alert')).toContainText('No pudimos conectar con el servidor.')
  await pagina.getByRole('button', { name: 'Ingresar' }).click()
  await esperar(pagina.getByRole('alert')).toContainText('El servidor devolvió una respuesta inesperada.')
  await pagina.getByRole('button', { name: 'Ingresar' }).click()
  await esperar(pagina).toHaveURL(/\/home$/)
  esperar(intentos).toBe(3)
})

prueba('el servicio conserva los contratos de registro y login', async ({ page: pagina }) => {
  const errorRegistro = { code: 'EMAIL_YA_REGISTRADO', message: 'El email ya está registrado.', detail: 'Detalle del servidor.' }
  const respuestaLogin = { access_token: 'token-devuelto-por-el-servidor', token_type: 'bearer' }
  const errorLogin = { code: 'CREDENCIALES_INVALIDAS', message: 'Credenciales inválidas', detail: 'Detalle del servidor.' }
  await pagina.route(urlRegistro, (ruta) => ruta.fulfill({ status: 409, json: errorRegistro }))
  await pagina.route(urlLogin, (ruta) => ruta.fulfill(ruta.request().postDataJSON().email === 'jugador@futbolquiz.com'
    ? { status: 200, json: respuestaLogin }
    : { status: 401, json: errorLogin }))
  await pagina.goto('/login')
  const resultado = await pagina.evaluate(async () => {
    const { registrar, iniciarSesion } = await import('/src/servicios/servicioAuth.js')
    const capturarError = (promesa) => promesa.catch((error) => error)
    return {
      exito: await iniciarSesion('jugador@futbolquiz.com', 'FutbolQuiz123'),
      errorInicioSesion: await capturarError(iniciarSesion('otro@ejemplo.com', 'Clave123')),
      errorRegistro: await capturarError(registrar('Martina', 'martina@ejemplo.com', 'Clave123')),
    }
  })
  esperar(resultado.exito).toEqual(respuestaLogin)
  esperar(resultado.errorInicioSesion).toEqual(errorLogin)
  esperar(resultado.errorRegistro).toEqual(errorRegistro)
})

prueba('navega entre formularios y permite volver con el navegador', async ({ page: pagina }) => {
  await pagina.goto('/login')
  await pagina.getByRole('link', { name: 'Registrarme', exact: true }).click()
  await esperar(pagina).toHaveURL(/\/registro$/)
  await esperar(pagina.getByRole('heading', { name: 'Crear cuenta' })).toBeVisible()
  await pagina.goBack()
  await esperar(pagina).toHaveURL(/\/login$/)
  await pagina.getByRole('link', { name: 'Registrarme', exact: true }).click()
  await pagina.getByRole('link', { name: 'Ingresar', exact: true }).click()
  await esperar(pagina).toHaveURL(/\/login$/)
  await pagina.setViewportSize({ width: 390, height: 844 })
  await pagina.getByRole('link', { name: 'Crear cuenta', exact: true }).click()
  await esperar(pagina.getByRole('heading', { name: 'Creá tu perfil' })).toBeVisible()
  await pagina.getByRole('link', { name: 'Volver a iniciar sesión', exact: true }).click()
  await esperar(pagina).toHaveURL(/\/login$/)
})

prueba('los formularios se adaptan a escritorio y celular sin desbordar', async ({ page: pagina }, informacion) => {
  const erroresNavegador = []
  pagina.on('pageerror', (error) => erroresNavegador.push(error.message))
  for (const ancho of [1440, 390, 320]) {
    await pagina.setViewportSize({ width: ancho, height: ancho === 1440 ? 1024 : 844 })
    for (const ruta of ['/registro', '/login']) {
      await pagina.goto(ruta)
      const dimensiones = await pagina.evaluate(() => ({ contenido: document.documentElement.scrollWidth, ventana: window.innerWidth }))
      esperar(dimensiones.contenido).toBeLessThanOrEqual(dimensiones.ventana)
      await esperar(pagina.getByRole('button', { name: ruta === '/registro' ? 'Crear mi cuenta' : 'Ingresar' })).toBeVisible()
      if (ancho !== 320) {
        await pagina.screenshot({ path: informacion.outputPath(`${ruta.slice(1)}-${ancho}.png`), fullPage: true })
      }
    }
  }
  esperar(erroresNavegador).toEqual([])
})
