// La sesión puede vivir solo en esta pestaña o persistir entre visitas, según la elección del usuario.
export const claveToken = 'futbolquizToken'

/** Reconoce la cuenta local de demostración solo durante el desarrollo. */
export function esSesionAdminPrueba(token) {
  return import.meta.env.DEV && obtenerDatosToken(token || '')?.adminPrueba === true
}

/** Decodifica el token para leer su vencimiento; la firma se verifica en el backend. */
export function obtenerDatosToken(token) {
  try {
    const partes = token.split('.')
    if (partes.length !== 3 || partes.some((parte) => !/^[\w-]+$/.test(parte))) return null
    const contenido = partes[1].replaceAll('-', '+').replaceAll('_', '/')
    const bytes = Uint8Array.from(atob(contenido), (caracter) => caracter.codePointAt(0))
    const datos = JSON.parse(new TextDecoder().decode(bytes))
    if (!datos || typeof datos !== 'object' || Array.isArray(datos)) return null
    if (datos.exp !== undefined && (typeof datos.exp !== 'number' || !Number.isFinite(datos.exp))) return null
    return datos
  } catch {
    return null
  }
}

/** Evita conservar una sesión cuya fecha de expiración ya pasó. */
export function esTokenVigente(token) {
  const datos = obtenerDatosToken(token)
  // La firma y los permisos se verifican en el backend, no en el navegador.
  return Boolean(datos && (datos.exp === undefined || datos.exp * 1000 > Date.now()))
}

/** Borra el token de ambos almacenamientos al cerrar o invalidar la sesión. */
export function borrarSesion() {
  localStorage.removeItem(claveToken)
  sessionStorage.removeItem(claveToken)
}

/** Busca la sesión de pestaña o la persistente y descarta un token vencido. */
export function obtenerToken() {
  const token = sessionStorage.getItem(claveToken) || localStorage.getItem(claveToken)
  if (token && !esTokenVigente(token)) {
    borrarSesion()
    return null
  }
  return token
}

/** Guarda el token según la opción «mantener sesión» elegida al ingresar. */
export function guardarSesion(respuesta, mantenerSesion = false) {
  if (respuesta?.token_type !== 'bearer' || !esTokenVigente(respuesta?.access_token)) {
    throw new Error('El servidor devolvió una sesión inválida. Intentá iniciar sesión de nuevo.')
  }
  borrarSesion()
  const almacenamiento = mantenerSesion ? localStorage : sessionStorage
  almacenamiento.setItem(claveToken, respuesta.access_token)
  return respuesta.access_token
}
