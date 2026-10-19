import { useRef as usarReferencia, useState as usarEstado } from 'react'
import { useNavigate as usarNavegacion } from 'react-router-dom'
import { usarSesion } from '../contextos/ContextoSesion.jsx'
import Boton from '../componentes/Boton.jsx'
import CampoEntrada from '../componentes/CampoEntrada.jsx'
import MarcoAutenticacion from '../componentes/MarcoAutenticacion.jsx'
import { iniciarSesion } from '../servicios/servicioAuth.js'
import { validarInicioSesion } from '../utilidades/validacionesAutenticacion.js'

export default function PaginaLogin() {
  const [datos, establecerDatos] = usarEstado({ correo: '', contrasena: '' })
  const [errores, establecerErrores] = usarEstado({})
  const [mensajeError, establecerMensajeError] = usarEstado('')
  const [mantenerSesion, establecerMantenerSesion] = usarEstado(false)
  const { abrirSesion } = usarSesion()
  const navegar = usarNavegacion()
  const [enviando, establecerEnviando] = usarEstado(false)
  const solicitudEnCurso = usarReferencia(false)

  function manejarCambio(evento) {
    const { name: nombre, value: valor } = evento.target
    establecerDatos((anteriores) => ({ ...anteriores, [nombre]: valor }))
    establecerErrores((anteriores) => ({ ...anteriores, [nombre]: '' }))
    establecerMensajeError('')
  }

  async function manejarEnvio(evento) {
    evento.preventDefault()
    if (solicitudEnCurso.current) return

    const nuevosErrores = validarInicioSesion(datos)
    establecerErrores(nuevosErrores)
    establecerMensajeError('')

    if (Object.keys(nuevosErrores).length) {
      evento.currentTarget.elements.namedItem(Object.keys(nuevosErrores)[0])?.focus()
      return
    }

    solicitudEnCurso.current = true
    establecerEnviando(true)

    try {
      const respuesta = await iniciarSesion(datos.correo.trim(), datos.contrasena)
      abrirSesion(respuesta, mantenerSesion)
      navegar(respuesta.vistaPreviaAdmin ? '/admin' : '/home', { replace: true })
    } catch (error) {
      establecerMensajeError(error.message || 'No pudimos iniciar sesión. Intentá de nuevo.')
    } finally {
      solicitudEnCurso.current = false
      establecerEnviando(false)
    }
  }

  return (
    <MarcoAutenticacion titulo="Volvé a la cancha" tituloMovil="Iniciar sesión"
      descripcion="Ingresá con tu cuenta para continuar." descripcionMovil="Usá tu cuenta para continuar">
      <form noValidate onSubmit={manejarEnvio} aria-labelledby="titulo-formulario" aria-busy={enviando}>
        <fieldset className="formulario__campos" disabled={enviando}>
          <legend className="solo-lectores">Datos para iniciar sesión</legend>
          <CampoEntrada etiqueta="Correo electrónico" nombre="correo" tipo="email" valor={datos.correo}
            alCambiar={manejarCambio} error={errores.correo} autocompletar="username" ejemplo="nombre@correo.com" simbolo="@" />
          <CampoEntrada etiqueta="Contraseña" nombre="contrasena" tipo="password" valor={datos.contrasena}
            alCambiar={manejarCambio} error={errores.contrasena} autocompletar="current-password" ejemplo="••••••••" simbolo="•" />
        </fieldset>

        <label className="recordar-sesion">
          <input type="checkbox" checked={mantenerSesion} onChange={(evento) => establecerMantenerSesion(evento.target.checked)} disabled={enviando} /> Mantener sesión iniciada
        </label>

        {mensajeError && <p className="mensaje mensaje--error" role="alert">{mensajeError}</p>}

        <Boton tipo="submit" cargando={enviando} textoCargando="Ingresando…">Ingresar</Boton>
      </form>
    </MarcoAutenticacion>
  )
}
