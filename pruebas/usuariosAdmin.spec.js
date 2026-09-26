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

prueba('el administrador deshabilita y habilita un usuario con diálogo de confirmación', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.route('**/api/usuarios/me', (ruta) => ruta.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 2, nombre: 'Lucas', email: 'lucas@ejemplo.com', rol: 'ADMINISTRADOR', puntaje_total: 0 }) }))
  await pagina.route('**/api/admin/usuarios', (ruta) => ruta.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(usuarios) }))

  const peticionesPatch = []
  await pagina.route('**/api/admin/usuarios/*/estado', (ruta) => {
    peticionesPatch.push({ url: ruta.request().url(), cuerpo: JSON.parse(ruta.request().postData() || '{}') })
    return ruta.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) })
  })

  await pagina.goto('/admin/usuarios')
  await esperar(pagina.getByRole('heading', { name: 'Gestión de usuarios' })).toBeVisible()

  // Deshabilitar a María
  const filaMaria = pagina.getByRole('listitem').filter({ hasText: 'María' })
  await filaMaria.getByRole('button', { name: /deshabilitar/i }).click()

  const dialogo = pagina.getByRole('alertdialog')
  await esperar(dialogo).toBeVisible()
  await esperar(dialogo.getByRole('heading', { name: '¿Deshabilitar usuario?' })).toBeVisible()
  await esperar(dialogo.getByText('María')).toBeVisible()

  await dialogo.getByRole('button', { name: 'Sí, deshabilitar' }).click()
  await esperar(dialogo).not.toBeVisible()

  esperar(peticionesPatch).toHaveLength(1)
  esperar(peticionesPatch[0].url).toContain('/api/admin/usuarios/1/estado')
  esperar(peticionesPatch[0].cuerpo).toEqual({ esta_habilitado: false })
  await esperar(filaMaria.getByText('DESHABILITADO')).toBeVisible()
  await esperar(filaMaria.getByRole('button', { name: /habilitar/i })).toBeVisible()

  // Habilitar a Fede
  const filaFede = pagina.getByRole('listitem').filter({ hasText: 'Fede' })
  await filaFede.getByRole('button', { name: /habilitar/i }).click()

  await esperar(dialogo).toBeVisible()
  await esperar(dialogo.getByRole('heading', { name: '¿Habilitar usuario?' })).toBeVisible()
  await dialogo.getByRole('button', { name: 'Sí, habilitar' }).click()
  await esperar(dialogo).not.toBeVisible()

  esperar(peticionesPatch).toHaveLength(2)
  esperar(peticionesPatch[1].url).toContain('/api/admin/usuarios/3/estado')
  esperar(peticionesPatch[1].cuerpo).toEqual({ esta_habilitado: true })
  await esperar(filaFede.getByText('HABILITADO')).toBeVisible()
})

prueba('al deshabilitar una cuenta desaparece del filtro de habilitados', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.route('**/api/usuarios/me', (ruta) => ruta.fulfill({ json: { id: 2, nombre: 'Lucas', email: 'lucas@ejemplo.com', rol: 'ADMINISTRADOR', puntaje_total: 0 } }))
  await pagina.route('**/api/admin/usuarios*', (ruta) => {
    const estado = new URL(ruta.request().url()).searchParams.get('esta_habilitado')
    return ruta.fulfill({ json: usuarios.filter((usuario) => estado === null || usuario.esta_habilitado === (estado === 'true')) })
  })
  await pagina.route('**/api/admin/usuarios/1/estado', (ruta) => ruta.fulfill({ json: { ...usuarios[0], esta_habilitado: false } }))
  await pagina.goto('/admin/usuarios')
  await pagina.getByLabel('Estado').selectOption('true')
  const filaMaria = pagina.getByRole('listitem').filter({ hasText: 'María' })
  await esperar(filaMaria).toBeVisible()
  await filaMaria.getByRole('button', { name: /deshabilitar/i }).click()
  await pagina.getByRole('alertdialog').getByRole('button', { name: 'Sí, deshabilitar' }).click()
  await esperar(filaMaria).toHaveCount(0)
  await esperar(pagina.getByText('1 usuario', { exact: true })).toBeVisible()
})

prueba('cancelar la confirmación no altera el estado del usuario', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.route('**/api/usuarios/me', (ruta) => ruta.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 2, nombre: 'Lucas', email: 'lucas@ejemplo.com', rol: 'ADMINISTRADOR', puntaje_total: 0 }) }))
  await pagina.route('**/api/admin/usuarios', (ruta) => ruta.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(usuarios) }))

  let llamadasPatch = 0
  await pagina.route('**/api/admin/usuarios/*/estado', (ruta) => {
    llamadasPatch += 1
    return ruta.fulfill({ status: 200 })
  })

  await pagina.goto('/admin/usuarios')
  const filaMaria = pagina.getByRole('listitem').filter({ hasText: 'María' })
  await filaMaria.getByRole('button', { name: /deshabilitar/i }).click()

  const dialogo = pagina.getByRole('alertdialog')
  await esperar(dialogo).toBeVisible()
  await dialogo.getByRole('button', { name: 'Cancelar' }).click()
  await esperar(dialogo).not.toBeVisible()

  esperar(llamadasPatch).toBe(0)
  await esperar(filaMaria.getByText('HABILITADO')).toBeVisible()
})

prueba('muestra el error si el backend rechaza deshabilitar la propia cuenta', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.route('**/api/usuarios/me', (ruta) => ruta.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 2, nombre: 'Lucas', email: 'lucas@ejemplo.com', rol: 'ADMINISTRADOR', puntaje_total: 0 }) }))
  await pagina.route('**/api/admin/usuarios', (ruta) => ruta.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(usuarios) }))
  await pagina.route('**/api/admin/usuarios/2/estado', (ruta) => ruta.fulfill({
    status: 400,
    contentType: 'application/json',
    body: JSON.stringify({ message: 'No podés deshabilitar tu propia cuenta de administrador.' }),
  }))

  await pagina.goto('/admin/usuarios')
  const filaLucas = pagina.getByRole('listitem').filter({ hasText: 'Lucas' })
  await filaLucas.getByRole('button', { name: /deshabilitar/i }).click()

  const dialogo = pagina.getByRole('alertdialog')
  await esperar(dialogo).toBeVisible()
  await dialogo.getByRole('button', { name: 'Sí, deshabilitar' }).click()

  await esperar(dialogo.getByRole('alert')).toContainText('No podés deshabilitar tu propia cuenta')
  await dialogo.getByRole('button', { name: 'Cancelar' }).click()
  await esperar(dialogo).not.toBeVisible()
})
