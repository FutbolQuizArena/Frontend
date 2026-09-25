import { solicitarApi } from './clienteApi.js'
import { esSesionAdminPrueba, obtenerToken } from './servicioSesion.js'

const usuariosEjemplo = [
  { id: 1, nombre: 'Lucas', email: 'lucas@ejemplo.com', rol: 'ADMINISTRADOR', puntaje_total: 0, esta_habilitado: true },
  { id: 2, nombre: 'Mati10', email: 'mati@ejemplo.com', rol: 'JUGADOR', puntaje_total: 2450, esta_habilitado: true },
  { id: 3, nombre: 'SofiGol', email: 'sofi@ejemplo.com', rol: 'JUGADOR', puntaje_total: 1800, esta_habilitado: true },
  { id: 4, nombre: 'Fede_9', email: 'fede@ejemplo.com', rol: 'JUGADOR', puntaje_total: 920, esta_habilitado: false },
  { id: 5, nombre: 'NicoFC', email: 'nico@ejemplo.com', rol: 'JUGADOR', puntaje_total: 760, esta_habilitado: true },
]

export async function obtenerUsuariosAdmin({ buscar = '', rol = '', estaHabilitado = '' } = {}, { vistaPrevia = false } = {}) {
  const consulta = new URLSearchParams()
  if (buscar.trim()) consulta.set('buscar', buscar.trim())
  if (rol) consulta.set('rol', rol)
  if (estaHabilitado !== '') consulta.set('esta_habilitado', estaHabilitado)

  if (import.meta.env.DEV && (vistaPrevia || esSesionAdminPrueba(obtenerToken()))) {
    const texto = buscar.trim().toLocaleLowerCase('es-AR')
    return usuariosEjemplo.filter((usuario) =>
      (!texto || `${usuario.nombre} ${usuario.email}`.toLocaleLowerCase('es-AR').includes(texto)) &&
      (!rol || usuario.rol === rol) &&
      (estaHabilitado === '' || usuario.esta_habilitado === (estaHabilitado === 'true')))
  }

  const ruta = `/api/admin/usuarios${consulta.size ? `?${consulta}` : ''}`
  const respuesta = await solicitarApi(ruta)
  if (!Array.isArray(respuesta)) throw new Error('El servidor devolvió un listado de usuarios inesperado.')
  return respuesta
}
