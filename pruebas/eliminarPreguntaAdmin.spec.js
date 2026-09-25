import { test as prueba, expect as esperar } from '@playwright/test'
import { prepararSesion } from './datosSesion.js'

prueba('cancelar conserva la pregunta y confirmar la elimina del listado temporal', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.goto('/admin?vistaPrevia=1')
  const pregunta = '¿Qué selección ganó el Mundial de 2022?'
  await pagina.getByRole('button', { name: `Eliminar pregunta: ${pregunta}` }).click()
  await esperar(pagina.getByRole('alertdialog')).toContainText(pregunta)
  await pagina.getByRole('button', { name: 'Cancelar' }).click()
  await esperar(pagina.getByText(pregunta)).toBeVisible()
  await pagina.getByRole('button', { name: `Eliminar pregunta: ${pregunta}` }).click()
  await pagina.getByRole('button', { name: 'Sí, eliminar' }).click()
  await esperar(pagina.getByText('Pregunta eliminada temporalmente.')).toBeVisible()
  await esperar(pagina.getByText(pregunta)).toHaveCount(0)
})
