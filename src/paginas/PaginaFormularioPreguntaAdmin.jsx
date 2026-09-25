import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import MarcoTorneo from '../componentes/MarcoTorneo.jsx'
import { obtenerPerfil } from '../servicios/servicioPerfil.js'
import { actualizarPreguntaAdmin, crearPreguntaAdmin, obtenerPreguntaAdmin, obtenerPreguntasAdmin } from '../servicios/servicioPreguntasAdmin.js'
import '../estilos/estilosPreguntasAdmin.css'
import '../estilos/estilosMarcoAdmin.css'

const formularioVacio = { enunciado: '', categoria: '', dificultad: 'Fácil', opciones: ['', '', '', ''], respuestaCorrecta: null }

export default function PaginaFormularioPreguntaAdmin() {
  const { idPregunta } = useParams()
  const [parametros] = useSearchParams()
  const navegar = useNavigate()
  const vistaPrevia = import.meta.env.DEV && parametros.get('vistaPrevia') === '1'
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
        const preguntas = await obtenerPreguntasAdmin()
        if (!vigente) return
        establecerCategorias([...new Set(preguntas.map((pregunta) => pregunta.categoria))].sort((a, b) => a.localeCompare(b, 'es-AR')))
        if (idPregunta) {
          const pregunta = await obtenerPreguntaAdmin(idPregunta)
          if (vigente) { establecerDatos(pregunta); establecerEncontrada(true) }
        }
      } catch (fallo) {
        if (vigente) establecerError(fallo.message || 'No pudimos cargar la pregunta.')
      } finally {
        if (vigente) establecerCargando(false)
      }
    }
    cargar()
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
      const pregunta = { enunciado, categoria: datos.categoria, dificultad: datos.dificultad, opciones, respuestaCorrecta: datos.respuestaCorrecta }
      if (idPregunta) await actualizarPreguntaAdmin(idPregunta, pregunta)
      else await crearPreguntaAdmin(pregunta)
      navegar(regreso, { state: { avisoPregunta: 'Pregunta guardada temporalmente. Los cambios se pierden al recargar la página.' } })
    } catch (fallo) {
      establecerError(fallo.message || 'No pudimos guardar la pregunta.')
    } finally {
      establecerGuardando(false)
    }
  }

  return <MarcoTorneo administrador sufijoAdmin={vistaPrevia ? '?vistaPrevia=1' : ''} tituloMovil={idPregunta ? 'Editar pregunta' : 'Nueva pregunta'} subtituloMovil="Gestión de contenido">
    <div className="admin-preguntas admin-formulario">
      <header className="admin-preguntas__encabezado"><div><h1>{idPregunta ? 'Editar pregunta' : 'Nueva pregunta'}</h1><p>Completá el enunciado y marcá una de las cuatro respuestas como correcta.</p></div><Link to={regreso}>Volver a preguntas</Link></header>
      {cargando && <p role="status">Cargando pregunta…</p>}
      {!cargando && rol !== 'ADMINISTRADOR' && !vistaPrevia && !error && <p role="alert">Solo los administradores pueden gestionar preguntas.</p>}
      {!cargando && error && (!encontrada || (rol !== 'ADMINISTRADOR' && !vistaPrevia)) && <p role="alert">{error}</p>}
      {!cargando && (rol === 'ADMINISTRADOR' || vistaPrevia) && encontrada && <form className="admin-formulario__panel" onSubmit={guardar} noValidate>

        <label>Enunciado de la pregunta<textarea value={datos.enunciado} onChange={(evento) => establecerDatos({ ...datos, enunciado: evento.target.value })} rows="3" maxLength="500" /></label>
        <div className="admin-formulario__fila"><label>Categoría<select value={datos.categoria} onChange={(evento) => establecerDatos({ ...datos, categoria: evento.target.value })}><option value="">Seleccioná una categoría</option>{categorias.map((nombre) => <option key={nombre} value={nombre}>{nombre}</option>)}</select></label><label>Respuesta correcta<select aria-label="Respuesta correcta" value={datos.respuestaCorrecta ?? ''} onChange={(evento) => establecerDatos({ ...datos, respuestaCorrecta: evento.target.value === '' ? null : Number(evento.target.value) })}><option value="">Seleccionar opción</option>{['A', 'B', 'C', 'D'].map((letra, indice) => <option key={letra} value={indice}>Opción {letra}</option>)}</select></label></div>
        <fieldset><legend>Opciones de respuesta</legend><p>Seleccioná la opción correcta.</p>{datos.opciones.map((opcion, indice) => <div className={`admin-formulario__opcion${datos.respuestaCorrecta === indice ? ' admin-formulario__opcion--correcta' : ''}`} key={indice}><label htmlFor={`opcion-${indice}`}>Opción {String.fromCharCode(65 + indice)}</label><input id={`opcion-${indice}`} value={opcion} onChange={(evento) => cambiarOpcion(indice, evento.target.value)} maxLength="200" /><label className="admin-formulario__radio"><input type="radio" name="correcta" checked={datos.respuestaCorrecta === indice} onChange={() => establecerDatos({ ...datos, respuestaCorrecta: indice })} />Correcta</label></div>)}</fieldset><p className="admin-formulario__nota">Cada pregunta debe tener exactamente cuatro opciones y una única respuesta correcta.</p>
        {error && <p className="admin-formulario__error" role="alert">{error}</p>}
        <p className="admin-formulario__temporal">Datos de prueba: los cambios se pierden al recargar.</p><div className="admin-formulario__acciones"><Link to={regreso}>Cancelar</Link><button type="submit" disabled={guardando}>{guardando ? 'Guardando…' : idPregunta ? 'Guardar cambios' : 'Guardar pregunta'}</button></div>
      </form>}
    </div>
  </MarcoTorneo>
}
