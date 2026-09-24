import { test as prueba, expect as esperar } from '@playwright/test'
import { prepararSesion } from './datosSesion.js'

prueba.beforeEach(async ({ page: pagina }) => {
  await prepararSesion(pagina)
})

prueba('renderiza el resultado del duelo en estado de victoria', async ({ page: pagina }) => {
  await pagina.evaluate(() => {
    sessionStorage.setItem('resultadoDuelo', JSON.stringify({
      idPartida: 'duelo-001',
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
      idPartida: 'duelo-002',
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
