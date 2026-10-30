import { test as prueba, expect as esperar } from './fixturesCobertura.js'
import { prepararSesion } from './datosSesion.js'

prueba.beforeEach(async ({ page: pagina }) => {
  await prepararSesion(pagina)
})

prueba('muestra las opciones de modo de juego y navega a la ruta correcta', async ({ page: pagina }) => {
  await pagina.setViewportSize({ width: 1440, height: 1024 })
  await pagina.goto('/jugar')

  await esperar(pagina.getByRole('heading', { name: 'Selecciona un Modo de Juego', exact: true })).toBeVisible()
  await esperar(pagina.getByRole('link', { name: /Partida Individual/ })).toBeVisible()
  await esperar(pagina.getByRole('link', { name: /Duelo 1v1/ })).toBeVisible()
  await esperar(pagina.getByRole('link', { name: /Duelo 1v1/ }).nth(0)).toBeVisible()

  await pagina.getByRole('link', { name: /Partida Individual/ }).click()
  await esperar(pagina).toHaveURL(/\/partida\/ruleta$/)

  await pagina.goto('/jugar')
  await pagina.getByRole('link', { name: /Duelo 1v1/ }).click()
  await esperar(pagina).toHaveURL(/\/duelo\/esperando$/)

})

prueba('la pantalla sigue siendo responsive y no desborda en móvil', async ({ page: pagina }) => {
  await pagina.route('**/api/usuarios/me', (ruta) => ruta.fulfill({ json: {
    id: 2, nombre: 'Ana', email: 'ana@futbolquiz.com', rol: 'JUGADOR', puntaje_total: 1250,
  } }))
  await pagina.setViewportSize({ width: 390, height: 844 })
  await pagina.goto('/jugar')

  await esperar(pagina.getByRole('heading', { name: 'Selecciona un Modo de Juego', exact: true })).toBeVisible()
  await esperar(pagina.locator('.inicio__saludo-movil strong')).toHaveText('Hola, Ana')
  await esperar(pagina.getByRole('link', { name: 'Ver mi perfil' })).toHaveText('AP')
  await esperar(pagina.locator('.inicio__acumulado span')).toHaveText('Jugador · 1.250 pts')
  await esperar(pagina.getByRole('link', { name: /Partida Individual/ })).toBeVisible()
  esperar(await pagina.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

prueba('la navegación principal lleva a la pantalla de selección de modo', async ({ page: pagina }) => {
  await pagina.goto('/home')
  await pagina.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Jugar' }).click()
  await esperar(pagina).toHaveURL(/\/jugar$/)
  await esperar(pagina.getByRole('heading', { name: 'Selecciona un Modo de Juego', exact: true })).toBeVisible()
})
