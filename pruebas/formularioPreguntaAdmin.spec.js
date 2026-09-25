import { test as prueba, expect as esperar } from '@playwright/test'
import { prepararSesion } from './datosSesion.js'

prueba('la vista previa permite crear y editar una pregunta temporal', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.goto('/admin?vistaPrevia=1')
  await pagina.getByRole('link', { name: 'Nueva pregunta' }).click()
  await pagina.getByLabel('Enunciado de la pregunta').fill('¿Quién ganó el Mundial de 1986?')
  await pagina.getByLabel('Categoría').selectOption('Mundiales')
  await pagina.getByLabel('Opción 1').fill('Argentina')
  await pagina.getByLabel('Opción 2').fill('Francia')
  await pagina.getByLabel('Opción 3').fill('Brasil')
  await pagina.getByLabel('Opción 4').fill('Alemania')
  await pagina.getByRole('radio').first().check()
  await pagina.getByRole('button', { name: 'Guardar pregunta' }).click()
  await esperar(pagina.getByText('Pregunta guardada temporalmente.')).toBeVisible()
  await esperar(pagina.getByText('¿Quién ganó el Mundial de 1986?')).toBeVisible()
  await pagina.getByRole('link', { name: 'Editar pregunta: ¿Quién ganó el Mundial de 1986?' }).click()
  await esperar(pagina.getByLabel('Opción 1')).toHaveValue('Argentina')
  await pagina.getByLabel('Enunciado de la pregunta').fill('¿Qué selección ganó el Mundial de 1986?')
  await pagina.getByRole('button', { name: 'Guardar pregunta' }).click()
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
