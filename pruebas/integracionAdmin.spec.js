import { test as prueba, expect as esperar } from '@playwright/test'
import { prepararSesion } from './datosSesion.js'

const categoria = { id: 7, nombre: 'Mundiales', estado: 'ACTIVA', preguntas_count: 1 }
const pregunta = { id: 12, enunciado: '¿Quién ganó en 2022?', categoria_id: 7, categoria_nombre: 'Mundiales', opcion_a: 'Argentina', opcion_b: 'Francia', opcion_c: 'Brasil', opcion_d: 'Alemania', respuesta_correcta: 'A', dificultad: 'Fácil', estado: 'ACTIVA' }

async function prepararAdmin(pagina) {
  await prepararSesion(pagina)
  await pagina.unroute('**/api/usuarios/me')
  await pagina.route('**/api/usuarios/me', (ruta) => ruta.fulfill({ json: { id: 1, nombre: 'Admin', email: 'admin@ejemplo.com', rol: 'ADMINISTRADOR', puntaje_total: 0 } }))
}

prueba('el administrador vuelve al panel y consulta preguntas reales con JWT', async ({ page: pagina }) => {
  await prepararAdmin(pagina)
  const solicitudes = []
  await pagina.route('**/api/admin/categorias', (ruta) => ruta.fulfill({ json: [categoria] }))
  await pagina.route('**/api/admin/preguntas*', (ruta) => {
    solicitudes.push({ url: ruta.request().url(), autorizacion: ruta.request().headers().authorization })
    return ruta.fulfill({ json: { items: [pregunta], total: 1, page: 1, total_paginas: 1 } })
  })
  await pagina.goto('/home')
  await pagina.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Administración' }).click()
  await esperar(pagina.getByText(pregunta.enunciado)).toBeVisible()
  esperar(solicitudes.length).toBeGreaterThan(0)
  esperar(solicitudes[0].url).toContain('/api/admin/preguntas?page=1')
  esperar(solicitudes[0].autorizacion).toMatch(/^Bearer /)
  await pagina.getByRole('link', { name: 'Volver al juego' }).click()
  await esperar(pagina.getByRole('link', { name: 'Administración' })).toBeVisible()
})

prueba('el listado real solicita solo la página visible y envía los filtros al backend', async ({ page: pagina }) => {
  await prepararAdmin(pagina)
  const solicitudes = []
  await pagina.route('**/api/admin/categorias', (ruta) => ruta.fulfill({ json: [categoria] }))
  await pagina.route('**/api/admin/preguntas?*', (ruta) => {
    const parametros = new URL(ruta.request().url()).searchParams
    solicitudes.push(Object.fromEntries(parametros))
    const item = parametros.get('page') === '2' ? { ...pregunta, id: 13, enunciado: 'Pregunta de la segunda página' } : pregunta
    return ruta.fulfill({ json: { items: [item], total: 480, page: Number(parametros.get('page')), total_paginas: 80 } })
  })
  await pagina.goto('/admin')
  await esperar(pagina.getByText(pregunta.enunciado)).toBeVisible()
  esperar(solicitudes.every(({ page }) => page === '1')).toBe(true)
  await pagina.getByRole('button', { name: 'Siguiente' }).click()
  await esperar(pagina.getByText('Pregunta de la segunda página')).toBeVisible()
  esperar(solicitudes.at(-1).page).toBe('2')
  await pagina.getByLabel('Categoría').selectOption('7')
  await esperar(pagina.getByText('Página 1 de 80')).toBeVisible()
  await esperar.poll(() => solicitudes.at(-1)).toMatchObject({ page: '1', categoria_id: '7' })
  await pagina.getByLabel('Buscar pregunta').fill('mundial')
  await esperar.poll(() => solicitudes.at(-1)).toMatchObject({ page: '1', buscar: 'mundial', categoria_id: '7' })
})

prueba('el formulario envía el contrato real y recarga el listado', async ({ page: pagina }) => {
  await prepararAdmin(pagina)
  let enviada
  await pagina.route('**/api/admin/categorias', (ruta) => ruta.fulfill({ json: [categoria] }))
  await pagina.route('**/api/admin/preguntas?page=1', (ruta) => ruta.fulfill({ json: { items: enviada ? [pregunta] : [], total: enviada ? 1 : 0, page: 1, total_paginas: 1 } }))
  await pagina.route('**/api/admin/preguntas', (ruta) => {
    enviada = ruta.request().postDataJSON()
    return ruta.fulfill({ status: 201, json: pregunta })
  })
  await pagina.goto('/admin/preguntas/nueva')
  await pagina.getByLabel('Enunciado de la pregunta').fill('¿Quién ganó en 2022?')
  await pagina.getByLabel('Categoría').selectOption('Mundiales')
  for (const [letra, respuesta] of [['A', 'Argentina'], ['B', 'Francia'], ['C', 'Brasil'], ['D', 'Alemania']]) await pagina.getByLabel(`Opción ${letra}`).fill(respuesta)
  await pagina.getByLabel('Respuesta correcta', { exact: true }).selectOption('0')
  await pagina.getByRole('button', { name: 'Guardar pregunta' }).click()
  await esperar(pagina.getByText('Pregunta guardada.', { exact: true })).toBeVisible()
  esperar(enviada.categoria_id).toBe(7)
  esperar(enviada.respuesta_correcta).toBe('A')
  esperar(enviada.opcion_d).toBe('Alemania')
})

prueba('las categorías reales usan GET y PATCH sin enviar descripción', async ({ page: pagina }) => {
  await prepararAdmin(pagina)
  let cambio
  await pagina.route('**/api/admin/categorias/7', (ruta) => {
    if (ruta.request().method() === 'PATCH') cambio = ruta.request().postDataJSON()
    return ruta.fulfill({ json: { ...categoria, ...cambio } })
  })
  await pagina.route('**/api/admin/categorias', (ruta) => ruta.fulfill({ json: [{ ...categoria, ...cambio }] }))
  await pagina.goto('/admin/categorias')
  await esperar(pagina.getByText('Mundiales', { exact: true })).toBeVisible()
  await pagina.getByRole('link', { name: 'Editar categoría: Mundiales' }).click()
  await esperar(pagina.getByLabel('Descripción (opcional)')).toHaveCount(0)
  await pagina.getByLabel('Nombre de la categoría').fill('Copas del Mundo')
  await pagina.getByRole('button', { name: 'Guardar cambios' }).click()
  await esperar(pagina.getByText('Categoría guardada.', { exact: true })).toBeVisible()
  esperar(cambio).toEqual({ nombre: 'Copas del Mundo', estado: 'ACTIVA' })
})

prueba('editar conserva el borrador y eliminar llama al backend', async ({ page: pagina }) => {
  await prepararAdmin(pagina)
  const borrador = { ...pregunta, estado: 'BORRADOR' }
  let cambios
  let eliminada = false
  await pagina.route('**/api/admin/categorias', (ruta) => ruta.fulfill({ json: [categoria] }))
  await pagina.route('**/api/admin/preguntas/12', (ruta) => {
    if (ruta.request().method() === 'PATCH') cambios = ruta.request().postDataJSON()
    if (ruta.request().method() === 'DELETE') eliminada = true
    return ruta.fulfill({ json: ruta.request().method() === 'DELETE' ? { message: 'Pregunta eliminada' } : borrador })
  })
  await pagina.route('**/api/admin/preguntas?page=1', (ruta) => ruta.fulfill({ json: { items: eliminada ? [] : [borrador], total: eliminada ? 0 : 1, page: 1, total_paginas: 1 } }))
  await pagina.goto('/admin/preguntas/12/editar')
  await esperar(pagina.getByLabel('Enunciado de la pregunta')).toHaveValue(borrador.enunciado)
  await pagina.getByRole('button', { name: 'Guardar cambios' }).click()
  await esperar(pagina.getByText('Pregunta guardada.', { exact: true })).toBeVisible()
  esperar(cambios.estado).toBe('BORRADOR')
  await pagina.getByLabel(`Acciones de pregunta: ${borrador.enunciado}`).click()
  await pagina.getByRole('button', { name: `Eliminar pregunta: ${borrador.enunciado}` }).click()
  await pagina.getByRole('button', { name: 'Sí, eliminar' }).click()
  await esperar(pagina.getByText('Pregunta eliminada.', { exact: true })).toBeVisible()
  esperar(eliminada).toBe(true)
})
