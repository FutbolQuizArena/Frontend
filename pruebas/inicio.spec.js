import { test as prueba, expect as esperar } from './fixturesCobertura.js'
import { prepararSesion } from './datosSesion.js'

const categoriasPartida = [
  { id: 1, nombre: 'Historia' }, { id: 2, nombre: 'Mundiales' }, { id: 3, nombre: 'Clubes' },
]

prueba.beforeEach(async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.route('**/api/partidas/categorias', (ruta) => ruta.fulfill({ json: categoriasPartida }))
})

prueba('la Home consulta el usuario y permite navegar', async ({ page: pagina }) => {
  const solicitudes = []
  await pagina.route('**/api/**', (ruta) => {
    solicitudes.push(ruta.request().url())
    if (ruta.request().url().endsWith('/api/partidas/categorias')) {
      return ruta.fulfill({ json: categoriasPartida })
    }
    if (ruta.request().url().endsWith('/api/usuarios/me')) {
      return ruta.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 1, nombre: 'Lucas', email: 'lucas@futbolquiz.com', rol: 'JUGADOR', puntaje_total: 2450 }) })
    }
    if (ruta.request().url().endsWith('/api/torneos?filtro=mios')) {
      return ruta.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    }
    if (ruta.request().url().endsWith('/api/torneos?filtro=disponibles')) {
      return ruta.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
        { id: 12, nombre: 'Copa real', cantidad_participantes: 8, cantidad_participantes_actual: 3, tiene_contrasena: false, estado: 'ESPERANDO_JUGADORES', fecha_creacion: '2026-09-25T12:00:00Z', creador_id: 2, codigo_acceso: null },
      ]) })
    }
    if (new URL(ruta.request().url()).pathname === '/api/ranking') {
      return ruta.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        jugadores: [], total_jugadores: 0, pagina: 1, tamano_pagina: 100, mi_posicion: null,
      }) })
    }
    return ruta.abort()
  })
  await pagina.setViewportSize({ width: 1440, height: 1024 })
  await pagina.goto('/home')
  await esperar(pagina.getByRole('heading', { level: 1 })).toHaveText('Buenas, Lucas 👋¿Listo para jugar?')
  await esperar(pagina.getByRole('link', { name: 'Ir al panel de Admin' })).toHaveCount(0)
  await esperar(pagina.getByRole('heading', { name: 'Copa real' })).toBeVisible()
  await esperar(pagina.getByText('Mati10')).toHaveCount(0)
  await pagina.getByRole('button', { name: 'Empezar partida' }).click()
  await esperar(pagina).toHaveURL(/\/partida\/ruleta$/)
  await esperar(pagina.getByRole('heading', { name: 'Ruleta de categorías' })).toBeVisible()
  await esperar(pagina.getByRole('button', { name: 'Girar Ruleta' })).toBeEnabled()
  await pagina.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Inicio' }).click()

  await pagina.getByRole('link', { name: 'Ir a Duelo' }).click()
  await esperar(pagina).toHaveURL(/\/duelo\/esperando$/)
  await esperar(pagina.getByRole('heading', { name: 'Error al buscar rival' })).toBeVisible()
  // Sin una búsqueda creada en el servidor, la pantalla permite volver al menú.
  await esperar(pagina.getByRole('button', { name: 'Volver al menú' }).last()).toBeVisible()
  await pagina.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Inicio' }).click()
  await esperar(pagina.getByText('Consultá las posiciones y tu lugar en el ranking.')).toBeVisible()
  for (const [nombre, destino, titulo] of [
    ['Ver torneo', 'torneos', 'Torneos'],
    ['Ver ranking', 'ranking', 'Ranking general'],
    ['Ver mi perfil', 'perfil', 'Mi perfil'],
  ]) {
    await pagina.getByRole('link', { name: nombre, exact: true }).click()
    await esperar(pagina).toHaveURL(new RegExp(`/${destino}$`))
    await pagina.reload()
    await esperar(pagina.getByRole('heading', { name: titulo, exact: true })).toBeVisible()
    if (destino === 'perfil') {
      await pagina.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Inicio' }).click()
    } else if (destino === 'torneos') {
      await pagina.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Inicio' }).click()
    } else {
      await pagina.getByRole('link', { name: 'Volver al inicio' }).click()
    }
  }
  esperar(solicitudes.length).toBeGreaterThan(0)
  for (const ruta of ['/api/torneos?filtro=disponibles', '/api/torneos?filtro=mios', '/api/usuarios/me']) {
    esperar(solicitudes).toContain(`https://api.futbolquiz.test${ruta}`)
  }
  await pagina.screenshot({ path: 'test-results/inicio-escritorio.png', fullPage: true })
})

prueba('la Home se adapta al celular y mantiene accesibles los enlaces', async ({ page: pagina }) => {
  await pagina.route('**/api/ranking?*', (ruta) => ruta.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ jugadores: [], total_jugadores: 0, pagina: 1, tamano_pagina: 100, mi_posicion: { posicion: 4 } }),
  }))
  await pagina.route('**/api/historial/partidas-individuales', (ruta) => ruta.fulfill({ json: { partidas: [], total: 3 } }))
  await pagina.route('**/api/historial/duelos', (ruta) => ruta.fulfill({ json: { duelos: [], total: 0 } }))
  await pagina.route('**/api/historial/torneos', (ruta) => ruta.fulfill({ json: { torneos: [], total: 0 } }))
  for (const ancho of [320, 390, 768, 1024, 1440]) {
    await pagina.setViewportSize({ width: ancho, height: 844 })
    await pagina.goto('/home')
    await esperar(pagina.getByRole('navigation', { name: 'Navegación principal' })).toBeVisible()
    esperar(await pagina.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  }
  await pagina.setViewportSize({ width: 390, height: 844 })
  await esperar(pagina.getByRole('heading', { name: '¿Listo para jugar?' })).toBeVisible()
  await esperar(pagina.locator('.inicio__metricas dt')).toHaveText(['PUNTOS', 'RANKING', 'PARTIDAS'])
  await esperar(pagina.locator('.inicio__metricas dd')).toHaveText(['2.450', '#4', '3'])
  await pagina.getByRole('button', { name: 'Jugar ahora' }).click()
  await esperar(pagina).toHaveURL(/\/partida\/ruleta$/)
  await esperar(pagina.getByRole('button', { name: 'Girar Ruleta' })).toBeEnabled()
  await pagina.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Inicio' }).click()
  await pagina.getByRole('navigation').getByRole('link', { name: 'Ranking' }).click()
  await esperar(pagina).toHaveURL(/\/ranking$/)
  await esperar(pagina.getByRole('heading', { name: 'Ranking general' })).toBeVisible()
  await pagina.goto('/home')
  await pagina.screenshot({ path: 'test-results/inicio-movil.png', fullPage: true })
})

prueba('los enlaces principales y cerrar sesión siguen funcionando', async ({ page: pagina }) => {
  await pagina.goto('/home')
  const navegacion = pagina.getByRole('navigation', { name: 'Navegación principal' })
  await navegacion.getByRole('link', { name: 'Jugar' }).click()
  await esperar(pagina).toHaveURL(/\/jugar$/)
  await esperar(pagina.getByRole('heading', { name: 'Selecciona un Modo de Juego' })).toBeVisible()
  await navegacion.getByRole('link', { name: 'Torneos' }).click()
  await esperar(pagina).toHaveURL(/\/torneos$/)
  await esperar(pagina.getByRole('heading', { name: 'Torneos', exact: true })).toBeVisible()
  await navegacion.getByRole('link', { name: 'Inicio' }).click()
  await pagina.getByRole('button', { name: 'Cerrar sesión' }).click()
  await esperar(pagina).toHaveURL(/\/login$/)
  await esperar(pagina.getByRole('button', { name: 'Ingresar' })).toBeVisible()
})

prueba('el acceso al panel aparece para un administrador', async ({ page: pagina }) => {
  await pagina.route('**/api/usuarios/me', (ruta) => ruta.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 1, nombre: 'Admin', email: 'admin@futbolquiz.com', rol: 'ADMINISTRADOR', puntaje_total: 0 }) }))
  await pagina.goto('/home')
  await esperar(pagina.getByRole('link', { name: 'Ir al panel de Admin' })).toHaveAttribute('href', '/admin')
  await pagina.getByRole('link', { name: 'Ir al panel de Admin' }).click()
  await esperar(pagina).toHaveURL(/\/admin$/)
  await esperar(pagina.getByRole('heading', { name: 'Administración' })).toBeVisible()
})
