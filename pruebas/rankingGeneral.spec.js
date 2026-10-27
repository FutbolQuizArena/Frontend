import { test as prueba, expect as esperar } from './fixturesCobertura.js'
import { prepararSesion } from './datosSesion.js'

function crearJugador(posicion, usuarioId, nombre, puntajeTotal) {
  return { posicion, usuario_id: usuarioId, nombre, puntaje_total: puntajeTotal }
}

async function interceptarRanking(pagina, manejarRespuesta) {
  await prepararSesion(pagina)
  await pagina.route('**/api/ranking?*', (ruta) => {
    const url = new URL(ruta.request().url())
    esperar(ruta.request().headers().authorization).toMatch(/^Bearer /)
    esperar(url.searchParams.get('tamano_pagina')).toBe('100')
    return ruta.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(manejarRespuesta(Number(url.searchParams.get('pagina')))),
    })
  })
}

prueba('conecta el ranking con la respuesta real del backend y resalta mi_posicion', async ({ page: pagina }) => {
  const jugadores = [
    crearJugador(1, 2, 'Matías Messi', 8920),
    crearJugador(2, 3, 'Ana Torres', 8460),
    crearJugador(3, 4, 'Lucas Díaz', 7980),
    crearJugador(4, 1, 'Sofía García', 7540),
  ]
  await interceptarRanking(pagina, () => ({
    jugadores,
    total_jugadores: jugadores.length,
    pagina: 1,
    tamano_pagina: 100,
    mi_posicion: jugadores[3],
  }))
  await pagina.setViewportSize({ width: 1440, height: 1024 })
  await pagina.goto('/ranking')

  await esperar(pagina.getByRole('heading', { name: 'Ranking general' })).toBeVisible()
  await esperar(pagina.getByRole('article', { name: /Puesto 1: Matías Messi/ })).toBeVisible()
  await esperar(pagina.getByRole('article', { name: /Puesto 2: Ana Torres/ })).toBeVisible()
  await esperar(pagina.getByRole('article', { name: /Puesto 3: Lucas Díaz/ })).toBeVisible()
  await esperar(pagina.getByRole('region', { name: 'Tu posición' }).getByText('Sofía García')).toBeVisible()
  await esperar(pagina.getByRole('region', { name: 'Clasificación' }).getByText('Todavía no hay más jugadores para mostrar.')).toBeVisible()
})

prueba('solicita páginas adicionales cuando el ranking supera cien jugadores', async ({ page: pagina }) => {
  const jugadores = [
    crearJugador(1, 2, 'Matías Messi', 8920),
    crearJugador(2, 3, 'Ana Torres', 8460),
    crearJugador(3, 4, 'Lucas Díaz', 7980),
    crearJugador(4, 5, 'Santiago', 7200),
  ]
  await interceptarRanking(pagina, (numeroPagina) => ({
    jugadores: numeroPagina === 1 ? jugadores : [crearJugador(101, 1, 'Sofía García', 1200)],
    total_jugadores: 101,
    pagina: numeroPagina,
    tamano_pagina: 100,
    mi_posicion: crearJugador(101, 1, 'Sofía García', 1200),
  }))
  await pagina.goto('/ranking')

  await esperar(pagina.getByRole('region', { name: 'Tu posición' }).getByText('#101')).toBeVisible()
  await esperar(pagina.getByRole('region', { name: 'Clasificación' }).getByText('Santiago')).toBeVisible()
})
