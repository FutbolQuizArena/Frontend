export const claveToken = 'futbolquizToken'

export function esSesionAdminPrueba(token) {
  return import.meta.env.DEV && obtenerDatosToken(token || '')?.adminPrueba === true
}

export function obtenerDatosToken(token) {
  try {
    const partes = token.split('.')
    if (partes.length !== 3 || partes.some((parte) => !/^[\w-]+$/.test(parte))) return null
    const contenido = partes[1].replace(/-/g, '+').replace(/_/g, '/')
    const bytes = Uint8Array.from(atob(contenido), (caracter) => caracter.charCodeAt(0))
    const datos = JSON.parse(new TextDecoder().decode(bytes))
    if (!datos || typeof datos !== 'object' || Array.isArray(datos)) return null
    if (datos.exp !== undefined && (typeof datos.exp !== 'number' || !Number.isFinite(datos.exp))) return null
    return datos
  } catch {
    return null
  }
}

export function esTokenVigente(token) {
  const datos = obtenerDatosToken(token)
  // La firma y los permisos se verifican en el backend, no en el navegador.
  return Boolean(datos && (datos.exp === undefined || datos.exp * 1000 > Date.now()))
}

export function borrarSesion() {
  localStorage.removeItem(claveToken)
  sessionStorage.removeItem(claveToken)
}

export function obtenerToken() {
  const token = sessionStorage.getItem(claveToken) || localStorage.getItem(claveToken)
  if (token && !esTokenVigente(token)) {
    borrarSesion()
    return null
  }
  return token
}

export function guardarSesion(respuesta, mantenerSesion = false) {
  if (respuesta?.token_type !== 'bearer' || !esTokenVigente(respuesta?.access_token)) {
    throw new Error('El servidor devolvió una sesión inválida. Intentá iniciar sesión de nuevo.')
  }
  borrarSesion()
  const almacenamiento = mantenerSesion ? localStorage : sessionStorage
  almacenamiento.setItem(claveToken, respuesta.access_token)
  return respuesta.access_token
}
