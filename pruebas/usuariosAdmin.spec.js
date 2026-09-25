import { test as prueba, expect as esperar } from '@playwright/test'
import { prepararSesion } from './datosSesion.js'

const usuarios = [
  { id: 1, nombre: 'María', email: 'maria@ejemplo.com', rol: 'JUGADOR', puntaje_total: 100, esta_habilitado: true, fecha_alta: null },
  { id: 2, nombre: 'Lucas', email: 'lucas@ejemplo.com', rol: 'ADMINISTRADOR', puntaje_total: 0, esta_habilitado: true, fecha_alta: null },
  { id: 3, nombre: 'Fede', email: 'fede@ejemplo.com', rol: 'JUGADOR', puntaje_total: 40, esta_habilitado: false, fecha_alta: null },
]

prueba('el administrador lista y filtra usuarios con el contrato real de Swagger', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.route('**/api/usuarios/me', (ruta) => ruta.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 2, nombre: 'Lucas', email: 'lucas@ejemplo.com', rol: 'ADMINISTRADOR', puntaje_total: 0 }) }))
  const consultas = []
  await pagina.route('**/api/admin/usuarios*', (ruta) => {
    const url = new URL(ruta.request().url())
    consultas.push({ url, autorizacion: ruta.request().headers().authorization })
    const buscar = (url.searchParams.get('buscar') || '').toLocaleLowerCase('es-AR')
    const rol = url.searchParams.get('rol')
    const estado = url.searchParams.get('esta_habilitado')
    const resultado = usuarios.filter((usuario) =>
      (!buscar || `${usuario.nombre} ${usuario.email}`.toLocaleLowerCase('es-AR').includes(buscar)) &&
      (!rol || usuario.rol === rol) &&
      (estado === null || usuario.esta_habilitado === (estado === 'true')))
    return ruta.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(resultado) })
  })

  await pagina.goto('/admin/usuarios')
  await esperar(pagina.getByRole('heading', { name: 'Gestión de usuarios' })).toBeVisible()
  await esperar(pagina.getByRole('listitem')).toHaveCount(3)
  await pagina.getByLabel('Buscar usuario').fill('fede@')
  await esperar(pagina.getByRole('listitem')).toHaveCount(1)
  await esperar(pagina.getByText('Fede', { exact: true })).toBeVisible()
  await pagina.getByLabel('Buscar usuario').clear()
  await pagina.getByLabel('Rol').selectOption('JUGADOR')
  await pagina.getByLabel('Estado').selectOption('false')
  await esperar(pagina.getByRole('listitem')).toHaveCount(1)
  esperar(consultas.some(({ url }) => url.searchParams.get('rol') === 'JUGADOR' && url.searchParams.get('esta_habilitado') === 'false')).toBe(true)
  esperar(consultas.every(({ autorizacion }) => autorizacion?.startsWith('Bearer '))).toBe(true)
  await pagina.setViewportSize({ width: 390, height: 844 })
  esperar(await pagina.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

prueba('un jugador no consulta la lista administrativa', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  let llamadasAdmin = 0
  await pagina.route('**/api/admin/usuarios*', (ruta) => { llamadasAdmin += 1; return ruta.fulfill({ status: 403 }) })
  await pagina.goto('/admin/usuarios')
  await esperar(pagina.getByRole('alert')).toContainText('Solo los administradores')
  esperar(llamadasAdmin).toBe(0)
})

prueba('la cuenta admin local ve datos identificados como ejemplo', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.goto('/admin/usuarios?vistaPrevia=1')
  await esperar(pagina.getByText('Datos de ejemplo para probar el panel')).toBeVisible()
  await esperar(pagina.getByText('Mati10')).toBeVisible()
})
