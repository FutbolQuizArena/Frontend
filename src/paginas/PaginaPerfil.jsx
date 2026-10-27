import { useEffect as usarEfecto, useRef as usarReferencia, useState as usarEstado } from 'react'
import { useNavigate as usarNavegacion } from 'react-router-dom'
import Boton from '../componentes/Boton.jsx'
import CampoEntrada from '../componentes/CampoEntrada.jsx'
import MarcoPerfil from '../componentes/MarcoPerfil.jsx'
import { actualizarPerfil, obtenerPerfil } from '../servicios/servicioPerfil.js'
import { esCorreoValido } from '../utilidades/validacionesAutenticacion.js'
import '../estilos/estilosPerfil.css'

const datosIniciales = {
  nombre: '', correo: '', contrasenaActual: '', nuevaContrasena: '', iniciales: 'FQ', puntajeTotal: 0,
}

function validarPerfil(datos) {
  const errores = {}

  if (!datos.nombre.trim()) errores.nombre = 'Ingresá tu nombre.'
  if (!esCorreoValido(datos.correo.trim())) errores.correo = 'Ingresá un correo electrónico válido.'
  if (datos.nuevaContrasena && datos.nuevaContrasena.length < 8) {
    errores.nuevaContrasena = 'La nueva contraseña debe tener al menos 8 caracteres.'
  }
  if (datos.nuevaContrasena && !datos.contrasenaActual) errores.contrasenaActual = 'Ingresá tu contraseña actual.'

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
      .catch((error) => {
        if (estaMontado) establecerMensajeError(error.message || 'No pudimos cargar tus datos. Intentá de nuevo.')
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
        correo: datos.correo.trim(),
        contrasenaActual: datos.contrasenaActual,
        nuevaContrasena: datos.nuevaContrasena,
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
    <MarcoPerfil tituloMovil="Editar perfil" subtituloMovil="Datos personales" perfil={cargando ? null : datos}>
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
            <CampoEntrada etiqueta="Correo electrónico" nombre="correo" tipo="email" valor={datos.correo}
              alCambiar={manejarCambio} error={errores.correo} autocompletar="email" requerido={true} />
            <div id="seguridad"><CampoEntrada etiqueta="Contraseña actual" nombre="contrasenaActual"
              tipo="password" valor={datos.contrasenaActual} alCambiar={manejarCambio} error={errores.contrasenaActual} autocompletar="current-password" requerido={false} /></div>
            <div><CampoEntrada etiqueta="Nueva contraseña (opcional)" nombre="nuevaContrasena"
              tipo="password" valor={datos.nuevaContrasena} alCambiar={manejarCambio} error={errores.nuevaContrasena}
              autocompletar="new-password" requerido={false} /></div>
          </fieldset>
          <p className="perfil__nota perfil__solo-escritorio">Tu historial y puntaje no cambian al editar los datos.</p>
          {mensajeError && <p className="mensaje mensaje--error" role="alert">{mensajeError}</p>}
          {mensajeExito && <p className="mensaje mensaje--exito"><output>{mensajeExito}</output></p>}
          <div className="perfil__acciones">
            <Boton tipo="submit" cargando={guardando} textoCargando="Guardando cambios…">Guardar cambios</Boton>
            <button type="button" className="perfil__cancelar" onClick={() => navegar('/perfil')} disabled={guardando}>Cancelar</button>
          </div>
        </form>
      </main>
    </MarcoPerfil>
  )
}
