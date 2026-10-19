import { useRef as usarReferencia, useState as usarEstado } from 'react'
import { Link as Enlace, NavLink as EnlaceNavegacion, useNavigate as usarNavegacion } from 'react-router-dom'
import Boton from '../componentes/Boton.jsx'
import CampoEntrada from '../componentes/CampoEntrada.jsx'
import { crearTorneo } from '../servicios/servicioTorneos.js'
import '../estilos/estilosCrearTorneo.css'

const cantidadesPermitidas = [4, 8, 16]
const enlaces = [
  { destino: '/home', titulo: 'Inicio', simbolo: '⌂' },
  { destino: '/partida-individual', titulo: 'Jugar', simbolo: '▶' },
  { destino: '/torneos', titulo: 'Torneos', simbolo: '◆' },
  { destino: '/ranking', titulo: 'Ranking', simbolo: '★' },
  { destino: '/perfil', titulo: 'Perfil', simbolo: '●' },
]

function validarTorneo(datosTorneo) {
  const errores = {}

  if (!datosTorneo.nombre.trim()) errores.nombre = 'Ingresá el nombre del torneo.'
  if (!cantidadesPermitidas.includes(datosTorneo.cantidadParticipantes)) {
    errores.cantidadParticipantes = 'Elegí una cantidad válida de jugadores.'
  }

  return errores
}

export default function PaginaCrearTorneo() {
  const navegar = usarNavegacion()
  const [datos, establecerDatos] = usarEstado({ nombre: '', cantidadParticipantes: 8, contrasena: '' })
  const [errores, establecerErrores] = usarEstado({})
  const [mensajeError, establecerMensajeError] = usarEstado('')
  const [creando, establecerCreando] = usarEstado(false)
  const solicitudEnCurso = usarReferencia(false)

  function manejarCambio(evento) {
    const { name: nombre, value: valor } = evento.target
    establecerDatos((anteriores) => ({ ...anteriores, [nombre]: valor }))
    establecerErrores((anteriores) => ({ ...anteriores, [nombre]: '' }))
    establecerMensajeError('')
  }

  function seleccionarCantidad(cantidadParticipantes) {
    establecerDatos((anteriores) => ({ ...anteriores, cantidadParticipantes }))
    establecerErrores((anteriores) => ({ ...anteriores, cantidadParticipantes: '' }))
    establecerMensajeError('')
  }

  async function manejarEnvio(evento) {
    evento.preventDefault()
    if (solicitudEnCurso.current) return

    const nuevosErrores = validarTorneo(datos)
    establecerErrores(nuevosErrores)
    establecerMensajeError('')

    if (Object.keys(nuevosErrores).length) {
      if (nuevosErrores.nombre) evento.currentTarget.elements.namedItem('nombre')?.focus()
      return
    }

    solicitudEnCurso.current = true
    establecerCreando(true)

    try {
      const resultado = await crearTorneo({
        nombre: datos.nombre.trim(),
        cantidadParticipantes: datos.cantidadParticipantes,
        contrasena: datos.contrasena,
      })
      if (!resultado.idTorneo) throw new Error('El servidor no devolvió el ID del torneo creado.')
      navegar(`/torneos/${resultado.idTorneo}/sala`, { replace: true })
    } catch (error) {
      establecerMensajeError(error.message || 'No pudimos crear el torneo. Intentá de nuevo.')
    } finally {
      solicitudEnCurso.current = false
      establecerCreando(false)
    }
  }

  return (
    <div className="crear-torneo">
      <a className="enlace-salto" href="#contenido-crear-torneo">Ir al contenido</a>
      <aside className="crear-torneo__lateral">
        <Enlace className="marca crear-torneo__marca" to="/home" aria-label="FutbolQuiz Arena">
          FUTBOLQUIZ<span className="marca__arena">ARENA</span>
        </Enlace>
        <nav className="crear-torneo__navegacion" aria-label="Navegación principal">
          {enlaces.map(({ destino, titulo, simbolo }) => (
            <EnlaceNavegacion key={destino} to={destino} className={({ isActive: activo }) => `crear-torneo__enlace${activo ? ' crear-torneo__enlace--activo' : ''}`}>
              <span aria-hidden="true">{simbolo}</span>{titulo}
            </EnlaceNavegacion>
          ))}
        </nav>
        <div className="crear-torneo__acumulado"><p>PUNTAJE ACUMULADO</p><span>Jugador · 2.450 pts</span></div>
      </aside>

      <header className="crear-torneo__cabecera">
        <span className="crear-torneo__escudo" aria-label="FutbolQuiz Arena">FQ</span>
        <div className="crear-torneo__titulo-movil"><strong>Crear torneo</strong><span>Configuración</span></div>
        <Enlace className="crear-torneo__avatar" to="/perfil" aria-label="Ver mi perfil">LM</Enlace>
      </header>

      <main className="crear-torneo__contenido" id="contenido-crear-torneo">
        <div className="crear-torneo__introduccion">
          <p className="crear-torneo__sobretitulo">NUEVA COMPETENCIA</p>
          <h1><span className="crear-torneo__solo-escritorio">Crear torneo</span><span className="crear-torneo__solo-movil">Armá tu torneo</span></h1>
          <p><span className="crear-torneo__solo-escritorio">Definí los datos de la competencia y compartí el código.</span><span className="crear-torneo__solo-movil">Definí las reglas; después invitá a tus amigos.</span></p>
        </div>

        <form className="crear-torneo__tarjeta" noValidate onSubmit={manejarEnvio}>
          <h2>Información del torneo</h2>
          <fieldset className="crear-torneo__campos" disabled={creando}>
            <legend className="solo-lectores">Configuración del torneo</legend>
            <CampoEntrada etiqueta="Nombre" etiquetaMovil="Nombre del torneo" nombre="nombre" valor={datos.nombre}
              alCambiar={manejarCambio} error={errores.nombre} ejemplo="Copa de Amigos" autocompletar="off" />

            <div className="crear-torneo__cantidad">
              <p id="etiqueta-cantidad">Cantidad de <span className="crear-torneo__solo-escritorio">participantes</span><span className="crear-torneo__solo-movil">jugadores</span></p>
              <div className="crear-torneo__opciones" role="group" aria-labelledby="etiqueta-cantidad" aria-describedby={errores.cantidadParticipantes ? 'error-cantidad' : undefined}>
                {cantidadesPermitidas.map((cantidad) => (
                  <button key={cantidad} type="button" className={datos.cantidadParticipantes === cantidad ? 'crear-torneo__opcion crear-torneo__opcion--activa' : 'crear-torneo__opcion'}
                    aria-pressed={datos.cantidadParticipantes === cantidad} onClick={() => seleccionarCantidad(cantidad)}>
                    {cantidad}<span className="crear-torneo__solo-escritorio"> jugadores</span>
                  </button>
                ))}
              </div>
              {errores.cantidadParticipantes && <p className="campo__error" id="error-cantidad">{errores.cantidadParticipantes}</p>}
            </div>

            <CampoEntrada etiqueta="Contraseña de acceso (opcional)" nombre="contrasena" tipo="password" valor={datos.contrasena}
              alCambiar={manejarCambio} ejemplo="Ingresá una contraseña o dejá vacío" autocompletar="new-password" requerido={false} />

            <div className="crear-torneo__codigo crear-torneo__solo-movil">
              <p>CÓDIGO DE ACCESO</p>
              <output>Se genera automáticamente al crear</output>
            </div>

            <div className="crear-torneo__informacion">
              <span aria-hidden="true" className="crear-torneo__icono-informacion"><span className="crear-torneo__solo-escritorio">ⓘ</span><span className="crear-torneo__solo-movil">✓</span></span>
              <p><strong className="crear-torneo__solo-movil">Eliminación directa</strong><span className="crear-torneo__solo-escritorio">El código se genera automáticamente. Los cruces se arman al completar {datos.cantidadParticipantes} jugadores.</span><span className="crear-torneo__solo-movil">Una derrota elimina al jugador.</span></p>
            </div>
          </fieldset>

          {mensajeError && <p className="mensaje mensaje--error" role="alert">{mensajeError}</p>}
          <Boton tipo="submit" cargando={creando} textoCargando="Creando torneo…">
            <span className="crear-torneo__solo-escritorio">Crear torneo</span><span className="crear-torneo__solo-movil">Crear y obtener código</span>
          </Boton>
        </form>
      </main>
    </div>
  )
}
