import { test as prueba, expect as esperar } from '@playwright/test'
import { crearTokenPrueba, prepararSesion } from './datosSesion.js'

const rutasPrivadas = ['/home', '/perfil', '/partida-individual', '/duelo', '/torneos', '/torneos/crear', '/torneos/unirse', '/torneos/1', '/torneos/1/sala', '/torneos/1/cuadro', '/ranking', '/admin']

prueba.beforeEach(async ({ context: contexto }) => {
  await contexto.route('**/api/**', (ruta) => ruta.fulfill({
    status: 503, json: { message: 'Solicitud sin respuesta de prueba configurada.' },
  }))
})

async function completarLogin(pagina, token, mantenerSesion = false) {
  await pagina.route('**/api/auth/login', (ruta) => ruta.fulfill({
    status: 200, json: { access_token: token, token_type: 'bearer' },
  }))
  await pagina.goto('/login')
  await pagina.getByLabel('Correo electrónico').fill('jugador@ejemplo.com')
  await pagina.getByLabel('Contraseña', { exact: true }).fill('Clave123')
  if (mantenerSesion) await pagina.getByLabel('Mantener sesión iniciada').check()
  await pagina.getByRole('button', { name: 'Ingresar' }).click()
}

for (const ruta of rutasPrivadas) {
  prueba(`sin sesión, ${ruta} redirige a login`, async ({ page: pagina }) => {
    await pagina.goto(ruta)
    await esperar(pagina).toHaveURL(/\/login$/)
    await esperar(pagina.getByRole('button', { name: 'Ingresar' })).toBeVisible()
  })
}

for (const ruta of ['/', '/login', '/registro']) {
  prueba(`con sesión, ${ruta} redirige a Home`, async ({ page: pagina }) => {
    await prepararSesion(pagina)
    await pagina.goto(ruta)
    await esperar(pagina).toHaveURL(/\/home$/)
  })
}

prueba('login guarda el JWT, redirige y conserva la sesión al recargar', async ({ page: pagina, context: contexto }) => {
  const token = crearTokenPrueba()
  await completarLogin(pagina, token)
  await esperar(pagina).toHaveURL(/\/home$/)
  esperar(await pagina.evaluate(() => sessionStorage.getItem('futbolquizToken'))).toBe(token)
  esperar(await pagina.evaluate(() => localStorage.getItem('futbolquizToken'))).toBeNull()
  await pagina.reload()
  await esperar(pagina.getByRole('link', { name: 'Ver mi perfil' })).toBeVisible()
  const otraPagina = await contexto.newPage()
  await otraPagina.goto('/home')
  await esperar(otraPagina).toHaveURL(/\/login$/)
})

prueba('mantener sesión guarda el JWT persistente y permite abrir otra pestaña', async ({ page: pagina, context: contexto }) => {
  const token = crearTokenPrueba()
  await completarLogin(pagina, token, true)
  await esperar(pagina).toHaveURL(/\/home$/)
  esperar(await pagina.evaluate(() => localStorage.getItem('futbolquizToken'))).toBe(token)
  esperar(await pagina.evaluate(() => sessionStorage.getItem('futbolquizToken'))).toBeNull()
  const otraPagina = await contexto.newPage()
  await otraPagina.goto('/perfil')
  await esperar(otraPagina.getByRole('heading', { name: 'Editar perfil' })).toBeVisible()
  await pagina.getByRole('button', { name: 'Cerrar sesión' }).click()
  await esperar(otraPagina).toHaveURL(/\/login$/)
})

for (const ruta of ['/home', '/perfil']) {
  prueba(`cerrar sesión desde ${ruta} borra ambos almacenamientos y bloquea volver`, async ({ page: pagina }) => {
    await completarLogin(pagina, crearTokenPrueba())
    await esperar(pagina).toHaveURL(/\/home$/)
    await pagina.getByRole('button', { name: 'Empezar partida' }).click()
    await esperar(pagina).toHaveURL(/\/partida-individual$/)
    await pagina.goto(ruta)
    await pagina.evaluate(() => localStorage.setItem('futbolquizToken', sessionStorage.getItem('futbolquizToken')))
    await pagina.getByRole('button', { name: 'Cerrar sesión' }).click()
    await esperar(pagina).toHaveURL(/\/login$/)
    esperar(await pagina.evaluate(() => [localStorage.getItem('futbolquizToken'), sessionStorage.getItem('futbolquizToken')])).toEqual([null, null])
    await pagina.goBack()
    await esperar(pagina).toHaveURL(/\/login$/)
    await pagina.goto('/home')
    await esperar(pagina).toHaveURL(/\/login$/)
  })
}

for (const [descripcion, token] of [
  ['vencido', crearTokenPrueba({ exp: 1 })],
  ['malformado', 'no-es-un-jwt'],
  ['con vencimiento inválido', crearTokenPrueba({ exp: 'mañana' })],
]) {
  prueba(`un token ${descripcion} almacenado se descarta`, async ({ page: pagina }) => {
    await prepararSesion(pagina, token)
    await pagina.goto('/home')
    await esperar(pagina).toHaveURL(/\/login$/)
    esperar(await pagina.evaluate(() => sessionStorage.getItem('futbolquizToken'))).toBeNull()
  })
}

prueba('la sesión vence mientras el usuario está en Home', async ({ page: pagina }) => {
  await pagina.clock.install()
  await prepararSesion(pagina, crearTokenPrueba({ exp: Math.floor(Date.now() / 1000) + 60 }))
  await pagina.goto('/home')
  await esperar(pagina.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible()
  await pagina.clock.fastForward(61000)
  await esperar(pagina).toHaveURL(/\/login$/)
  esperar(await pagina.evaluate(() => sessionStorage.getItem('futbolquizToken'))).toBeNull()
})

prueba('una respuesta de login sin JWT válido no crea sesión', async ({ page: pagina }) => {
  await completarLogin(pagina, 'token-invalido')
  await esperar(pagina.getByRole('alert')).toHaveText('El servidor devolvió una sesión inválida. Intentá iniciar sesión de nuevo.')
  await esperar(pagina).toHaveURL(/\/login$/)
  esperar(await pagina.evaluate(() => sessionStorage.getItem('futbolquizToken'))).toBeNull()
})
