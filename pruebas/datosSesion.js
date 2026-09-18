export function crearTokenPrueba(datos = {}) {
  const cabecera = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const contenido = Buffer.from(JSON.stringify({ sub: '1', exp: Math.floor(Date.now() / 1000) + 3600, ...datos })).toString('base64url')
  // Token ficticio: las pruebas interceptan la API y no validan firmas del backend.
  return `${cabecera}.${contenido}.firmaDePrueba`
}

export async function prepararSesion(pagina, token = crearTokenPrueba()) {
  await pagina.goto('/login')
  await pagina.evaluate((tokenTemporal) => sessionStorage.setItem('futbolquizToken', tokenTemporal), token)
}
