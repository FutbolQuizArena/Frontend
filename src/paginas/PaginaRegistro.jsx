import { useRef as usarReferencia, useState as usarEstado } from 'react'
import Boton from '../componentes/Boton.jsx'
import CampoEntrada from '../componentes/CampoEntrada.jsx'
import MarcoAutenticacion from '../componentes/MarcoAutenticacion.jsx'
import { registrar } from '../servicios/servicioAuth.js'
import { validarRegistro } from '../utilidades/validacionesAutenticacion.js'

const datosIniciales = { nombre: '', correo: '', contrasena: '', confirmacionContrasena: '' }

export default function PaginaRegistro() {
  const [datos, establecerDatos] = usarEstado(datosIniciales)
  const [errores, establecerErrores] = usarEstado({})
  const [mensajeError, establecerMensajeError] = usarEstado('')
  const [mensajeExito, establecerMensajeExito] = usarEstado('')
  const [enviando, establecerEnviando] = usarEstado(false)
  const solicitudEnCurso = usarReferencia(false)

  function manejarCambio(evento) {
    const { name: nombre, value: valor } = evento.target
    establecerDatos((anteriores) => ({ ...anteriores, [nombre]: valor }))
    establecerErrores((anteriores) => ({
      ...anteriores,
      [nombre]: '',
      ...(nombre === 'contrasena' ? { confirmacionContrasena: '' } : {}),
    }))
    establecerMensajeError('')
    establecerMensajeExito('')
  }

  async function manejarEnvio(evento) {
    evento.preventDefault()
    if (solicitudEnCurso.current) return

    const nuevosErrores = validarRegistro(datos)
    establecerErrores(nuevosErrores)
    establecerMensajeError('')
    establecerMensajeExito('')

    if (Object.keys(nuevosErrores).length) {
      const primerCampo = ['nombre', 'correo', 'contrasena', 'confirmacionContrasena']
        .find((nombre) => nuevosErrores[nombre])
      evento.currentTarget.elements.namedItem(primerCampo)?.focus()
      return
    }

    solicitudEnCurso.current = true
    establecerEnviando(true)

    try {
      await registrar(datos.nombre.trim(), datos.correo.trim(), datos.contrasena)
      establecerMensajeExito('¡Cuenta creada con éxito! Tu registro en FutbolQuiz Arena está completo.')
      establecerDatos(datosIniciales)
    } catch (error) {
      establecerMensajeError(error.message || 'No pudimos crear tu cuenta. Intentá de nuevo.')
    } finally {
      solicitudEnCurso.current = false
      establecerEnviando(false)
    }
  }

  return (
    <MarcoAutenticacion variante="registro" titulo="Crear cuenta" tituloMovil="Creá tu perfil"
      descripcion="Vas a ingresar con el rol de jugador." descripcionMovil="Un paso más y empezás a competir.">
      <form noValidate onSubmit={manejarEnvio} aria-labelledby="titulo-formulario" aria-busy={enviando}>
        <fieldset className="formulario__campos" disabled={enviando}>
          <legend className="solo-lectores">Datos para crear tu cuenta</legend>
          <CampoEntrada etiqueta="Nombre de usuario" nombre="nombre" valor={datos.nombre} alCambiar={manejarCambio}
            error={errores.nombre} autocompletar="name" ejemplo="Lucas10" simbolo="●" />
          <CampoEntrada etiqueta="Correo electrónico" nombre="correo" tipo="email" valor={datos.correo}
            alCambiar={manejarCambio} error={errores.correo} autocompletar="email" ejemplo="nombre@correo.com" simbolo="@" />
          <CampoEntrada etiqueta="Contraseña" nombre="contrasena" tipo="password" valor={datos.contrasena}
            alCambiar={manejarCambio} error={errores.contrasena} autocompletar="new-password"
            longitudMinima={8} ejemplo="••••••••" simbolo="•" />
          <CampoEntrada etiqueta="Confirmar contraseña" nombre="confirmacionContrasena" tipo="password"
            valor={datos.confirmacionContrasena} alCambiar={manejarCambio}
            error={errores.confirmacionContrasena} autocompletar="new-password" ejemplo="••••••••" simbolo="•" etiquetaMovil="Repetir contraseña" />
        </fieldset>

        <div className="requisito-contrasena">
          <div className="requisito-contrasena__indicador">
            <meter min="0" max="8" value={Math.min(datos.contrasena.length, 8)} aria-label="Caracteres mínimos de la contraseña" />
            <span>{datos.contrasena.length >= 8 ? 'Mínimo cumplido' : `${datos.contrasena.length}/8`}</span>
          </div>
          <p>Mínimo 8 caracteres.</p>
        </div>

        {mensajeError && <p className="mensaje mensaje--error" role="alert">{mensajeError}</p>}
        {mensajeExito && <p className="mensaje mensaje--exito" role="status">{mensajeExito}</p>}

        <Boton tipo="submit" cargando={enviando} textoCargando="Creando cuenta…">Crear mi cuenta</Boton>
      </form>
    </MarcoAutenticacion>
  )
}
