import { test as prueba, expect as esperar } from '@playwright/test'
import { prepararSesion } from './datosSesion.js'

const listados = {
  mios: [
    { id: 1, nombre: 'Copa Leyendas', cantidad_participantes: 8, cantidad_participantes_actual: 8, tiene_contrasena: false, estado: 'EN_CURSO', fecha_creacion: '2026-09-20T21:00:00Z', creador_id: 1, codigo_acceso: 'LEY001' },
    { id: 2, nombre: 'Liga Relámpago', cantidad_participantes: 8, cantidad_participantes_actual: 6, tiene_contrasena: true, estado: 'ESPERANDO_JUGADORES', fecha_creacion: '2026-09-22T19:30:00Z', creador_id: 1, codigo_acceso: 'LIGA24' },
  ],
  disponibles: [
    { id: 5, nombre: 'Liga de Campeones', cantidad_participantes: 8, cantidad_participantes_actual: 6, tiene_contrasena: false, estado: 'ESPERANDO_JUGADORES', fecha_creacion: '2026-09-23T19:30:00Z', creador_id: 2, codigo_acceso: null },
    { id: 7, nombre: 'Copa Nacional', cantidad_participantes: 4, cantidad_participantes_actual: 3, tiene_contrasena: true, estado: 'ESPERANDO_JUGADORES', fecha_creacion: '2026-09-23T18:00:00Z', creador_id: 3, codigo_acceso: null },
  ],
  finalizados: [
    { id: 9, nombre: 'Copa Apertura', cantidad_participantes: 8, cantidad_participantes_actual: 8, tiene_contrasena: false, estado: 'FINALIZADO', fecha_creacion: '2026-08-28T20:00:00Z', creador_id: 2, codigo_acceso: null },
    { id: 10, nombre: 'Leyendas de América', cantidad_participantes: 8, cantidad_participantes_actual: 8, tiene_contrasena: false, estado: 'FINALIZADO', fecha_creacion: '2026-08-20T20:00:00Z', creador_id: 4, codigo_acceso: null },
  ],
}

async function interceptarListados(pagina) {
  await pagina.route('**/api/torneos?*', (ruta) => {
    const filtro = new URL(ruta.request().url()).searchParams.get('filtro')
    esperar(ruta.request().headers().authorization).toMatch(/^Bearer /)
    return ruta.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(listados[filtro] || []) })
  })
}

prueba('sin sesión, el listado de torneos redirige a login', async ({ page: pagina }) => {
  await pagina.goto('/torneos')
  await esperar(pagina).toHaveURL(/\/login$/)
})

prueba('muestra los torneos propios y permite abrir la creación', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await interceptarListados(pagina)
  await pagina.setViewportSize({ width: 1440, height: 1024 })
  await pagina.goto('/torneos')

  await esperar(pagina.getByRole('heading', { name: 'Torneos', level: 1 })).toBeVisible()
  await esperar(pagina.getByRole('region', { name: 'Mis torneos' }).getByText('Copa Leyendas')).toBeVisible()
  await pagina.screenshot({ path: 'test-results/torneos-escritorio.png', fullPage: true })
  await pagina.getByRole('link', { name: 'Crear torneo', exact: true }).click()
  await esperar(pagina).toHaveURL(/\/torneos\/crear$/)
})

prueba('cambia entre disponibles y finalizados usando el endpoint real', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await interceptarListados(pagina)
  await pagina.setViewportSize({ width: 1440, height: 1024 })
  await pagina.goto('/torneos')

  await pagina.getByRole('button', { name: 'Disponibles' }).click()
  await esperar(pagina.getByRole('heading', { name: 'Torneos disponibles' })).toBeVisible()
  await esperar(pagina.getByRole('region', { name: 'Disponibles' }).getByText('Liga de Campeones')).toBeVisible()
  await esperar(pagina.getByRole('link', { name: 'Ingresar código' })).toHaveAttribute('href', '/torneos/unirse')
  await pagina.screenshot({ path: 'test-results/torneos-disponibles-escritorio.png', fullPage: true })

  await pagina.getByRole('button', { name: 'Finalizados' }).click()
  await esperar(pagina.getByRole('heading', { name: 'Torneos finalizados' })).toBeVisible()
  await esperar(pagina.getByRole('region', { name: 'Finalizados' }).getByText('Leyendas de América')).toBeVisible()
  await esperar(pagina.getByText('2 torneos finalizados')).toBeHidden()
  esperar(await pagina.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await pagina.screenshot({ path: 'test-results/torneos-finalizados-escritorio.png', fullPage: true })
})

prueba('la vista móvil usa tarjetas, acciones rápidas y navegación inferior', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await interceptarListados(pagina)
  await pagina.setViewportSize({ width: 390, height: 844 })
  await pagina.goto('/torneos')

  await esperar(pagina.getByRole('banner').getByText('Competí y llegá a la final')).toBeVisible()
  await esperar(pagina.getByRole('heading', { name: 'ACTIVOS' })).toBeVisible()
  await esperar(pagina.getByRole('region', { name: 'Acciones rápidas' })).toBeVisible()
  await esperar(pagina.getByText('Consultá tus resultados en Finalizados')).toBeVisible()
  await esperar(pagina.getByRole('navigation', { name: 'Navegación principal' })).toBeVisible()
  esperar(await pagina.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await pagina.screenshot({ path: 'test-results/torneos-movil.png', fullPage: true })

  await pagina.getByRole('button', { name: 'Disponibles' }).click()
  await esperar(pagina.getByRole('region', { name: 'Disponibles' }).getByText('Liga de Campeones')).toBeVisible()
  await esperar(pagina.getByRole('button', { name: 'Hoy' })).toHaveCount(0)
  await pagina.getByRole('button', { name: '4–16' }).click()
  await esperar(pagina.getByRole('region', { name: 'Disponibles' }).getByText('Liga de Campeones')).toBeVisible()
  await pagina.getByPlaceholder('Buscar por nombre o código').fill('Copa Nacional')
  await esperar(pagina.getByText('Copa Nacional')).toBeVisible()
  await esperar(pagina.getByText('Liga de Campeones')).toBeHidden()
  await pagina.getByPlaceholder('Buscar por nombre o código').clear()
  await pagina.screenshot({ path: 'test-results/torneos-disponibles-movil.png', fullPage: true })

  await pagina.getByRole('button', { name: 'Finalizados' }).click()
  await esperar(pagina.getByRole('region', { name: 'Finalizados' }).getByText('Leyendas de América')).toBeVisible()
  await pagina.screenshot({ path: 'test-results/torneos-finalizados-movil.png', fullPage: true })
})

prueba('cada torneo propio conserva su acción y todos aparecen también en móvil', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  const torneosPropios = [...listados.mios, {
    id: 3, nombre: 'Copa del Barrio', cantidad_participantes: 4, cantidad_participantes_actual: 1,
    tiene_contrasena: false, estado: 'ESPERANDO_JUGADORES', fecha_creacion: '2026-09-24T12:00:00Z',
    creador_id: 1, codigo_acceso: 'BARRIO',
  }]
  await pagina.route('**/api/torneos?filtro=mios', (ruta) => ruta.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify(torneosPropios),
  }))
  await pagina.setViewportSize({ width: 1440, height: 900 })
  await pagina.goto('/torneos')

  const listado = pagina.getByRole('region', { name: 'Mis torneos' })
  await esperar(listado.getByRole('link', { name: 'Ver cuadro' })).toHaveCount(0)
  await esperar(listado.getByRole('link', { name: 'Ir a la sala' })).toHaveCount(3)
  await esperar(listado.getByRole('link', { name: 'Ir a la sala' }).nth(0)).toHaveAttribute('href', '/torneos/1/sala')
  await esperar(listado.getByRole('link', { name: 'Ir a la sala' }).nth(1)).toHaveAttribute('href', '/torneos/2/sala')
  await esperar(listado.getByRole('link', { name: 'Ir a la sala' }).nth(2)).toHaveAttribute('href', '/torneos/3/sala')

  await pagina.setViewportSize({ width: 390, height: 844 })
  await esperar(listado.getByText('Copa del Barrio')).toBeVisible()
  await esperar(listado.getByRole('link', { name: 'Ver cuadro' })).toHaveCount(0)
  await esperar(listado.getByRole('link', { name: 'Ir a la sala' })).toHaveCount(3)
  esperar(await pagina.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

prueba('el servicio permite salir de un torneo con autorización', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  let solicitudRecibida = false
  await pagina.route('**/api/torneos/27/salir', (ruta) => {
    solicitudRecibida = true
    esperar(ruta.request().method()).toBe('DELETE')
    esperar(ruta.request().headers().authorization).toMatch(/^Bearer /)
    return ruta.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ mensaje: 'Salida exitosa' }) })
  })

  await pagina.goto('/home')
  const respuesta = await pagina.evaluate(async () => {
    const { salirDelTorneo } = await import('/src/servicios/servicioTorneos.js')
    return salirDelTorneo(27)
  })

  esperar(solicitudRecibida).toBe(true)
  esperar(respuesta).toEqual({ mensaje: 'Salida exitosa' })
})
