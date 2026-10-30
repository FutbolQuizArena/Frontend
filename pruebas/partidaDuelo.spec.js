import { test as prueba, expect as esperar } from './fixturesCobertura.js'
import { prepararSesion } from './datosSesion.js'
import { crearPreguntaPartida, prepararDueloOnline } from './datosPartidas.js'

prueba('consulta el mismo duelo pendiente hasta que aparece un rival', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  let intentosBusqueda = 0
  let consultasEstado = 0
  const datosDuelo = {
    id: 42, categoria_nombre: 'Historia', jugador1_id: 1, jugador1_nombre: 'Lucas',
    preguntas: [crearPreguntaPartida()],
  }
  await pagina.route('**/api/duelos/online', (ruta) => {
    intentosBusqueda += 1
    return ruta.fulfill({ json: {
      ...datosDuelo,
      estado: 'PENDIENTE_RIVAL',
      busqueda_expira_en: new Date(Date.now() + 30000).toISOString(),
    } })
  })
  // El GET cambia de pendiente a emparejado sin repetir el POST de búsqueda.
  await pagina.route('**/api/duelos/42', (ruta) => {
    consultasEstado += 1
    return ruta.fulfill({ json: {
      ...datosDuelo,
      estado: consultasEstado > 1 ? 'EN_CURSO' : 'PENDIENTE_RIVAL',
      ...(consultasEstado > 1 ? { jugador2_id: 2, jugador2_nombre: 'Rival' } : {}),
    } })
  })

  await pagina.goto('/duelo/esperando')
  await esperar(pagina.getByRole('heading', { name: 'Buscando rival...' })).toBeVisible()
  await esperar.poll(() => consultasEstado, { timeout: 15000 }).toBeGreaterThanOrEqual(2)
  await esperar(pagina).toHaveURL(/\/duelo\/(partida|juegan)$/, { timeout: 15000 })
  esperar(intentosBusqueda).toBe(1)
})

prueba('muestra el vencimiento sin rival y detiene las consultas', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  let consultasEstado = 0
  const datosDuelo = { id: 43, estado: 'PENDIENTE_RIVAL', jugador1_id: 1, preguntas: [crearPreguntaPartida()] }
  await pagina.route('**/api/duelos/online', (ruta) => ruta.fulfill({ json: datosDuelo }))
  await pagina.route('**/api/duelos/43', (ruta) => {
    consultasEstado += 1
    return ruta.fulfill({ json: { ...datosDuelo, estado: 'FINALIZADA', jugador2_id: null } })
  })

  // Una búsqueda vencida termina en esta pantalla y conserva la opción de volver al menú.
  await pagina.goto('/duelo/esperando')
  await esperar(pagina.getByRole('heading', { name: 'No encontramos rival' })).toBeVisible()
  await esperar(pagina.getByRole('button', { name: 'Volver al menú' }).last()).toBeVisible()
  esperar(consultasEstado).toBe(1)
  esperar(await pagina.evaluate(() => sessionStorage.getItem('dueloActual'))).toBeNull()
})

prueba('espera el ID inicial antes de cancelar la búsqueda en el servidor', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  let liberarBusqueda
  const busquedaPendiente = new Promise((resolver) => { liberarBusqueda = resolver })
  let cancelaciones = 0
  await pagina.route('**/api/duelos/online', async (ruta) => {
    await busquedaPendiente
    return ruta.fulfill({ json: { id: 44, estado: 'PENDIENTE_RIVAL', jugador1_id: 1, preguntas: [crearPreguntaPartida()] } })
  })
  await pagina.route('**/api/duelos/44/cancelar', (ruta) => {
    cancelaciones += 1
    return ruta.fulfill({ json: { id: 44, estado: 'FINALIZADA' } })
  })

  // El clic puede ocurrir antes de que el primer POST devuelva el identificador.
  await pagina.goto('/duelo/esperando')
  await pagina.getByRole('button', { name: 'Cancelar búsqueda' }).click()
  liberarBusqueda()
  await esperar(pagina).toHaveURL(/\/jugar$/)
  esperar(cancelaciones).toBe(1)
  esperar(await pagina.evaluate(() => sessionStorage.getItem('dueloActual'))).toBeNull()
})

prueba('continúa el duelo si el rival aparece mientras se cancela', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  const datosDuelo = { id: 45, estado: 'PENDIENTE_RIVAL', jugador1_id: 1, jugador1_nombre: 'Lucas', preguntas: [crearPreguntaPartida()] }
  await pagina.route('**/api/duelos/online', (ruta) => ruta.fulfill({ json: datosDuelo }))
  await pagina.route('**/api/duelos/45/cancelar', (ruta) => ruta.fulfill({
    status: 409,
    json: { code: 'BUSQUEDA_YA_EMPAREJADA', message: 'Ya se encontró rival.' },
  }))
  await pagina.route('**/api/duelos/45', (ruta) => ruta.fulfill({ json: {
    ...datosDuelo, estado: 'EN_CURSO', jugador2_id: 2, jugador2_nombre: 'Rival',
  } }))

  // El 409 se resuelve consultando el duelo existente y entrando con el rival confirmado.
  await pagina.goto('/duelo/esperando')
  await pagina.getByRole('button', { name: 'Cancelar búsqueda' }).click()
  await esperar(pagina).toHaveURL(/\/duelo\/(partida|juegan)$/, { timeout: 15000 })
})

prueba('renderiza la partida de duelo y avanza hasta el resultado', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await prepararDueloOnline(pagina)

  await pagina.goto('/duelo/esperando')
  await esperar(pagina).toHaveURL(/\/duelo\/(partida|juegan)$/)

  await esperar(pagina.getByText('Lucas', { exact: false }).first()).toBeVisible()
  await esperar(pagina.getByText('Rival', { exact: false }).first()).toBeVisible()
  await esperar(pagina.getByText('Pregunta 1', { exact: false })).toBeVisible()

  const botones = pagina.locator('button[data-testid="opcion-duelo"]')
  await esperar(botones.first()).toBeVisible()
  await botones.first().click()

  await esperar(botones.first()).toBeDisabled()
  await pagina.getByRole('button', { name: 'Siguiente', exact: true }).click()

  await esperar(pagina).toHaveURL(/\/duelo\/(?:[^/]+\/)?resultado$/)
})

prueba('mantiene el layout responsive en móvil', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await prepararDueloOnline(pagina)
  await pagina.setViewportSize({ width: 390, height: 844 })
  await pagina.goto('/duelo/esperando')
  await esperar(pagina).toHaveURL(/\/duelo\/(partida|juegan)$/)

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
