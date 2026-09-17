async function enviarSolicitudAutenticacion(ruta, datos, mensajeError) {
  const urlApi = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '')

  if (!urlApi) {
    throw new Error('Falta configurar VITE_API_URL para conectar con el servidor.')
  }

  let respuesta

  try {
    respuesta = await fetch(`${urlApi}${ruta}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
      signal: AbortSignal.timeout(60000),
    })
  } catch (error) {
    if (error.name === 'TimeoutError') {
      throw new Error('El servidor tardó demasiado en responder. Intentá de nuevo en unos minutos.')
    }

    throw new Error('No pudimos conectar con el servidor. Revisá tu conexión e intentá de nuevo.')
  }

  let datosRespuesta

  try {
    datosRespuesta = await respuesta.json()
  } catch {
    throw new Error('El servidor devolvió una respuesta inesperada. Intentá de nuevo en unos minutos.')
  }

  if (!respuesta.ok) {
    // Conservamos code, message y detail del contrato, incluidos los errores 409 y 401.
    if (typeof datosRespuesta?.message === 'string' && datosRespuesta.message) {
      throw datosRespuesta
    }

    throw new Error(mensajeError)
  }

  return datosRespuesta
}

export function registrar(nombre, correo, contrasena) {
  return enviarSolicitudAutenticacion(
    '/api/auth/registro',
    { nombre, email: correo, password: contrasena },
    'No pudimos crear tu cuenta. Intentá de nuevo en unos minutos.',
  )
}

export function iniciarSesion(correo, contrasena) {
  return enviarSolicitudAutenticacion(
    '/api/auth/login',
    { email: correo, password: contrasena },
    'No pudimos iniciar sesión. Intentá de nuevo en unos minutos.',
  )
}
