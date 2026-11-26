import { test as prueba, expect as esperar } from './fixturesCobertura.js'
import { prepararSesion } from './datosSesion.js'
import { crearPreguntaPartida } from './datosPartidas.js'

const base = { id: 42, estado: 'EN_CURSO', modalidad: 'ONLINE', jugador1_id: 1,
  jugador2_id: 2, jugador1_nombre: 'Lucas', jugador2_nombre: 'Rival',
  puntaje_jugador1: 0, puntaje_jugador2: 0, numero_ganador: null, es_empate: false }

async function prepararJuego(pagina, preguntas = [crearPreguntaPartida(), crearPreguntaPartida(902)]) {
  await prepararSesion(pagina)
  await pagina.evaluate(() => sessionStorage.setItem('dueloActual', JSON.stringify({ id: 42 })))
  await pagina.route('**/api/duelos/42/juego', (ruta) => ruta.fulfill({ json: { ...base, preguntas } }))
  await pagina.route('**/api/duelos/42/presencia', (ruta) => ruta.fulfill({ json: base }))
}

prueba('el jugador inactivo agota la pregunta y avanza sin tocar Siguiente', async ({ page: pagina }) => {
  await prepararJuego(pagina)
  let respuesta
  await pagina.route('**/api/duelos/preguntas/901/respuesta', (ruta) => {
    respuesta = ruta.request().postDataJSON()
    return ruta.fulfill({ json: { es_correcta: false, puntaje_obtenido: 0 } })
  })
  await pagina.goto('/duelo/juegan')
  await esperar(pagina.getByRole('heading', { name: 'Pregunta de prueba 901' })).toBeVisible()
  await esperar(pagina.getByRole('heading', { name: 'Pregunta de prueba 902' })).toBeVisible({ timeout: 22000 })
  esperar(respuesta).toEqual({ opcion_seleccionada: null, tiempo_respuesta_segundos: 15 })
})

prueba('recargar recupera la primera pregunta pendiente del servidor', async ({ page: pagina }) => {
  await prepararJuego(pagina, [{ ...crearPreguntaPartida(), esta_respondida: true }, crearPreguntaPartida(902)])
  await pagina.goto('/duelo/juegan')
  await esperar(pagina.getByRole('heading', { name: 'Pregunta de prueba 902' })).toBeVisible()
  await pagina.reload()
  await esperar(pagina.getByRole('heading', { name: 'Pregunta de prueba 902' })).toBeVisible()
})

prueba('redirige al resultado por abandono aunque siga respondiendo', async ({ page: pagina }) => {
  await prepararJuego(pagina)
  const final = { ...base, estado: 'FINALIZADA', numero_ganador: 1, motivo_finalizacion: 'ABANDONO' }
  let consultas = 0
  await pagina.route('**/api/duelos/42/presencia', (ruta) => {
    consultas += 1
    return ruta.fulfill({ json: consultas > 1 ? final : { ...base, jugador2_ausente: true } })
  })
  await pagina.route('**/api/duelos/42', (ruta) => ruta.fulfill({ json: final }))
  await pagina.goto('/duelo/juegan')
  await esperar(pagina.getByText('Sin conexión. Esperando reconexión…')).toBeVisible()
  await esperar(pagina).toHaveURL(/\/duelo\/42\/resultado$/, { timeout: 10000 })
  await esperar(pagina.getByText('¡VICTORIA!', { exact: true })).toBeVisible()
  await esperar(pagina.getByText(/El duelo finalizó por abandono/)).toBeVisible()
})

prueba('muestra el cierre sin ganador cuando ambos perdieron conexión', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  const final = { ...base, estado: 'FINALIZADA', motivo_finalizacion: 'SIN_CONEXION' }
  await pagina.route('**/api/duelos/42', (ruta) => ruta.fulfill({ json: final }))
  await pagina.route('**/api/duelos/42/presencia', (ruta) => ruta.fulfill({ json: final }))
  await pagina.goto('/duelo/42/resultado')
  await esperar(pagina.getByText('SIN GANADOR', { exact: true })).toBeVisible()
  await esperar(pagina.getByText(/Ambos jugadores perdieron la conexión/)).toBeVisible()
  await esperar(pagina.getByRole('button', { name: 'Pedir Revancha' })).toBeEnabled()
})

prueba('cerrar la pestaña rival no impide que la espera reciba el cierre del servidor', async ({ page: pagina, context: contexto }) => {
  await prepararSesion(pagina)
  let cerrado = false
  const estado = () => cerrado ? { ...base, estado: 'FINALIZADA', numero_ganador: 1, motivo_finalizacion: 'ABANDONO' }
    : { ...base, jugador1_completo: true, jugador2_ausente: false }
  await pagina.route('**/api/duelos/42', (ruta) => ruta.fulfill({ json: estado() }))
  await pagina.route('**/api/duelos/42/presencia', (ruta) => ruta.fulfill({ json: estado() }))
  const rival = await contexto.newPage()
  await prepararJuego(rival)
  await rival.goto('/duelo/juegan')
  await esperar(rival.getByRole('heading', { name: 'Pregunta de prueba 901' })).toBeVisible()
  await pagina.goto('/duelo/42/resultado')
  await esperar(pagina.getByText('Esperando al rival...', { exact: true })).toBeVisible()
  await rival.close()
  // El vencimiento se prueba con reloj de servidor en Backend; aquí se simula su respuesta.
  cerrado = true
  await esperar(pagina.getByText('¡VICTORIA!', { exact: true })).toBeVisible({ timeout: 7000 })
  await esperar(pagina.getByText(/El duelo finalizó por abandono/)).toBeVisible()
})
