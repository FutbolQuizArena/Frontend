export async function registrar(nombre, correo, contrasena) {
  const urlApi = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '')

  if (!urlApi) {
    throw new Error('Falta configurar VITE_API_URL para conectar con el servidor.')
  }

  let respuesta

  try {
    respuesta = await fetch(`${urlApi}/api/auth/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email: correo, password: contrasena }),
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
    // Conservamos code, message y detail del contrato, incluido el error 409.
    if (typeof datosRespuesta?.message === 'string' && datosRespuesta.message) {
      throw datosRespuesta
    }

    throw new Error('No pudimos crear tu cuenta. Intentá de nuevo en unos minutos.')
  }

  return datosRespuesta
}

// TODO: reemplazar cuando el backend tenga login listo
// Cuenta de prueba: jugador@futbolquiz.com / FutbolQuiz123. No genera una sesión real.
export function iniciarSesion(correo, contrasena) {
  return new Promise((resolver, rechazar) => {
    setTimeout(() => {
      if (correo === 'jugador@futbolquiz.com' && contrasena === 'FutbolQuiz123') {
        resolver({
          access_token: 'token-simulado-futbolquiz-arena',
          token_type: 'bearer',
        })
        return
      }

      rechazar({
        code: 'CREDENCIALES_INVALIDAS',
        message: 'El correo electrónico o la contraseña son incorrectos.',
        detail: null,
      })
    }, 450)
  })
}
