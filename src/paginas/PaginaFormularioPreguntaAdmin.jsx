import { useEffect, useState } from 'react'
import { navegarConManejo } from '../utilidades/navegacionConManejo.js'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import MarcoTorneo from '../componentes/MarcoTorneo.jsx'
import { obtenerPerfil } from '../servicios/servicioPerfil.js'
import { esSesionAdminPrueba, obtenerToken } from '../servicios/servicioSesion.js'
import { actualizarPreguntaAdmin, crearPreguntaAdmin, obtenerPreguntaAdmin } from '../servicios/servicioPreguntasAdmin.js'
import { obtenerCategoriasAdmin } from '../servicios/servicioCategoriasAdmin.js'
import '../estilos/estilosPreguntasAdmin.css'
import '../estilos/estilosMarcoAdmin.css'

const letrasOpciones = ['A', 'B', 'C', 'D']

const formularioVacio = { enunciado: '', categoria: '', dificultad: 'Fácil', opciones: ['', '', '', ''], respuestaCorrecta: null }

function obtenerTextoBotonPregunta(guardando, idPregunta) {
  if (guardando) return 'Guardando…'
  if (idPregunta) return 'Guardar cambios'
  return 'Guardar pregunta'
}

export default function PaginaFormularioPreguntaAdmin() {
  const { idPregunta } = useParams()
  const [parametros] = useSearchParams()
  const navegar = useNavigate()
  const vistaPrevia = import.meta.env.DEV && parametros.get('vistaPrevia') === '1'
  const datosEjemplo = vistaPrevia || esSesionAdminPrueba(obtenerToken())
  const regreso = `/admin${vistaPrevia ? '?vistaPrevia=1' : ''}`
  const [rol, establecerRol] = useState(null)
  const [datos, establecerDatos] = useState(formularioVacio)
  const [categorias, establecerCategorias] = useState([])
  const [cargando, establecerCargando] = useState(true)
  const [guardando, establecerGuardando] = useState(false)
  const [error, establecerError] = useState('')
  const [encontrada, establecerEncontrada] = useState(!idPregunta)

  useEffect(() => {
    let vigente = true
    async function cargar() {
      try {
        const rolActual = vistaPrevia ? 'VISTA_PREVIA' : (await obtenerPerfil()).rol
        if (!vigente) return
        establecerRol(rolActual)
        if (rolActual !== 'ADMINISTRADOR' && !vistaPrevia) return
        const categoriasDisponibles = await obtenerCategoriasAdmin({ vistaPrevia })
        const pregunta = idPregunta ? await obtenerPreguntaAdmin(idPregunta, { vistaPrevia }) : null
        if (vigente) establecerCategorias(categoriasDisponibles.filter((categoria) => categoria.estado === 'ACTIVA' || categoria.nombre === pregunta?.categoria).map((categoria) => categoria.nombre).sort((a, b) => a.localeCompare(b, 'es-AR')))
        if (idPregunta) {
          if (vigente) { establecerDatos(pregunta); establecerEncontrada(true) }
        }
      } catch (fallo) {
        if (vigente) establecerError(fallo.message || 'No pudimos cargar la pregunta.')
      } finally {
        if (vigente) establecerCargando(false)
      }
    }
    void cargar()
    return () => { vigente = false }
  }, [idPregunta, vistaPrevia])

  function cambiarOpcion(indice, valor) {
    establecerDatos((actual) => ({ ...actual, opciones: actual.opciones.map((opcion, posicion) => posicion === indice ? valor : opcion) }))
  }

  async function guardar(evento) {
    evento.preventDefault()
    const enunciado = datos.enunciado.trim()
    const opciones = datos.opciones.map((opcion) => opcion.trim())
    if (!enunciado || !datos.categoria || opciones.some((opcion) => !opcion) || datos.respuestaCorrecta === null) {
      establecerError('Completá el enunciado, la categoría, las cuatro opciones y elegí la respuesta correcta.')
      return
    }
    if (new Set(opciones.map((opcion) => opcion.toLocaleLowerCase('es-AR'))).size !== 4) {
      establecerError('Las cuatro opciones deben ser diferentes.')
      return
    }
    establecerError('')
    establecerGuardando(true)
    try {
      const pregunta = { enunciado, categoria: datos.categoria, dificultad: datos.dificultad, estado: datos.estado, opciones, respuestaCorrecta: datos.respuestaCorrecta }
      if (idPregunta) await actualizarPreguntaAdmin(idPregunta, pregunta, { vistaPrevia })
      else await crearPreguntaAdmin(pregunta, { vistaPrevia })
      navegarConManejo(navegar, regreso, { state: { avisoPregunta: datosEjemplo ? 'Pregunta guardada temporalmente. Los cambios se pierden al recargar la página.' : 'Pregunta guardada.' } })
    } catch (fallo) {
      establecerError(fallo.message || 'No pudimos guardar la pregunta.')
    } finally {
      establecerGuardando(false)
    }
  }

  return <MarcoTorneo administrador sufijoAdmin={vistaPrevia ? '?vistaPrevia=1' : ''} tituloMovil={idPregunta ? 'Editar pregunta' : 'Nueva pregunta'} subtituloMovil="Gestión de contenido">
    <div className="admin-preguntas admin-formulario">
      <header className="admin-preguntas__encabezado"><div><h1>{idPregunta ? 'Editar pregunta' : 'Nueva pregunta'}</h1><p>Completá el enunciado y marcá una de las cuatro respuestas como correcta.</p></div><Link to={regreso}>Volver a preguntas</Link></header>
      {cargando && <p><output>Cargando pregunta…</output></p>}
      {!cargando && rol !== 'ADMINISTRADOR' && !vistaPrevia && !error && <p role="alert">Solo los administradores pueden gestionar preguntas.</p>}
      {!cargando && error && (!encontrada || (rol !== 'ADMINISTRADOR' && !vistaPrevia)) && <p role="alert">{error}</p>}
      {!cargando && (rol === 'ADMINISTRADOR' || vistaPrevia) && encontrada && <form className="admin-formulario__panel" onSubmit={guardar} noValidate>

        <label>Enunciado de la pregunta<textarea value={datos.enunciado} onChange={(evento) => establecerDatos({ ...datos, enunciado: evento.target.value })} rows="3" maxLength="500" /></label>
        <div className="admin-formulario__fila"><label>Categoría<select value={datos.categoria} onChange={(evento) => establecerDatos({ ...datos, categoria: evento.target.value })}><option value="">Seleccioná una categoría</option>{categorias.map((nombre) => <option key={nombre} value={nombre}>{nombre}</option>)}</select></label><label>Respuesta correcta<select aria-label="Respuesta correcta" value={datos.respuestaCorrecta ?? ''} onChange={(evento) => establecerDatos({ ...datos, respuestaCorrecta: evento.target.value === '' ? null : Number(evento.target.value) })}><option value="">Seleccionar opción</option>{letrasOpciones.map((letra, indice) => <option key={letra} value={indice}>Opción {letra}</option>)}</select></label></div>
        <fieldset><legend>Opciones de respuesta</legend><p>Seleccioná la opción correcta.</p>{letrasOpciones.map((letra, indice) => <div className={`admin-formulario__opcion${datos.respuestaCorrecta === indice ? ' admin-formulario__opcion--correcta' : ''}`} key={letra}><label htmlFor={`opcion-${indice}`}>Opción {letra}</label><input id={`opcion-${indice}`} value={datos.opciones[indice]} onChange={(evento) => cambiarOpcion(indice, evento.target.value)} maxLength="200" /><label className="admin-formulario__radio"><input type="radio" name="correcta" checked={datos.respuestaCorrecta === indice} onChange={() => establecerDatos({ ...datos, respuestaCorrecta: indice })} />Correcta</label></div>)}</fieldset><p className="admin-formulario__nota">Cada pregunta debe tener exactamente cuatro opciones y una única respuesta correcta.</p>
        {error && <p className="admin-formulario__error" role="alert">{error}</p>}
        {datosEjemplo && <p className="admin-formulario__temporal">Datos de prueba: los cambios se pierden al recargar.</p>}<div className="admin-formulario__acciones"><Link to={regreso}>Cancelar</Link><button type="submit" disabled={guardando}>{obtenerTextoBotonPregunta(guardando, idPregunta)}</button></div>
      </form>}
    </div>
  </MarcoTorneo>
}
