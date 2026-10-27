import { test as prueba, expect as esperar } from './fixturesCobertura.js'
import { prepararSesion } from './datosSesion.js'

const historialPrueba = {
  estadisticas_generales: { partidas_jugadas: 5, porcentaje_victorias: 40, puntaje_acumulado: 3850 },
  partidas_historial: [
    { id: 1, fecha_fin: '2026-09-07T12:00:00Z', categoria_nombre: 'Mundiales', tipo_partida: 'Individual', respuestas_correctas: 8, total_respuestas: 10, puntaje_final: 850 },
    { id: 2, fecha_fin: '2026-09-06T12:00:00Z', categoria_nombre: 'Historia', tipo_partida: 'Duelo', resultado: 'VICTORIA', puntaje_final: 790, nombre_oponente: 'Rival' },
    { id: 3, fecha_fin: '2026-09-04T12:00:00Z', categoria_nombre: 'Clubes', tipo_partida: 'Individual', respuestas_correctas: 7, total_respuestas: 10, puntaje_final: 680 },
    { id: 4, fecha_fin: '2026-09-02T12:00:00Z', categoria_nombre: 'Jugadores', tipo_partida: 'Duelo', resultado: 'DERROTA', puntaje_final: 610 },
  ],
  torneos_historial: [{ id: 5, fecha_creacion: '2026-08-30T12:00:00Z', torneo_nombre: 'Copa Apertura', tipo: 'Torneo', resultado: 'Completada', puntaje: 920 }],
}

async function prepararHistorial(pagina, respuesta = historialPrueba) {
  await prepararSesion(pagina)
  await pagina.route('**/api/historial', (ruta) => ruta.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(respuesta),
  }))
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
  await prepararHistorial(pagina, { estadisticas_generales: {}, partidas_historial: [], torneos_historial: [] })
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
