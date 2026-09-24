export function crearTokenPrueba(datos = {}) {
  const cabecera = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const contenido = Buffer.from(JSON.stringify({ sub: '1', exp: Math.floor(Date.now() / 1000) + 3600, ...datos })).toString('base64url')
  // Token ficticio: las pruebas interceptan la API y no validan firmas del backend.
  return `${cabecera}.${contenido}.firmaDePrueba`
}

export async function prepararSesion(pagina, token = crearTokenPrueba()) {
  await pagina.goto('/login')
  await pagina.evaluate((tokenTemporal) => sessionStorage.setItem('futbolquizToken', tokenTemporal), token)
  await pagina.route('**/api/usuarios/me', (ruta) => ruta.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ id: 1, nombre: 'Lucas Agüero', email: 'lucas@futbolquiz.com', rol: 'JUGADOR', puntaje_total: 2450 }),
  }))
}
