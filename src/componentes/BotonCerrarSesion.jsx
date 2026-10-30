import { useNavigate as usarNavegacion } from 'react-router-dom'
import { usarSesion } from '../contextos/ContextoSesion.jsx'
import { cerrarSesionRemota } from '../servicios/servicioAuth.js'
import { navegarConManejo } from '../utilidades/navegacionConManejo.js'

/** Cierra la sesión remota y local desde los encabezados compartidos. */
export default function BotonCerrarSesion() {
  const { cerrarSesion } = usarSesion()
  const navegar = usarNavegacion()

  function manejarCierre() {
    void cerrarSesionRemota()
    cerrarSesion()
    navegarConManejo(navegar, '/login', { replace: true })
  }

  return <button type="button" className="boton-cerrar-sesion" onClick={manejarCierre}>Cerrar sesión</button>
}
