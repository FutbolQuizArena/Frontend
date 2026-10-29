import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import MarcoTorneo from '../componentes/MarcoTorneo.jsx'
import { obtenerPerfil } from '../servicios/servicioPerfil.js'
import { crearUsuarioAdmin, actualizarUsuarioAdmin, obtenerUsuarioAdmin } from '../servicios/servicioUsuariosAdmin.js'
import { esSesionAdminPrueba, obtenerToken } from '../servicios/servicioSesion.js'
import { navegarConManejo } from '../utilidades/navegacionConManejo.js'
import '../estilos/estilosSalaDetalleTorneo.css'
import '../estilos/estilosPreguntasAdmin.css'
import '../estilos/estilosMarcoAdmin.css'
import '../estilos/estilosUsuariosAdmin.css'

const datosIniciales = { nombre: '', email: '', rol: 'JUGADOR', password: '' }

export default function PaginaFormularioUsuarioAdmin() {
  const { idUsuario } = useParams()
  const [parametros] = useSearchParams()
  const navegar = useNavigate()
  const vistaPrevia = import.meta.env.DEV && parametros.get('vistaPrevia') === '1'
  const datosEjemplo = import.meta.env.DEV && (vistaPrevia || esSesionAdminPrueba(obtenerToken()))
  const sufijo = vistaPrevia ? '?vistaPrevia=1' : ''
  const regreso = `/admin/usuarios${sufijo}`
  const [perfilActual, setPerfilActual] = useState(null)
  const [datos, setDatos] = useState(datosIniciales)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [errorCarga, setErrorCarga] = useState('')
  const [errorFormulario, setErrorFormulario] = useState('')

  useEffect(() => {
    let vigente = true
    async function cargar() {
      try {
        const perfil = vistaPrevia ? { id: 1, rol: 'ADMINISTRADOR' } : await obtenerPerfil()
        if (!vigente) return
        setPerfilActual(perfil)
        if (perfil.rol !== 'ADMINISTRADOR') return
        if (idUsuario) {
          const usuario = await obtenerUsuarioAdmin(idUsuario, { vistaPrevia })
          if (vigente) setDatos({ nombre: usuario.nombre, email: usuario.email, rol: usuario.rol, password: '' })
        }
      } catch (error_) {
        if (vigente) setErrorCarga(error_.message || 'No pudimos cargar el usuario.')
      } finally {
        if (vigente) setCargando(false)
      }
    }
    void cargar()
    return () => { vigente = false }
  }, [idUsuario, vistaPrevia])

  async function guardar(evento) {
    evento.preventDefault()
    if (!datos.nombre.trim() || !datos.email.trim() || (!idUsuario && datos.password.length < 6)) {
      setErrorFormulario('Completá nombre, correo y una contraseña de al menos 6 caracteres.')
      return
    }
    setErrorFormulario('')
    setGuardando(true)
    try {
      const basicos = { nombre: datos.nombre.trim(), email: datos.email.trim(), rol: datos.rol }
      if (idUsuario) await actualizarUsuarioAdmin(idUsuario, basicos, { vistaPrevia })
      else await crearUsuarioAdmin({ ...basicos, password: datos.password }, { vistaPrevia })
      navegarConManejo(navegar, regreso, {
        state: { avisoUsuario: datosEjemplo ? 'Usuario guardado temporalmente.' : 'Usuario guardado.' },
      })
    } catch (error_) {
      setErrorFormulario(error_.message || 'No pudimos guardar el usuario.')
    } finally {
      setGuardando(false)
    }
  }

  const titulo = idUsuario ? 'Editar usuario' : 'Nuevo usuario'
  const esCuentaPropia = idUsuario && Number(idUsuario) === Number(perfilActual?.id)

  return <MarcoTorneo administrador sufijoAdmin={sufijo} tituloMovil={titulo} subtituloMovil="Administración">
    <div className="admin-preguntas admin-formulario">
      <header className="admin-preguntas__encabezado"><div><h1>{titulo}</h1><p>Gestioná los datos básicos de la cuenta.</p></div><Link to={regreso}>Volver a usuarios</Link></header>
      {cargando && <p><output>Cargando usuario…</output></p>}
      {!cargando && errorCarga && <p className="admin-preguntas__estado" role="alert">{errorCarga}</p>}
      {!cargando && !errorCarga && perfilActual?.rol !== 'ADMINISTRADOR' && <p className="admin-preguntas__estado" role="alert">Solo los administradores pueden gestionar usuarios.</p>}
      {!cargando && !errorCarga && perfilActual?.rol === 'ADMINISTRADOR' && <form className="admin-formulario__panel" onSubmit={(evento) => { void guardar(evento) }}>
        <label>Nombre<input type="text" value={datos.nombre} onChange={(evento) => setDatos({ ...datos, nombre: evento.target.value })} maxLength="100" required autoComplete="name" /></label>
        <label>Correo electrónico<input type="email" value={datos.email} onChange={(evento) => setDatos({ ...datos, email: evento.target.value })} maxLength="255" required autoComplete="email" /></label>
        {!idUsuario && <label>Contraseña inicial<input type="password" value={datos.password} onChange={(evento) => setDatos({ ...datos, password: evento.target.value })} minLength="6" required autoComplete="new-password" /></label>}
        <label>Rol<select value={datos.rol} onChange={(evento) => setDatos({ ...datos, rol: evento.target.value })} disabled={esCuentaPropia}><option value="JUGADOR">Jugador</option><option value="ADMINISTRADOR">Administrador</option></select></label>
        {esCuentaPropia && <p>Tu propio rol de administrador no se puede cambiar desde esta pantalla.</p>}
        {errorFormulario && <p className="admin-formulario__error" role="alert">{errorFormulario}</p>}
        {datosEjemplo && <p className="admin-formulario__temporal">Datos de prueba: los cambios se pierden al recargar.</p>}
        <div className="admin-formulario__acciones"><Link to={regreso}>Cancelar</Link><button type="submit" disabled={guardando}>{guardando ? 'Guardando…' : idUsuario ? 'Guardar cambios' : 'Crear usuario'}</button></div>
      </form>}
    </div>
  </MarcoTorneo>
}
