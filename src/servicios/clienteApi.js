import { obtenerToken } from './servicioSesion.js'

function obtenerUrlApi() {
  const urlApi = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '')
  if (!urlApi) throw new Error('Falta configurar VITE_API_URL para conectar con el servidor.')
  return urlApi
}

function crearErrorApi(datos, estado, mensajePredeterminado) {
  const error = new Error(datos?.message || mensajePredeterminado)
  error.codigo = datos?.code || 'ERROR_API'
  error.detalle = datos?.detail ?? null
  error.estado = estado
  return error
}

export async function solicitarApi(ruta, { metodo = 'GET', datos, requiereSesion = true } = {}) {
  const token = requiereSesion ? obtenerToken() : null
  if (requiereSesion && !token) throw crearErrorApi(null, 401, 'Necesitás iniciar sesión de nuevo.')

  const encabezados = { Accept: 'application/json' }
  if (datos !== undefined) encabezados['Content-Type'] = 'application/json'
  if (token) encabezados.Authorization = `Bearer ${token}`

  let respuesta
  try {
    respuesta = await fetch(`${obtenerUrlApi()}${ruta}`, {
      method: metodo,
      headers: encabezados,
      body: datos === undefined ? undefined : JSON.stringify(datos),
      signal: AbortSignal.timeout(60000),
    })
  } catch (error) {
    if (error.name === 'TimeoutError') throw new Error('El servidor tardó demasiado en responder. Intentá de nuevo en unos minutos.')
    throw new Error('No pudimos conectar con el servidor. Revisá tu conexión e intentá de nuevo.')
  }

  const textoRespuesta = await respuesta.text()
  let datosRespuesta = null

  if (textoRespuesta) {
    try {
      datosRespuesta = JSON.parse(textoRespuesta)
    } catch {
      throw new Error('El servidor devolvió una respuesta inesperada. Intentá de nuevo en unos minutos.')
    }
  }

  if (!respuesta.ok) throw crearErrorApi(datosRespuesta, respuesta.status, 'No pudimos completar la operación. Intentá de nuevo.')
  return datosRespuesta
}
