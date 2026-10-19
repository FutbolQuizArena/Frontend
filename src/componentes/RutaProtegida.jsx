import { Navigate as Redireccion, Outlet as ContenidoRuta } from 'react-router-dom'
import { usarSesion } from '../contextos/ContextoSesion.jsx'

export default function RutaProtegida() {
  const { autenticado } = usarSesion()
  return autenticado ? <ContenidoRuta /> : <Redireccion to="/login" replace />
}
