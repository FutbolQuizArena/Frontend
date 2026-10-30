import { Navigate as Redireccion, Outlet as ContenidoRuta } from 'react-router-dom'
import { usarSesion } from '../contextos/ContextoSesion.jsx'

/** Redirige al ingreso cuando no existe una sesión vigente. */
export default function RutaProtegida() {
  const { autenticado } = usarSesion()
  return autenticado ? <ContenidoRuta /> : <Redireccion to="/login" replace />
}
