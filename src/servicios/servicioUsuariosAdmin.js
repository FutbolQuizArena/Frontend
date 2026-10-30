import { solicitarApi } from './clienteApi.js'
import { esSesionAdminPrueba, obtenerToken } from './servicioSesion.js'

const usuariosEjemplo = [
  { id: 1, nombre: 'Lucas', email: 'lucas@ejemplo.com', rol: 'ADMINISTRADOR', puntaje_total: 0, esta_habilitado: true },
  { id: 2, nombre: 'Mati10', email: 'mati@ejemplo.com', rol: 'JUGADOR', puntaje_total: 2450, esta_habilitado: true },
  { id: 3, nombre: 'SofiGol', email: 'sofi@ejemplo.com', rol: 'JUGADOR', puntaje_total: 1800, esta_habilitado: true },
  { id: 4, nombre: 'Fede_9', email: 'fede@ejemplo.com', rol: 'JUGADOR', puntaje_total: 920, esta_habilitado: false },
  { id: 5, nombre: 'NicoFC', email: 'nico@ejemplo.com', rol: 'JUGADOR', puntaje_total: 760, esta_habilitado: true },
]

/** Aísla la lista ficticia de la operación normal con el backend. */
function usarEjemplos({ vistaPrevia = false } = {}) {
  return import.meta.env.DEV && (vistaPrevia || esSesionAdminPrueba(obtenerToken()))
}

/** Aplica búsqueda, rol y estado en la API o en la vista previa. */
export async function obtenerUsuariosAdmin({ buscar = '', rol = '', estaHabilitado = '' } = {}, { vistaPrevia = false } = {}) {
  const consulta = new URLSearchParams()
  if (buscar.trim()) consulta.set('buscar', buscar.trim())
  if (rol) consulta.set('rol', rol)
  if (estaHabilitado !== '') consulta.set('esta_habilitado', estaHabilitado)

  if (usarEjemplos({ vistaPrevia })) {
    const texto = buscar.trim().toLocaleLowerCase('es-AR')
    return usuariosEjemplo.filter((usuario) =>
      (!texto || `${usuario.nombre} ${usuario.email}`.toLocaleLowerCase('es-AR').includes(texto)) &&
      (!rol || usuario.rol === rol) &&
      (estaHabilitado === '' || usuario.esta_habilitado === (estaHabilitado === 'true')))
  }

  const parametros = consulta.size ? `?${consulta}` : ''
  const ruta = `/api/admin/usuarios${parametros}`
  const respuesta = await solicitarApi(ruta)
  if (!Array.isArray(respuesta)) throw new Error('El servidor devolvió un listado de usuarios inesperado.')
  return respuesta
}

export async function obtenerUsuarioAdmin(idUsuario, opciones = {}) {
  if (usarEjemplos(opciones)) {
    const usuario = usuariosEjemplo.find((item) => item.id === Number(idUsuario))
    if (!usuario) throw new Error('Usuario no encontrado.')
    return { ...usuario }
  }
  return solicitarApi(`/api/admin/usuarios/${encodeURIComponent(idUsuario)}`)
}

/** Comprueba correos duplicados al crear usuarios de demostración. */
export async function crearUsuarioAdmin(datos, opciones = {}) {
  if (usarEjemplos(opciones)) {
    if (usuariosEjemplo.some((usuario) => usuario.email.toLowerCase() === datos.email.trim().toLowerCase())) {
      throw new Error('El correo electrónico ya se encuentra registrado.')
    }
    const usuario = {
      id: Math.max(0, ...usuariosEjemplo.map((item) => item.id)) + 1,
      nombre: datos.nombre.trim(), email: datos.email.trim(), rol: datos.rol,
      puntaje_total: 0, esta_habilitado: true,
    }
    usuariosEjemplo.push(usuario)
    return { ...usuario }
  }
  return solicitarApi('/api/admin/usuarios', { metodo: 'POST', datos })
}

/** Actualiza nombre, correo y rol sin cambiar el estado de habilitación. */
export async function actualizarUsuarioAdmin(idUsuario, datos, opciones = {}) {
  if (usarEjemplos(opciones)) {
    const usuario = usuariosEjemplo.find((item) => item.id === Number(idUsuario))
    if (!usuario) throw new Error('Usuario no encontrado.')
    if (usuariosEjemplo.some((item) => item.id !== usuario.id && item.email.toLowerCase() === datos.email.trim().toLowerCase())) {
      throw new Error('El correo electrónico ya se encuentra registrado.')
    }
    Object.assign(usuario, { nombre: datos.nombre.trim(), email: datos.email.trim(), rol: datos.rol })
    return { ...usuario }
  }
  return solicitarApi(`/api/admin/usuarios/${encodeURIComponent(idUsuario)}`, { metodo: 'PATCH', datos })
}

/** Cambia la habilitación y evita bloquear al admin de ejemplo. */
export async function cambiarEstadoUsuarioAdmin(idUsuario, estaHabilitado, { vistaPrevia = false } = {}) {
  if (usarEjemplos({ vistaPrevia })) {
    const usuario = usuariosEjemplo.find((u) => u.id === Number(idUsuario) || u.id === idUsuario)
    if (!usuario) throw new Error('Usuario no encontrado.')
    if (!estaHabilitado && usuario.id === 1) {
      throw new Error('No podés deshabilitar tu propia cuenta de administrador.')
    }
    usuario.esta_habilitado = Boolean(estaHabilitado)
    return { ...usuario }
  }

  return await solicitarApi(`/api/admin/usuarios/${idUsuario}/estado`, {
    metodo: 'PATCH',
    datos: { esta_habilitado: Boolean(estaHabilitado) },
  })
}
