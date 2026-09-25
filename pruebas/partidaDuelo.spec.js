import { test as prueba, expect as esperar } from '@playwright/test'
import { prepararSesion } from './datosSesion.js'

prueba('no crea un rival falso cuando el backend devuelve un duelo pendiente', async ({ page: pagina }) => {
  await prepararSesion(pagina)

  await pagina.route('**/api/duelos/online', async (ruta) => {
    await ruta.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 42,
        estado: 'PENDIENTE_RIVAL',
        modalidad: 'online',
        categoria_id: null,
        preguntas: [
          {
            id: 1,
            orden: 1,
            enunciado: 'Pregunta de espera',
            opcion_a: 'A',
            opcion_b: 'B',
            opcion_c: 'C',
            opcion_d: 'D',
          },
        ],
      }),
    })
  })

  await pagina.goto('/duelo/esperando')

  await esperar(pagina.getByText('Buscando rival...')).toBeVisible()
  await esperar(pagina.getByText('Esperando rival...')).toBeVisible()
})

prueba('no crea un rival falso cuando el backend no devuelve un jugador2 real', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.route('**/api/duelos/online', async (ruta) => {
    await ruta.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 99,
        estado: 'PENDIENTE_RIVAL',
        modalidad: 'online',
        categoria_id: null,
        jugador1_id: 7,
        jugador2_id: null,
        puntaje_jugador1: 0,
        puntaje_jugador2: 0,
        preguntas: [
          {
            id: 1,
            orden: 1,
            enunciado: 'Pregunta real',
            opcion_a: 'A',
            opcion_b: 'B',
            opcion_c: 'C',
            opcion_d: 'D',
          },
        ],
      }),
    })
  })

  await pagina.goto('/duelo/esperando')

  await esperar(pagina.getByText('Esperando rival...', { exact: false })).toBeVisible()
  await esperar(pagina.getByText('Rival online', { exact: false })).toHaveCount(0)
})

prueba('muestra el perfil real del usuario y del rival en la espera de duelo', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.route('**/api/usuarios/me', (ruta) => ruta.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ id: 7, nombre: 'Tomás Agüero', email: 'tomas@futbolquiz.com', rol: 'JUGADOR', puntaje_total: 2400 }),
  }))

  await pagina.route('**/api/duelos/online', async (ruta) => {
    await ruta.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 99,
        estado: 'EN_CURSO',
        modalidad: 'online',
        categoria_id: null,
        jugador1_id: 7,
        jugador2_id: 12,
        puntaje_jugador1: 0,
        puntaje_jugador2: 0,
        preguntas: [
          {
            id: 1,
            orden: 1,
            enunciado: 'Pregunta real',
            opcion_a: 'A',
            opcion_b: 'B',
            opcion_c: 'C',
            opcion_d: 'D',
          },
        ],
      }),
    })
  })

  await pagina.goto('/duelo/esperando')

  await esperar(pagina.getByText('Tomás Agüero', { exact: false })).toBeVisible()
  await esperar(pagina.getByText('Esperando rival...', { exact: false })).not.toBeVisible()
})

prueba('empareja y conecta al rival cuando se une mientras el usuario espera en cola', async ({ page: pagina }) => {
  await prepararSesion(pagina)

  await pagina.route('**/api/duelos/online', async (ruta) => {
    await ruta.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 55,
        estado: 'PENDIENTE_RIVAL',
        modalidad: 'online',
        categoria_id: null,
        preguntas: [
          {
            id: 10,
            orden: 1,
            enunciado: '¿Pregunta de duelo?',
            opcion_a: 'A',
            opcion_b: 'B',
            opcion_c: 'C',
            opcion_d: 'D',
          },
        ],
      }),
    })
  })

  let intentosEstado = 0
  await pagina.route('**/api/duelos/55', async (ruta) => {
    intentosEstado += 1
    if (intentosEstado === 1) {
      await ruta.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 55,
          estado: 'PENDIENTE_RIVAL',
          modalidad: 'online',
          categoria_id: null,
          jugador1_id: 1,
          jugador2_id: null,
          puntaje_jugador1: 0,
          puntaje_jugador2: 0,
          numero_ganador: null,
          es_empate: false,
        }),
      })
    } else {
      await ruta.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 55,
          estado: 'EN_CURSO',
          modalidad: 'online',
          categoria_id: null,
          jugador1_id: 1,
          jugador2_id: 2,
          puntaje_jugador1: 0,
          puntaje_jugador2: 0,
          numero_ganador: null,
          es_empate: false,
        }),
      })
    }
  })

  await pagina.goto('/duelo/esperando')

  await esperar(pagina.getByText('Buscando rival...')).toBeVisible()
  await esperar(pagina.getByText('¡Rival encontrado!')).toBeVisible({ timeout: 10000 })
  await pagina.waitForURL(/\/duelo\/partida/, { timeout: 10000 })
})

prueba('renderiza la partida de duelo y avanza hasta el resultado', async ({ page: pagina }) => {
  await prepararSesion(pagina)

  await pagina.goto('/duelo/partida')

  await esperar(pagina.getByRole('heading', { name: 'Lucas Agüero' })).toBeVisible()
  await esperar(pagina.getByText('Rival', { exact: false }).first()).toBeVisible()
  await esperar(pagina.getByText('Pregunta 1', { exact: false })).toBeVisible()

  const botones = pagina.locator('button[data-testid="opcion-duelo"]')
  await esperar(botones.first()).toBeVisible()
  await botones.first().click()

  await esperar(botones.first()).toBeDisabled()

  await pagina.waitForURL(/\/duelo\/resultado/)
})

prueba('mantiene el layout responsive en móvil', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.setViewportSize({ width: 390, height: 844 })
  await pagina.goto('/duelo/partida')

  await esperar(pagina.locator('.partida-duelo__marcadores')).toBeVisible()
  await esperar(pagina.locator('.partida-duelo__tarjeta')).toBeVisible()

  const overflowX = await pagina.evaluate(() => {
    const doc = document.documentElement
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
    }
  })

  esperar(overflowX.scrollWidth).toBeLessThanOrEqual(overflowX.clientWidth + 2)
})
