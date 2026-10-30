import { useEffect as usarEfecto, useState as usarEstado } from 'react'
import { usarSesion } from '../contextos/ContextoSesion.jsx'
import { obtenerPerfil, obtenerPerfilEnCache } from '../servicios/servicioPerfil.js'

/** Mantiene el perfil asociado al token vigente al cambiar de cuenta o pestaña. */
export default function usarPerfilActual() {
  const { token } = usarSesion()
  const [estado, establecerEstado] = usarEstado(() => ({ token, perfil: obtenerPerfilEnCache() }))

  usarEfecto(() => {
    let vigente = true
    obtenerPerfil()
      .then((perfil) => { if (vigente) establecerEstado({ token, perfil }) })
      .catch(() => { if (vigente) establecerEstado({ token, perfil: null }) })
    return () => { vigente = false }
  }, [token])

  return estado.token === token ? estado.perfil : obtenerPerfilEnCache()
}
