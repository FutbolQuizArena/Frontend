import { useRef as usarReferencia, useState as usarEstado } from 'react'
import { Link as Enlace, NavLink as EnlaceNavegacion, useNavigate as usarNavegacion } from 'react-router-dom'
import Boton from '../componentes/Boton.jsx'
import CampoEntrada from '../componentes/CampoEntrada.jsx'
import { unirseATorneo } from '../servicios/servicioTorneos.js'
import '../estilos/estilosUnirseTorneo.css'

const enlaces = [
  { destino: '/home', titulo: 'Inicio', simbolo: '⌂' },
  { destino: '/partida-individual', titulo: 'Jugar', simbolo: '▶' },
  { destino: '/torneos', titulo: 'Torneos', simbolo: '◆' },
  { destino: '/ranking', titulo: 'Ranking', simbolo: '★' },
  { destino: '/perfil', titulo: 'Perfil', simbolo: '●' },
]

function normalizarCodigo(codigo) {
  return codigo.replace(/\s+/g, '').toUpperCase().slice(0, 6)
}

function validarCodigo(codigo) {
  if (!codigo) return 'Ingresá el código del torneo.'
  if (!/^[A-Z0-9]{6}$/.test(codigo)) return 'El código debe tener 6 letras o números.'
  return ''
}

export default function PaginaUnirseTorneo() {
  const navegar = usarNavegacion()
  const [datos, establecerDatos] = usarEstado({ codigo: '', contrasena: '' })
  const [errorCodigo, establecerErrorCodigo] = usarEstado('')
  const [mensajeError, establecerMensajeError] = usarEstado('')
  const [mensajeExito, establecerMensajeExito] = usarEstado('')
  const [ingresando, establecerIngresando] = usarEstado(false)
  const solicitudEnCurso = usarReferencia(false)

  function manejarCodigo(evento) {
    establecerDatos((anteriores) => ({ ...anteriores, codigo: normalizarCodigo(evento.target.value) }))
    establecerErrorCodigo('')
    establecerMensajeError('')
    establecerMensajeExito('')
  }

  function manejarContrasena(evento) {
    establecerDatos((anteriores) => ({ ...anteriores, contrasena: evento.target.value }))
    establecerMensajeError('')
    establecerMensajeExito('')
  }

  async function manejarEnvio(evento) {
    evento.preventDefault()
    if (solicitudEnCurso.current) return

    const codigo = normalizarCodigo(datos.codigo)
    const nuevoErrorCodigo = validarCodigo(codigo)
    establecerErrorCodigo(nuevoErrorCodigo)
    establecerMensajeError('')
    establecerMensajeExito('')

    if (nuevoErrorCodigo) {
      evento.currentTarget.elements.namedItem('codigo')?.focus()
      return
    }

    solicitudEnCurso.current = true
    establecerIngresando(true)

    try {
      const resultado = await unirseATorneo(codigo, datos.contrasena)
      establecerMensajeExito(`Te uniste a “${resultado.nombre}”. Abriendo la sala…`)
      await new Promise((resolver) => setTimeout(resolver, 600))
      navegar(`/torneos/${resultado.idTorneo}/sala`)
    } catch (error) {
      establecerMensajeError(error.message || 'No pudimos ingresar al torneo. Intentá de nuevo.')
    } finally {
      solicitudEnCurso.current = false
      establecerIngresando(false)
    }
  }

  return (
    <div className="unirse-torneo">
      <a className="enlace-salto" href="#contenido-unirse-torneo">Ir al contenido</a>
      <aside className="unirse-torneo__lateral">
        <Enlace className="marca unirse-torneo__marca" to="/home" aria-label="FutbolQuiz Arena">FUTBOLQUIZ<span className="marca__arena">ARENA</span></Enlace>
        <nav className="unirse-torneo__navegacion" aria-label="Navegación principal">
          {enlaces.map(({ destino, titulo, simbolo }) => (
            <EnlaceNavegacion key={destino} to={destino} className={({ isActive: activo }) => `unirse-torneo__enlace${activo ? ' unirse-torneo__enlace--activo' : ''}`}>
              <span aria-hidden="true">{simbolo}</span>{titulo}
            </EnlaceNavegacion>
          ))}
        </nav>
        <div className="unirse-torneo__acumulado"><p>PUNTAJE ACUMULADO</p><span>Jugador · 2.450 pts</span></div>
      </aside>

      <header className="unirse-torneo__cabecera">
        <span className="unirse-torneo__escudo" aria-label="FutbolQuiz Arena">FQ</span>
        <div className="unirse-torneo__titulo-movil"><strong>Unirse a torneo</strong><span>Ingresá una invitación</span></div>
        <Enlace className="unirse-torneo__avatar" to="/perfil" aria-label="Ver mi perfil"><span>LM</span></Enlace>
      </header>

      <main className="unirse-torneo__contenido" id="contenido-unirse-torneo">
        <div className="unirse-torneo__introduccion">
          <h1>Unirse a un torneo</h1>
          <p>Ingresá el código compartido por el creador.</p>
        </div>

        <div className="unirse-torneo__emblema" aria-hidden="true"><span>◆</span><small>CÓDIGO</small></div>
        <div className="unirse-torneo__presentacion-movil">
          <h1>Entrá a una sala</h1>
          <p>Pedile al organizador el código de 6 caracteres.</p>
        </div>

        <form className="unirse-torneo__tarjeta" noValidate onSubmit={manejarEnvio}>
          <div className="unirse-torneo__encabezado-formulario">
            <h2>Código de acceso</h2>
            <p>El código tiene 6 caracteres.</p>
          </div>

          <fieldset disabled={ingresando}>
            <legend className="solo-lectores">Invitación al torneo</legend>
            <div className="unirse-torneo__codigo">
              <CampoEntrada etiqueta="Código de acceso" etiquetaMovil="Código del torneo" nombre="codigo" valor={datos.codigo} alCambiar={manejarCodigo}
                error={errorCodigo} ejemplo="FQA8K2" autocompletar="off" />
            </div>
            <div className="unirse-torneo__contrasena">
              <CampoEntrada etiqueta="Contraseña (si corresponde)" nombre="contrasena" tipo="password" valor={datos.contrasena} alCambiar={manejarContrasena}
                ejemplo="••••••••" autocompletar="current-password" requerido={false} ayuda="Dejala vacía si el torneo no tiene contraseña." />
            </div>
            <p className="unirse-torneo__resumen">El backend verificará el código, el cupo y la contraseña del torneo.</p>
          </fieldset>

          {mensajeError && <p className="mensaje mensaje--error" role="alert">{mensajeError}</p>}
          {mensajeExito && <p className="mensaje mensaje--exito" role="status">{mensajeExito}</p>}
          <Boton tipo="submit" cargando={ingresando} textoCargando="Ingresando…">Unirme al torneo</Boton>
        </form>
      </main>
    </div>
  )
}
