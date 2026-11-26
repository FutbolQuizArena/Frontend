import { test as prueba, expect as esperar } from './fixturesCobertura.js'
import { prepararSesion } from './datosSesion.js'
import { crearPreguntaPartida } from './datosPartidas.js'

const mensajeProteccion = 'Esta acción dejaría al juego sin categorías con preguntas activas suficientes. Primero habilitá otra categoría con preguntas.'

async function prepararAdmin(pagina) {
  await prepararSesion(pagina)
  await pagina.route('**/api/usuarios/me', (ruta) => ruta.fulfill({ json: {
    id: 1, nombre: 'Admin', email: 'admin@ejemplo.com', rol: 'ADMINISTRADOR', puntaje_total: 0,
  } }))
}

prueba('un banco inicialmente vacío muestra disponibilidad pendiente sin categorías inventadas', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.route('**/api/partidas/categorias', (ruta) => ruta.fulfill({ json: [] }))
  await pagina.goto('/partida/ruleta')
  await esperar(pagina.getByText(/Todavía no hay categorías listas para jugar/)).toBeVisible()
  await esperar(pagina.getByRole('button', { name: 'Girar Ruleta' })).toBeDisabled()
  await esperar(pagina.getByRole('button', { name: 'Continuar a la Partida' })).toHaveCount(0)
  await esperar(pagina.getByRole('img', { name: /Ruleta/ })).toHaveCount(0)
  await esperar(pagina.getByRole('alert')).toHaveCount(0)
})

prueba('una única categoría permite girar y se envía su ID para iniciar la partida', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.route('**/api/partidas/categorias', (ruta) => ruta.fulfill({ json: [{ id: 8, nombre: 'Mundiales' }] }))
  let solicitud
  await pagina.route('**/api/partidas/individual', (ruta) => {
    solicitud = ruta.request().postDataJSON()
    return ruta.fulfill({ json: { id: 42, estado: 'EN_CURSO', categoria_id: 8, categoria_nombre: 'Mundiales',
      preguntas: Array.from({ length: 10 }, (_, indice) => crearPreguntaPartida(901 + indice)),
    } })
  })
  await pagina.goto('/partida/ruleta')
  const rueda = pagina.getByRole('img', { name: /Ruleta/ })
  await esperar(rueda).toBeVisible()
  const dibujo = await rueda.locator('path').first().getAttribute('d')
  esperar(dibujo.match(/ A /g)).toHaveLength(2)
  await pagina.getByRole('button', { name: 'Girar Ruleta' }).click()
  await esperar(pagina.getByRole('heading', { name: 'Mundiales' })).toBeVisible({ timeout: 10000 })
  await pagina.getByRole('button', { name: 'Continuar a la Partida' }).click()
  await esperar(pagina.getByText('Pregunta de prueba 901', { exact: true })).toBeVisible()
  esperar(solicitud).toEqual({ categoria_id: 8 })
})

prueba('un fallo de carga no expone detalles técnicos ni habilita el giro', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.route('**/api/partidas/categorias', (ruta) => ruta.fulfill({ status: 503, json: { message: 'SQL ERROR detalle interno' } }))
  await pagina.goto('/partida/ruleta')
  await esperar(pagina.getByRole('alert')).toContainText('No pudimos cargar las categorías')
  await esperar(pagina.getByText(/SQL ERROR/)).toHaveCount(0)
  await esperar(pagina.getByRole('button', { name: 'Girar Ruleta' })).toBeDisabled()
})

prueba('el rechazo de desactivar la última categoría conserva el formulario administrativo', async ({ page: pagina }) => {
  await prepararAdmin(pagina)
  await pagina.route('**/api/admin/categorias/1', (ruta) => ruta.request().method() === 'PATCH'
    ? ruta.fulfill({ status: 409, json: { code: 'ULTIMA_CATEGORIA_JUGABLE', message: mensajeProteccion } })
    : ruta.fulfill({ json: { id: 1, nombre: 'Mundiales', estado: 'ACTIVA', preguntas_count: 10 } }))
  await pagina.goto('/admin/categorias/1/editar')
  await pagina.getByLabel('Nombre de la categoría').fill('Edición conservada')
  await pagina.getByLabel('Estado').selectOption('BORRADOR')
  await pagina.getByRole('button', { name: 'Guardar cambios' }).click()
  await esperar(pagina.getByRole('alert')).toHaveText(mensajeProteccion)
  await esperar(pagina.getByLabel('Nombre de la categoría')).toHaveValue('Edición conservada')
  await esperar(pagina.getByLabel('Estado')).toHaveValue('BORRADOR')
  await esperar(pagina).toHaveURL(/\/admin\/categorias\/1\/editar$/)
})

prueba('el rechazo de mover una pregunta conserva opciones, categoría y edición', async ({ page: pagina }) => {
  await prepararAdmin(pagina)
  await pagina.route('**/api/admin/categorias', (ruta) => ruta.fulfill({ json: [
    { id: 1, nombre: 'Mundiales', estado: 'ACTIVA' }, { id: 2, nombre: 'Clubes', estado: 'ACTIVA' },
  ] }))
  await pagina.route('**/api/admin/preguntas/1', (ruta) => ruta.request().method() === 'PATCH'
    ? ruta.fulfill({ status: 409, json: { code: 'ULTIMA_CATEGORIA_JUGABLE', message: mensajeProteccion } })
    : ruta.fulfill({ json: { id: 1, categoria_id: 1, categoria_nombre: 'Mundiales', estado: 'ACTIVA',
      enunciado: 'Original', opcion_a: 'Argentina', opcion_b: 'Brasil', opcion_c: 'Francia', opcion_d: 'Italia', respuesta_correcta: 'A', dificultad: 'Media',
    } }))
  await pagina.goto('/admin/preguntas/1/editar')
  await pagina.getByLabel('Enunciado de la pregunta').fill('Edición conservada')
  await pagina.getByRole('combobox', { name: 'Categoría', exact: true }).selectOption('Clubes')
  await pagina.getByRole('button', { name: 'Guardar cambios' }).click()
  await esperar(pagina.getByRole('alert')).toHaveText(mensajeProteccion)
  await esperar(pagina.getByLabel('Enunciado de la pregunta')).toHaveValue('Edición conservada')
  await esperar(pagina.getByRole('combobox', { name: 'Categoría', exact: true })).toHaveValue('Clubes')
  await esperar(pagina.getByLabel('Opción A', { exact: true })).toHaveValue('Argentina')
  await esperar(pagina).toHaveURL(/\/admin\/preguntas\/1\/editar$/)
})
