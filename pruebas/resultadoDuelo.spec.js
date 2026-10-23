import { test as prueba, expect as esperar } from './fixturesCobertura.js'
import { prepararSesion } from './datosSesion.js'

prueba.beforeEach(async ({ page: pagina }) => {
  await prepararSesion(pagina)
})

prueba('renderiza el resultado del duelo en estado de victoria', async ({ page: pagina }) => {
  await pagina.evaluate(() => {
    sessionStorage.setItem('resultadoDuelo', JSON.stringify({
      estado: 'FINALIZADA',
      ganador: 'local',
      jugadorLocal: {
        nombre: 'Lucas',
        alias: 'Luki',
        avatar: 'LM',
        puntaje: 1420,
        aciertos: 8,
        totalPreguntas: 10,
        tiempoPromedio: 6.2,
      },
      oponente: {
        nombre: 'Rival',
        alias: 'Oponente',
        avatar: 'RV',
        puntaje: 1190,
        aciertos: 6,
        totalPreguntas: 10,
        tiempoPromedio: 8.4,
      },
      resultadoTexto: '¡VICTORIA!',
    }))
  })

  await pagina.goto('/duelo/resultado')

  await esperar(pagina.getByText('¡VICTORIA!')).toBeVisible()
  await esperar(pagina.getByText('Lucas', { exact: true }).first()).toBeVisible()
  await esperar(pagina.locator('.tarjeta-comparativa-duelo__identidad strong').filter({ hasText: 'Rival' }).first()).toBeVisible()
  await esperar(pagina.getByRole('button', { name: 'Pedir Revancha' })).toBeVisible()
})

prueba('navega correctamente a revancha e inicio desde el resultado', async ({ page: pagina }) => {
  await pagina.evaluate(() => {
    sessionStorage.setItem('resultadoDuelo', JSON.stringify({
      estado: 'FINALIZADA',
      ganador: 'empate',
      jugadorLocal: {
        nombre: 'Lucas',
        alias: 'Luki',
        avatar: 'LM',
        puntaje: 1300,
        aciertos: 7,
        totalPreguntas: 10,
        tiempoPromedio: 7.1,
      },
      oponente: {
        nombre: 'Rival',
        alias: 'Oponente',
        avatar: 'RV',
        puntaje: 1300,
        aciertos: 7,
        totalPreguntas: 10,
        tiempoPromedio: 7.3,
      },
      resultadoTexto: 'EMPATE',
    }))
  })

  await pagina.goto('/duelo/resultado')

  await pagina.getByRole('button', { name: 'Pedir Revancha' }).click()
  await esperar(pagina).toHaveURL(/\/duelo\/esperando/)

  await pagina.goto('/duelo/resultado')
  await pagina.getByRole('button', { name: 'Volver al inicio' }).click()
  await esperar(pagina).toHaveURL(/\/home|\/jugar/)
})

prueba('muestra un estado resiliente cuando faltan datos', async ({ page: pagina }) => {
  await pagina.goto('/duelo/resultado')

  await esperar(pagina.getByRole('heading', { name: 'Sin datos del duelo' })).toBeVisible()
})

prueba('actualiza el resultado cuando el rival termina de jugar', async ({ page: pagina }) => {
  let consultas = 0

  await pagina.route('**/api/duelos/42', (ruta) => {
    consultas += 1
    return ruta.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 42,
        estado: consultas <= 2 ? 'EN_CURSO' : 'FINALIZADA',
        jugador1_id: 1,
        jugador1_nombre: 'Lucas',
        jugador2_id: 2,
        jugador2_nombre: 'Rival',
        puntaje_jugador1: 80,
        puntaje_jugador2: 100,
        numero_ganador: consultas <= 2 ? null : 2,
      }),
    })
  })

  await pagina.goto('/duelo/42/resultado')

  await esperar.poll(() => consultas).toBeGreaterThanOrEqual(1)
  await esperar(pagina.getByText('Esperando al rival...', { exact: true }).first()).toBeVisible()
  await esperar(pagina.getByText('DERROTA', { exact: true })).toBeVisible({ timeout: 7000 })
  esperar(consultas).toBeGreaterThanOrEqual(3)
})

prueba('mantiene el layout responsive sin scroll horizontal en móvil', async ({ page: pagina }) => {
  await pagina.setViewportSize({ width: 390, height: 844 })
  await pagina.evaluate(() => {
    sessionStorage.setItem('resultadoDuelo', JSON.stringify({
      idPartida: 'duelo-003',
      ganador: 'local',
      jugadorLocal: {
        nombre: 'Lucas',
        alias: 'Luki',
        avatar: 'LM',
        puntaje: 1500,
        aciertos: 9,
        totalPreguntas: 10,
        tiempoPromedio: 5.5,
      },
      oponente: {
        nombre: 'Rival',
        alias: 'Oponente',
        avatar: 'RV',
        puntaje: 1200,
        aciertos: 6,
        totalPreguntas: 10,
        tiempoPromedio: 8.2,
      },
      resultadoTexto: '¡VICTORIA!',
    }))
  })

  await pagina.goto('/duelo/resultado')

  const overflow = await pagina.evaluate(() => {
    const doc = document.documentElement
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
    }
  })

  esperar(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 2)
})
