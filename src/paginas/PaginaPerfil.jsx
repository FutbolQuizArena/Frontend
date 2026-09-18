import { useEffect as usarEfecto, useRef as usarReferencia, useState as usarEstado } from 'react'
import { Link as Enlace, NavLink as EnlaceNavegacion, useNavigate as usarNavegacion } from 'react-router-dom'
import Boton from '../componentes/Boton.jsx'
import BotonCerrarSesion from '../componentes/BotonCerrarSesion.jsx'
import CampoEntrada from '../componentes/CampoEntrada.jsx'
import CampoTexto from '../componentes/CampoTexto.jsx'
import { actualizarPerfil, obtenerPerfil } from '../servicios/servicioPerfil.js'
import '../estilos/estilosPerfil.css'

const datosIniciales = {
  nombre: '', usuario: '', correo: '', bio: '', contrasenaActual: '', nuevaContrasena: '', iniciales: 'FQ', puntajeTotal: 0,
}

const enlaces = [
  { destino: '/home', titulo: 'Inicio', simbolo: '⌂' },
  { destino: '/partida-individual', titulo: 'Jugar', simbolo: '▶' },
  { destino: '/torneos', titulo: 'Torneos', simbolo: '◆' },
  { destino: '/ranking', titulo: 'Ranking', simbolo: '★' },
  { destino: '/perfil', titulo: 'Perfil', simbolo: '●' },
]

function validarPerfil(datos) {
  const errores = {}

  if (!datos.nombre.trim()) errores.nombre = 'Ingresá tu nombre.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo.trim())) errores.correo = 'Ingresá un correo electrónico válido.'
  if (datos.nuevaContrasena && datos.nuevaContrasena.length < 8) {
    errores.nuevaContrasena = 'La nueva contraseña debe tener al menos 8 caracteres.'
  }

  return errores
}

export default function PaginaPerfil() {
  const [datos, establecerDatos] = usarEstado(datosIniciales)
  const [errores, establecerErrores] = usarEstado({})
  const [mensajeError, establecerMensajeError] = usarEstado('')
  const [mensajeExito, establecerMensajeExito] = usarEstado('')
  const [cargando, establecerCargando] = usarEstado(true)
  const [guardando, establecerGuardando] = usarEstado(false)
  const solicitudEnCurso = usarReferencia(false)
  const navegar = usarNavegacion()

  usarEfecto(() => {
    let estaMontado = true

    obtenerPerfil()
      .then((perfil) => {
        if (estaMontado) establecerDatos((anteriores) => ({ ...anteriores, ...perfil }))
      })
      .catch(() => {
        if (estaMontado) establecerMensajeError('No pudimos cargar tus datos. Intentá de nuevo.')
      })
      .finally(() => {
        if (estaMontado) establecerCargando(false)
      })

    return () => { estaMontado = false }
  }, [])

  function manejarCambio(evento) {
    const { name: nombre, value: valor } = evento.target
    establecerDatos((anteriores) => ({ ...anteriores, [nombre]: valor }))
    establecerErrores((anteriores) => ({ ...anteriores, [nombre]: '' }))
    establecerMensajeError('')
    establecerMensajeExito('')
  }

  async function manejarEnvio(evento) {
    evento.preventDefault()
    if (solicitudEnCurso.current) return

    const nuevosErrores = validarPerfil(datos)
    establecerErrores(nuevosErrores)
    establecerMensajeError('')
    establecerMensajeExito('')

    if (Object.keys(nuevosErrores).length) {
      evento.currentTarget.elements.namedItem(Object.keys(nuevosErrores)[0])?.focus()
      return
    }

    solicitudEnCurso.current = true
    establecerGuardando(true)

    try {
      const perfilActualizado = await actualizarPerfil({
        nombre: datos.nombre.trim(),
        usuario: datos.usuario.trim(),
        correo: datos.correo.trim(),
        bio: datos.bio.trim(),
      })
      establecerDatos((anteriores) => ({ ...anteriores, ...perfilActualizado, contrasenaActual: '', nuevaContrasena: '' }))
      establecerMensajeExito('Tus cambios se guardaron correctamente.')
    } catch (error) {
      establecerMensajeError(error.message || 'No pudimos guardar tus cambios. Intentá de nuevo.')
    } finally {
      solicitudEnCurso.current = false
      establecerGuardando(false)
    }
  }

  return (
    <div className="perfil">
      <a className="enlace-salto" href="#contenido-perfil">Ir al contenido</a>
      <aside className="perfil__lateral">
        <Enlace className="marca perfil__marca" to="/home" aria-label="FutbolQuiz Arena">
          FUTBOLQUIZ<span className="marca__arena">ARENA</span>
        </Enlace>
        <nav className="perfil__navegacion" aria-label="Navegación principal">
          {enlaces.map(({ destino, titulo, simbolo }) => (
            <EnlaceNavegacion key={destino} to={destino} className={({ isActive: activo }) => `perfil__enlace${activo ? ' perfil__enlace--activo' : ''}`}>
              <span aria-hidden="true">{simbolo}</span>{titulo}
            </EnlaceNavegacion>
          ))}
        </nav>
        <div className="perfil__acumulado"><p>PUNTAJE ACUMULADO</p><span>Jugador · {datos.puntajeTotal.toLocaleString('es-AR')} pts</span></div>
      </aside>

      <header className="perfil__cabecera">
        <span className="perfil__escudo" aria-label="FutbolQuiz Arena">FQ</span>
        <div className="perfil__titulo-movil"><strong>Editar perfil</strong><span>Datos personales</span></div>
        <span className="perfil__avatar" aria-label="Avatar del perfil">{datos.iniciales}</span>
        <BotonCerrarSesion />
      </header>

      <main className="perfil__contenido" id="contenido-perfil">
        <div className="perfil__introduccion">
          <h1>Editar perfil</h1>
          <p>Modificá tus datos básicos de la cuenta.</p>
        </div>
        <form className="perfil__tarjeta" noValidate onSubmit={manejarEnvio} aria-busy={cargando || guardando}>
          <div className="perfil__avatar-movil" aria-hidden="true">{datos.iniciales}</div>
          <button type="button" className="perfil__cambiar-avatar">Cambiar avatar</button>
          <h2>Datos personales</h2>
          <fieldset className="perfil__campos" disabled={cargando || guardando}>
            <legend className="solo-lectores">Datos del perfil</legend>
            <CampoEntrada etiqueta="Nombre" nombre="nombre" valor={datos.nombre} alCambiar={manejarCambio}
              error={errores.nombre} autocompletar="name" requerido={true} />
            <div className="perfil__solo-movil"><CampoEntrada etiqueta="Usuario" nombre="usuario" valor={datos.usuario}
              alCambiar={manejarCambio} autocompletar="username" requerido={false} /></div>
            <CampoEntrada etiqueta="Correo electrónico" nombre="correo" tipo="email" valor={datos.correo}
              alCambiar={manejarCambio} error={errores.correo} autocompletar="email" requerido={true} />
            <div className="perfil__solo-escritorio"><CampoEntrada etiqueta="Contraseña actual" nombre="contrasenaActual"
              tipo="password" valor={datos.contrasenaActual} alCambiar={manejarCambio} autocompletar="current-password" requerido={false} /></div>
            <div className="perfil__solo-escritorio"><CampoEntrada etiqueta="Nueva contraseña (opcional)" nombre="nuevaContrasena"
              tipo="password" valor={datos.nuevaContrasena} alCambiar={manejarCambio} error={errores.nuevaContrasena}
              autocompletar="new-password" requerido={false} /></div>
            <div className="perfil__solo-movil"><CampoTexto etiqueta="Bio" nombre="bio" valor={datos.bio}
              alCambiar={manejarCambio} ejemplo="Contanos sobre vos" /></div>
          </fieldset>
          <p className="perfil__nota perfil__solo-escritorio">Tu historial y puntaje no cambian al editar los datos.</p>
          {mensajeError && <p className="mensaje mensaje--error" role="alert">{mensajeError}</p>}
          {mensajeExito && <p className="mensaje mensaje--exito" role="status">{mensajeExito}</p>}
          <div className="perfil__acciones">
            <Boton tipo="submit" cargando={guardando} textoCargando="Guardando cambios…">Guardar cambios</Boton>
            <button type="button" className="perfil__cancelar" onClick={() => navegar('/home')} disabled={guardando}>Cancelar</button>
          </div>
        </form>
      </main>
    </div>
  )
}
