import { useNavigate as usarNavegacion } from 'react-router-dom'
import { usarSesion } from '../contextos/ContextoSesion.jsx'

export default function BotonCerrarSesion() {
  const { cerrarSesion } = usarSesion()
  const navegar = usarNavegacion()

  function manejarCierre() {
    cerrarSesion()
    navegar('/login', { replace: true })
  }

  return <button type="button" className="boton-cerrar-sesion" onClick={manejarCierre}>Cerrar sesión</button>
}
