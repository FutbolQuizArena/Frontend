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
  const [rol, setRol] = useState(null)
  const [datos, setDatos] = useState(formularioVacio)
  const [categorias, setCategorias] = useState([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [encontrada, setEncontrada] = useState(!idPregunta)

  // Carga el rol, las categorías disponibles y los datos de la pregunta que se está editando.
  useEffect(() => {
    let vigente = true
    async function cargar() {
      try {
        const rolActual = vistaPrevia ? 'VISTA_PREVIA' : (await obtenerPerfil()).rol
        if (!vigente) return
        setRol(rolActual)
        if (rolActual !== 'ADMINISTRADOR' && !vistaPrevia) return
        const categoriasDisponibles = await obtenerCategoriasAdmin({ vistaPrevia })
        const pregunta = idPregunta ? await obtenerPreguntaAdmin(idPregunta, { vistaPrevia }) : null
        if (vigente) setCategorias(categoriasDisponibles.filter((categoria) => categoria.estado === 'ACTIVA' || categoria.nombre === pregunta?.categoria).map((categoria) => categoria.nombre).sort((a, b) => a.localeCompare(b, 'es-AR')))
        if (idPregunta) {
          if (vigente) { setDatos(pregunta); setEncontrada(true) }
        }
      } catch (error_) {
        if (vigente) setError(error_.message || 'No pudimos cargar la pregunta.')
      } finally {
        if (vigente) setCargando(false)
      }
    }
    void cargar()
    return () => { vigente = false }
  }, [idPregunta, vistaPrevia])

  // Crea una copia de las opciones y reemplaza únicamente la que se está escribiendo.
  function cambiarOpcion(indice, valor) {
    setDatos((actual) => ({ ...actual, opciones: actual.opciones.map((opcion, posicion) => posicion === indice ? valor : opcion) }))
  }

  // Valida las cuatro opciones y envía la pregunta completa, incluida su dificultad.
  // La presencia de idPregunta determina si se crea una pregunta o se actualiza una existente.
  async function guardar(evento) {
    evento.preventDefault()
    const enunciado = datos.enunciado.trim()
    const opciones = datos.opciones.map((opcion) => opcion.trim())
    if (!enunciado || !datos.categoria || opciones.some((opcion) => !opcion) || datos.respuestaCorrecta === null) {
      setError('Completá el enunciado, la categoría, las cuatro opciones y elegí la respuesta correcta.')
      return
    }
    if (new Set(opciones.map((opcion) => opcion.toLocaleLowerCase('es-AR'))).size !== 4) {
      setError('Las cuatro opciones deben ser diferentes.')
      return
    }
    setError('')
    setGuardando(true)
    try {
      const pregunta = { enunciado, categoria: datos.categoria, dificultad: datos.dificultad, estado: datos.estado, opciones, respuestaCorrecta: datos.respuestaCorrecta }
      if (idPregunta) await actualizarPreguntaAdmin(idPregunta, pregunta, { vistaPrevia })
      else await crearPreguntaAdmin(pregunta, { vistaPrevia })
      navegarConManejo(navegar, regreso, { state: { avisoPregunta: datosEjemplo ? 'Pregunta guardada temporalmente. Los cambios se pierden al recargar la página.' : 'Pregunta guardada.' } })
    } catch (error_) {
      setError(error_.message || 'No pudimos guardar la pregunta.')
    } finally {
      setGuardando(false)
    }
  }

  return <MarcoTorneo administrador sufijoAdmin={vistaPrevia ? '?vistaPrevia=1' : ''} tituloMovil={idPregunta ? 'Editar pregunta' : 'Nueva pregunta'} subtituloMovil="Gestión de contenido">
    <div className="admin-preguntas admin-formulario">
      <header className="admin-preguntas__encabezado"><div><h1>{idPregunta ? 'Editar pregunta' : 'Nueva pregunta'}</h1><p>Completá el enunciado y marcá una de las cuatro respuestas como correcta.</p></div><Link to={regreso}>Volver a preguntas</Link></header>
      {cargando && <p><output>Cargando pregunta…</output></p>}
      {!cargando && rol !== 'ADMINISTRADOR' && !vistaPrevia && !error && <p role="alert">Solo los administradores pueden gestionar preguntas.</p>}
      {!cargando && error && (!encontrada || (rol !== 'ADMINISTRADOR' && !vistaPrevia)) && <p role="alert">{error}</p>}
      {!cargando && (rol === 'ADMINISTRADOR' || vistaPrevia) && encontrada && <form className="admin-formulario__panel" onSubmit={guardar} noValidate>

        <label>Enunciado de la pregunta<textarea value={datos.enunciado} onChange={(evento) => setDatos({ ...datos, enunciado: evento.target.value })} rows="3" maxLength="500" /></label>
        <div className="admin-formulario__fila"><label>Categoría<select value={datos.categoria} onChange={(evento) => setDatos({ ...datos, categoria: evento.target.value })}><option value="">Seleccioná una categoría</option>{categorias.map((nombre) => <option key={nombre} value={nombre}>{nombre}</option>)}</select></label><label>Respuesta correcta<select aria-label="Respuesta correcta" value={datos.respuestaCorrecta ?? ''} onChange={(evento) => setDatos({ ...datos, respuestaCorrecta: evento.target.value === '' ? null : Number(evento.target.value) })}><option value="">Seleccionar opción</option>{letrasOpciones.map((letra, indice) => <option key={letra} value={indice}>Opción {letra}</option>)}</select></label></div>
        {/* La dificultad seleccionada se guarda junto con el enunciado, la categoría y las opciones. */}
        <label>Dificultad<select value={datos.dificultad || 'Media'} onChange={(evento) => setDatos({ ...datos, dificultad: evento.target.value })}><option value="Fácil">Fácil</option><option value="Media">Media</option><option value="Difícil">Difícil</option></select></label>
        <fieldset><legend>Opciones de respuesta</legend><p>Seleccioná la opción correcta.</p>{letrasOpciones.map((letra, indice) => <div className={`admin-formulario__opcion${datos.respuestaCorrecta === indice ? ' admin-formulario__opcion--correcta' : ''}`} key={letra}><label htmlFor={`opcion-${indice}`}>Opción {letra}</label><input id={`opcion-${indice}`} value={datos.opciones[indice]} onChange={(evento) => cambiarOpcion(indice, evento.target.value)} maxLength="200" /><label className="admin-formulario__radio"><input type="radio" name="correcta" checked={datos.respuestaCorrecta === indice} onChange={() => setDatos({ ...datos, respuestaCorrecta: indice })} />Correcta</label></div>)}</fieldset><p className="admin-formulario__nota">Cada pregunta debe tener exactamente cuatro opciones y una única respuesta correcta.</p>
        {error && <p className="admin-formulario__error" role="alert">{error}</p>}
        {datosEjemplo && <p className="admin-formulario__temporal">Datos de prueba: los cambios se pierden al recargar.</p>}<div className="admin-formulario__acciones"><Link to={regreso}>Cancelar</Link><button type="submit" disabled={guardando}>{obtenerTextoBotonPregunta(guardando, idPregunta)}</button></div>
      </form>}
    </div>
  </MarcoTorneo>
}
