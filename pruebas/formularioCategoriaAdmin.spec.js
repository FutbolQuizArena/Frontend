import { test as prueba, expect as esperar } from '@playwright/test'
import { prepararSesion } from './datosSesion.js'

prueba('crea una categoría, permite elegirla en preguntas y valida nombres duplicados', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.goto('/admin/categorias?vistaPrevia=1')
  await pagina.getByRole('link', { name: 'Nueva categoría' }).click()
  await pagina.getByLabel('Nombre de la categoría').fill(' Selecciones ')
  await pagina.getByLabel('Descripción (opcional)').fill('Preguntas de selecciones nacionales')
  await pagina.getByRole('button', { name: 'Crear categoría' }).click()
  await esperar(pagina.getByText('Categoría guardada temporalmente.')).toBeVisible()
  await esperar(pagina.getByText('Selecciones', { exact: true })).toBeVisible()
  await pagina.getByRole('link', { name: 'Preguntas', exact: true }).first().click()
  await pagina.getByRole('link', { name: 'Nueva pregunta' }).click()
  await esperar(pagina.getByLabel('Categoría')).toContainText('Selecciones')
  await pagina.getByRole('link', { name: 'Categorías', exact: true }).first().click()
  await pagina.getByRole('link', { name: 'Nueva categoría' }).click()
  await pagina.getByLabel('Nombre de la categoría').fill('selecciones')
  await pagina.getByRole('button', { name: 'Crear categoría' }).click()
  await esperar(pagina.getByRole('alert')).toContainText('Ya existe una categoría')
})

prueba('editar una categoría conserva las preguntas asociadas y muestra el nuevo nombre', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.goto('/admin/categorias?vistaPrevia=1')
  await pagina.getByRole('link', { name: 'Editar categoría: Mundiales' }).click()
  await pagina.getByLabel('Nombre de la categoría').fill('Copas del mundo')
  await pagina.getByRole('button', { name: 'Guardar cambios' }).click()
  await esperar(pagina.getByText('Copas del mundo', { exact: true })).toBeVisible()
  await esperar(pagina.getByRole('link', { name: 'Editar categoría: Copas del mundo' }).locator('..')).toContainText('6')
  await pagina.getByRole('link', { name: 'Preguntas', exact: true }).first().click()
  await esperar(pagina).toHaveURL(/\/admin\?vistaPrevia=1$/)
  await pagina.getByRole('combobox', { name: 'Categoría', exact: true }).selectOption('Copas del mundo')
  await esperar(pagina.getByRole('listitem')).toHaveCount(5)
})

prueba('un jugador no puede crear ni editar categorías', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.goto('/admin/categorias/nueva')
  await esperar(pagina.getByRole('alert')).toContainText('Solo los administradores')
  await esperar(pagina.getByRole('button', { name: 'Crear categoría' })).toHaveCount(0)
})
