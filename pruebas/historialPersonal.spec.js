import { test as prueba, expect as esperar } from './fixturesCobertura.js'
import { prepararSesion } from './datosSesion.js'

const historialPrueba = {
  individuales: {
    total: 2,
    partidas: [
      { partida_id: 1, fecha_fin: '2026-09-07T12:00:00Z', categoria_nombre: 'Mundiales', puntaje_final: 850 },
      { partida_id: 3, fecha_fin: '2026-09-04T12:00:00Z', categoria_nombre: 'Clubes', puntaje_final: 680 },
    ],
  },
  duelos: {
    total: 2,
    duelos: [
      { duelo_id: 2, fecha_fin: '2026-09-06T12:00:00Z', categoria_nombre: 'Historia', modalidad: 'ONLINE', resultado: 'VICTORIA', puntaje_propio: 790, puntaje_rival: 600, rival_nombre: 'Rival' },
      { duelo_id: 4, fecha_fin: '2026-09-02T12:00:00Z', categoria_nombre: 'Jugadores', modalidad: 'LOCAL', resultado: 'DERROTA', puntaje_propio: 610, puntaje_rival: 700 },
    ],
  },
  torneos: {
    total: 1,
    torneos: [{ torneo_id: 5, fecha_creacion: '2026-08-30T12:00:00Z', nombre: 'Copa Apertura', estado: 'FINALIZADO', ronda_alcanzada: 2, es_campeon: false }],
  },
}

async function prepararHistorial(pagina, respuesta = historialPrueba) {
  await prepararSesion(pagina)
  const rutasHistorial = [
    ['/api/historial/partidas-individuales', respuesta.individuales],
    ['/api/historial/duelos', respuesta.duelos],
    ['/api/historial/torneos', respuesta.torneos],
  ]
  for (const [rutaApi, contenido] of rutasHistorial) {
    await pagina.route(`**${rutaApi}`, (ruta) => ruta.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(contenido),
    }))
  }
}

prueba('muestra el historial cronológico y diferencia las victorias de las derrotas', async ({ page: pagina }) => {
  await prepararHistorial(pagina)
  await pagina.setViewportSize({ width: 1440, height: 1024 })
  await pagina.goto('/historial')

  await esperar(pagina.getByRole('heading', { name: 'Mi historial' })).toBeVisible()
  await esperar(pagina.getByText('Mundiales')).toBeVisible()
  await esperar(pagina.getByText('07 Sep 2026')).toBeVisible()
  await esperar(pagina.getByText('Historia', { exact: true })).toBeVisible()
  await esperar(pagina.getByText('Victoria')).toBeVisible()
  await esperar(pagina.getByText('Derrota')).toBeVisible()
  await esperar(pagina.getByText('850 pts')).toBeVisible()
  await esperar(pagina.getByRole('link', { name: 'Perfil', exact: true })).toHaveClass(/marco-torneo__enlace--activo/)
  await pagina.screenshot({ path: 'test-results/historial-escritorio.png', fullPage: true })
})

prueba('abre el detalle de una partida y permite cambiar al historial de torneos', async ({ page: pagina }) => {
  await prepararHistorial(pagina)
  await pagina.goto('/historial')

  await pagina.getByRole('button', { name: 'Ver detalle' }).first().click()
  await esperar(pagina.getByRole('dialog')).toContainText('Mundiales')
  await pagina.mouse.click(5, 5)
  await esperar(pagina.getByRole('dialog')).toBeHidden()
  await pagina.getByRole('button', { name: 'Ver detalle' }).first().click()
  await pagina.getByRole('dialog').getByRole('button', { name: 'Cerrar detalle' }).click()
  await pagina.getByRole('tab', { name: 'Torneos' }).click()
  await esperar(pagina.getByRole('region', { name: 'Torneos anteriores' }).getByText('Copa Apertura')).toBeVisible()
})

prueba('muestra un estado vacío cuando el usuario todavía no tiene historial', async ({ page: pagina }) => {
  await prepararHistorial(pagina, {
    individuales: { partidas: [], total: 0 },
    duelos: { duelos: [], total: 0 },
    torneos: { torneos: [], total: 0 },
  })
  await pagina.goto('/historial')

  await esperar(pagina.getByText('Todavía no jugaste partidas')).toBeVisible()
  await esperar(pagina.getByRole('link', { name: 'Ir a jugar' })).toHaveAttribute('href', '/jugar')
})

prueba('reorganiza las partidas en móvil sin desbordamiento horizontal', async ({ page: pagina }) => {
  await prepararHistorial(pagina)
  await pagina.setViewportSize({ width: 390, height: 844 })
  await pagina.goto('/historial')

  await esperar(pagina.getByText('Mundiales')).toBeVisible()
  esperar(await pagina.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await pagina.screenshot({ path: 'test-results/historial-movil.png', fullPage: true })
})
