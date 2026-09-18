import { Navigate as Redireccion, Outlet as ContenidoRuta } from 'react-router-dom'
import { usarSesion } from '../contextos/ContextoSesion.jsx'

export default function RutaPublica() {
  const { autenticado } = usarSesion()
  return autenticado ? <Redireccion to="/home" replace /> : <ContenidoRuta />
}
