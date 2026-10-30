import { solicitarApi } from './clienteApi.js'

import { esSesionAdminPrueba, obtenerToken } from './servicioSesion.js'

let tokenPerfilGuardado = null
let perfilGuardado = null
let tokenConsulta = null
let consultaPerfil = null

/** Asocia el perfil en memoria al token que lo solicitó para no mezclar usuarios. */
function guardarPerfil(token, perfil) {
  if (token && token === obtenerToken()) {
    tokenPerfilGuardado = token
    perfilGuardado = perfil
  }
  return perfil
}

/** Entrega el perfil guardado solo si pertenece a la sesión vigente. */
export function obtenerPerfilEnCache() {
  const token = obtenerToken()
  return token && token === tokenPerfilGuardado ? perfilGuardado : null
}

/** Convierte los campos del backend al modelo que usa React. */
function adaptarPerfil(usuario) {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    correo: usuario.email,
    rol: usuario.rol,
    puntajeTotal: usuario.puntaje_total ?? 0,
    iniciales: usuario.nombre.trim().split(/\s+/).slice(0, 2).map((parte) => parte[0].toUpperCase()).join(''),
  }
}

/** Comparte una consulta en curso entre pantallas y actualiza la caché de la sesión. */
export async function obtenerPerfil() {
  const token = obtenerToken()
  if (esSesionAdminPrueba(token)) {
    return guardarPerfil(token, adaptarPerfil({ id: 0, nombre: 'Admin de prueba', email: 'admin@futbolquiz.local', rol: 'ADMINISTRADOR', puntaje_total: 0 }))
  }
  if (consultaPerfil && tokenConsulta === token) return consultaPerfil

  const consulta = solicitarApi('/api/usuarios/me').then((usuario) => guardarPerfil(token, adaptarPerfil(usuario)))
  tokenConsulta = token
  consultaPerfil = consulta
  try {
    return await consulta
  } finally {
    if (consultaPerfil === consulta) {
      tokenConsulta = null
      consultaPerfil = null
    }
  }
}

/** Envía nombre, correo y, si corresponde, el cambio de contraseña. */
export async function actualizarPerfil(datosPerfil) {
  const datos = { nombre: datosPerfil.nombre, email: datosPerfil.correo }
  if (datosPerfil.nuevaContrasena) {
    datos.password_actual = datosPerfil.contrasenaActual
    datos.nueva_password = datosPerfil.nuevaContrasena
  }
  const usuario = await solicitarApi('/api/usuarios/me', {
    metodo: 'PATCH',
    datos,
  })
  return guardarPerfil(obtenerToken(), adaptarPerfil(usuario))
}

/** Actualiza la contraseña y refresca el perfil con la respuesta del servidor. */
export async function cambiarContrasena(contrasenaActual, nuevaContrasena) {
  const usuario = await solicitarApi('/api/usuarios/me/password', {
    metodo: 'PATCH',
    datos: { password_actual: contrasenaActual, nueva_password: nuevaContrasena },
  })
  return guardarPerfil(obtenerToken(), adaptarPerfil(usuario))
}
