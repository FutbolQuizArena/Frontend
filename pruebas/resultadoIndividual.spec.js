import { test as prueba, expect as esperar } from '@playwright/test'
import { prepararSesion } from './datosSesion.js'

prueba('muestra el resultado individual con la barra lateral y los datos del partido', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.evaluate(() => {
    sessionStorage.setItem('resultadoPartidaIndividual', JSON.stringify({
      puntaje: 1270,
      respuestasCorrectas: 8,
      totalRespuestas: 10,
      finalizada: true,
    }))
  })

  await pagina.goto('/partida/resultado')

  await esperar(pagina.getByRole('heading', { name: 'Resultado de la partida', exact: true })).toBeVisible()
  await esperar(pagina.getByText('1270', { exact: false })).toBeVisible()
  await esperar(pagina.getByRole('navigation', { name: 'Navegación principal' })).toBeVisible()
  await esperar(pagina.getByText('Partida finalizada', { exact: false })).toBeVisible()
})
