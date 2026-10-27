import { test as prueba, expect as esperar } from './fixturesCobertura.js'
import { prepararSesion } from './datosSesion.js'

prueba('la vista previa permite crear y editar una pregunta temporal', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.goto('/admin?vistaPrevia=1')
  await pagina.getByRole('link', { name: 'Nueva pregunta' }).click()
  await pagina.getByLabel('Enunciado de la pregunta').fill('¿Quién ganó el Mundial de 1986?')
  await pagina.getByLabel('Categoría').selectOption('Mundiales')
  await pagina.getByLabel('Opción A').fill('Argentina')
  await pagina.getByLabel('Opción B').fill('Francia')
  await pagina.getByLabel('Opción C').fill('Brasil')
  await pagina.getByLabel('Opción D').fill('Alemania')
  await pagina.getByLabel('Respuesta correcta', { exact: true }).selectOption('0')
  await pagina.getByRole('button', { name: 'Guardar pregunta' }).click()
  await esperar(pagina.getByText('Pregunta guardada temporalmente.')).toBeVisible()
  await esperar(pagina.getByText('¿Quién ganó el Mundial de 1986?')).toBeVisible()
  await pagina.getByLabel('Acciones de pregunta: ¿Quién ganó el Mundial de 1986?').click()
  await pagina.getByRole('link', { name: 'Editar pregunta: ¿Quién ganó el Mundial de 1986?' }).click()
  await esperar(pagina.getByLabel('Opción A')).toHaveValue('Argentina')
  await pagina.getByLabel('Enunciado de la pregunta').fill('¿Qué selección ganó el Mundial de 1986?')
  await pagina.getByRole('button', { name: 'Guardar cambios' }).click()
  await esperar(pagina.getByText('¿Qué selección ganó el Mundial de 1986?')).toBeVisible()
})

prueba('el formulario valida las cuatro opciones y la respuesta correcta', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.goto('/admin/preguntas/nueva?vistaPrevia=1')
  await pagina.getByRole('button', { name: 'Guardar pregunta' }).click()
  await esperar(pagina.getByRole('alert')).toContainText('Completá el enunciado')
})

prueba('un jugador no puede abrir el formulario de administración', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.goto('/admin/preguntas/nueva')
  await esperar(pagina.getByRole('alert')).toContainText('Solo los administradores')
  await esperar(pagina.getByRole('button', { name: 'Guardar pregunta' })).toHaveCount(0)
})

prueba('muestra el error si falla la carga de una pregunta para editar', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.route('**/api/usuarios/me', (ruta) => ruta.fulfill({
    json: { id: 2, nombre: 'Admin', email: 'admin@ejemplo.com', rol: 'ADMINISTRADOR', puntaje_total: 0 },
  }))
  await pagina.route('**/api/admin/categorias', (ruta) => ruta.fulfill({ json: [] }))
  await pagina.route('**/api/admin/preguntas/999', (ruta) => ruta.fulfill({
    status: 503,
    json: { message: 'No pudimos cargar la pregunta solicitada' },
  }))

  await pagina.goto('/admin/preguntas/999/editar', { waitUntil: 'domcontentloaded' })

  await esperar(pagina.getByRole('alert')).toContainText('No pudimos cargar la pregunta solicitada')
  await esperar(pagina.getByRole('button', { name: 'Guardar cambios' })).toHaveCount(0)
})
