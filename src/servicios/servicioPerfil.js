import { solicitarApi } from './clienteApi.js'

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

export async function obtenerPerfil() {
  return adaptarPerfil(await solicitarApi('/api/usuarios/me'))
}

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
  return adaptarPerfil(usuario)
}

export async function cambiarContrasena(contrasenaActual, nuevaContrasena) {
  return adaptarPerfil(await solicitarApi('/api/usuarios/me/password', {
    metodo: 'PATCH',
    datos: { password_actual: contrasenaActual, nueva_password: nuevaContrasena },
  }))
}
