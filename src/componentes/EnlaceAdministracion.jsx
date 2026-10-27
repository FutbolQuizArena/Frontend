import { useEffect as usarEfecto, useState as usarEstado } from 'react'
import { NavLink as EnlaceNavegacion } from 'react-router-dom'
import { usarSesion } from '../contextos/ContextoSesion.jsx'
import { obtenerPerfil, obtenerPerfilEnCache } from '../servicios/servicioPerfil.js'

export default function EnlaceAdministracion({ claseEnlace }) {
  const { token } = usarSesion()
  const [esAdministrador, establecerEsAdministrador] = usarEstado(() => obtenerPerfilEnCache()?.rol === 'ADMINISTRADOR')

  usarEfecto(() => {
    let vigente = true
    establecerEsAdministrador(obtenerPerfilEnCache()?.rol === 'ADMINISTRADOR')
    obtenerPerfil()
      .then((perfil) => { if (vigente) establecerEsAdministrador(perfil.rol === 'ADMINISTRADOR') })
      .catch((error_) => {
        if (!vigente) return
        const sesionRechazada = error_?.estado === 401 || error_?.estado === 403
        establecerEsAdministrador(Boolean(!sesionRechazada && obtenerPerfilEnCache()?.rol === 'ADMINISTRADOR'))
      })
    return () => { vigente = false }
  }, [token])

  if (!esAdministrador) return null
  return <EnlaceNavegacion to="/admin" className={({ isActive: activo }) => `${claseEnlace}${activo ? ` ${claseEnlace}--activo` : ''}`}><span aria-hidden="true">⚙</span>Administración</EnlaceNavegacion>
}
