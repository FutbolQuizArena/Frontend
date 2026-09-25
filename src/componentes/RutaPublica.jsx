import { Navigate as Redireccion, Outlet as ContenidoRuta } from 'react-router-dom'
import { usarSesion } from '../contextos/ContextoSesion.jsx'
import { esSesionAdminPrueba } from '../servicios/servicioSesion.js'

export default function RutaPublica() {
  const { autenticado, token } = usarSesion()
  return autenticado ? <Redireccion to={esSesionAdminPrueba(token) ? '/admin' : '/home'} replace /> : <ContenidoRuta />
}
