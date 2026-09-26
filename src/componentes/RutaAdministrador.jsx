import { useEffect, useState } from 'react'
import { Link, Outlet, useSearchParams } from 'react-router-dom'
import { usarSesion } from '../contextos/ContextoSesion.jsx'
import { obtenerPerfil } from '../servicios/servicioPerfil.js'

export default function RutaAdministrador() {
  const { token } = usarSesion()
  const [parametros] = useSearchParams()
  const vistaPrevia = import.meta.env.DEV && parametros.get('vistaPrevia') === '1'
  const [estado, establecerEstado] = useState('cargando')
  const [mensaje, establecerMensaje] = useState('')
  const [intento, establecerIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    establecerEstado('cargando')
    if (vistaPrevia) {
      establecerEstado('autorizado')
      return () => { vigente = false }
    }
    obtenerPerfil()
      .then((perfil) => { if (vigente) establecerEstado(perfil.rol === 'ADMINISTRADOR' ? 'autorizado' : 'denegado') })
      .catch((error) => {
        if (vigente) {
          establecerMensaje(error.message || 'No pudimos verificar tu cuenta.')
          establecerEstado('error')
        }
      })
    return () => { vigente = false }
  }, [token, vistaPrevia, intento])

  if (estado === 'autorizado') return <Outlet />
  return <main className="pagina-no-encontrada">
    <p className="sobretitulo">FUTBOLQUIZ ADMIN</p>
    {estado === 'cargando' && <p role="status">Verificando permisos…</p>}
    {estado === 'denegado' && <><h1>Acceso restringido</h1><p role="alert">Solo los administradores pueden acceder a esta sección.</p><Link to="/home">Volver al inicio</Link></>}
    {estado === 'error' && <><h1>No pudimos verificar tu cuenta</h1><p role="alert">{mensaje}</p><button type="button" onClick={() => establecerIntento((actual) => actual + 1)}>Reintentar</button><Link to="/home">Volver al inicio</Link></>}
  </main>
}
