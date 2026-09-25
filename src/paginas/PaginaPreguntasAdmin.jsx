import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import MarcoTorneo from '../componentes/MarcoTorneo.jsx'
import NavegacionAdmin from '../componentes/NavegacionAdmin.jsx'
import { obtenerPerfil } from '../servicios/servicioPerfil.js'
import { eliminarPreguntaAdmin, obtenerPreguntasAdmin } from '../servicios/servicioPreguntasAdmin.js'
import '../estilos/estilosSalaDetalleTorneo.css'
import '../estilos/estilosPreguntasAdmin.css'
import '../estilos/estilosMarcoAdmin.css'

const tamanioPagina = 5

export default function PaginaPreguntasAdmin() {
  const [parametros] = useSearchParams()
  const ubicacion = useLocation()
  const vistaPrevia = import.meta.env.DEV && parametros.get('vistaPrevia') === '1'
  const sufijo = vistaPrevia ? '?vistaPrevia=1' : ''
  const [rol, establecerRol] = useState(null)
  const [preguntas, establecerPreguntas] = useState([])
  const [cargando, establecerCargando] = useState(true)
  const [errorCarga, establecerErrorCarga] = useState('')
  const [busqueda, establecerBusqueda] = useState('')
  const [categoria, establecerCategoria] = useState('todas')
  const [estado, establecerEstado] = useState('todas')
  const [pagina, establecerPagina] = useState(1)
  const [intento, establecerIntento] = useState(0)
  const [preguntaAEliminar, establecerPreguntaAEliminar] = useState(null)
  const [eliminando, establecerEliminando] = useState(false)
  const [errorEliminar, establecerErrorEliminar] = useState('')
  const [aviso, establecerAviso] = useState('')
  const botonCancelar = useRef(null)
  const dialogo = useRef(null)

  useEffect(() => {
    if (preguntaAEliminar) { dialogo.current?.showModal(); botonCancelar.current?.focus() }
  }, [preguntaAEliminar])

  useEffect(() => {
    let vigente = true
    establecerCargando(true)
    establecerErrorCarga('')
    async function cargar() {
      const rolUsuario = vistaPrevia ? 'VISTA_PREVIA' : (await obtenerPerfil()).rol
      const lista = rolUsuario === 'ADMINISTRADOR' || vistaPrevia ? await obtenerPreguntasAdmin() : []
      if (vigente) { establecerRol(rolUsuario); establecerPreguntas(lista) }
    }
    cargar().catch((error) => { if (vigente) establecerErrorCarga(error.message || 'No pudimos cargar las preguntas.') })
      .finally(() => { if (vigente) establecerCargando(false) })
    return () => { vigente = false }
  }, [intento, vistaPrevia])

  const categorias = [...new Set(preguntas.map((pregunta) => pregunta.categoria))].sort((a, b) => a.localeCompare(b, 'es-AR'))
  const consulta = busqueda.trim().toLocaleLowerCase('es-AR')
  const filtradas = preguntas.filter((pregunta) =>
    (!consulta || pregunta.enunciado.toLocaleLowerCase('es-AR').includes(consulta)) &&
    (categoria === 'todas' || pregunta.categoria === categoria) &&
    (estado === 'todas' || pregunta.estado === estado))
  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / tamanioPagina))
  const visibles = filtradas.slice((pagina - 1) * tamanioPagina, pagina * tamanioPagina)

  function cambiarBusqueda(valor) { establecerBusqueda(valor); establecerPagina(1) }
  function cambiarCategoria(valor) { establecerCategoria(valor); establecerPagina(1) }
  function cambiarEstado(valor) { establecerEstado(valor); establecerPagina(1) }

  async function confirmarEliminacion() {
    if (!preguntaAEliminar || eliminando) return
    establecerEliminando(true)
    establecerErrorEliminar('')
    try {
      await eliminarPreguntaAdmin(preguntaAEliminar.id)
      establecerPreguntas(await obtenerPreguntasAdmin())
      establecerPagina((actual) => Math.min(actual, Math.max(1, Math.ceil((filtradas.length - 1) / tamanioPagina))))
      establecerPreguntaAEliminar(null)
      establecerAviso('Pregunta eliminada temporalmente. El cambio se pierde al recargar la página.')
    } catch (error) {
      establecerErrorEliminar(error.message || 'No pudimos eliminar la pregunta.')
    } finally {
      establecerEliminando(false)
    }
  }

  return <MarcoTorneo administrador sufijoAdmin={vistaPrevia ? '?vistaPrevia=1' : ''} tituloMovil="Administración" subtituloMovil="Preguntas">
    <div className="admin-preguntas admin-listado">
      <header className="admin-preguntas__encabezado"><div><h1>Administración de preguntas</h1><p>Gestioná el banco de contenido de FutbolQuiz.</p></div>{!cargando && !errorCarga && (rol === 'ADMINISTRADOR' || vistaPrevia) && <Link className="admin-listado__nuevo" to={`/admin/preguntas/nueva${sufijo}`}>Nueva pregunta</Link>}</header>
      {cargando && <p className="admin-preguntas__estado" role="status">Cargando preguntas…</p>}
      {!cargando && errorCarga && <div className="admin-preguntas__estado" role="alert"><p>{errorCarga}</p><button type="button" onClick={() => establecerIntento((actual) => actual + 1)}>Reintentar</button></div>}
      {!cargando && !errorCarga && rol !== 'ADMINISTRADOR' && !vistaPrevia && <div className="admin-preguntas__estado" role="alert"><p>Solo los administradores pueden consultar esta sección.</p><Link to="/home">Volver al inicio</Link></div>}
      {!cargando && !errorCarga && (rol === 'ADMINISTRADOR' || vistaPrevia) && <section className="admin-preguntas__panel" aria-labelledby="titulo-preguntas-admin">
        {ubicacion.state?.avisoPregunta && <p className="admin-preguntas__aviso" role="status">{ubicacion.state.avisoPregunta}</p>}
        {aviso && <p className="admin-preguntas__aviso" role="status">{aviso}</p>}
        {vistaPrevia && <p className="admin-preguntas__aviso" role="status">Vista previa local: rol de administrador simulado y preguntas de ejemplo.</p>}
        <NavegacionAdmin vistaPrevia={vistaPrevia} />
        <div className="admin-preguntas__titulo"><div><h2 id="titulo-preguntas-admin">Preguntas</h2><p>{preguntas.length} preguntas de ejemplo</p></div></div>
        <div className="admin-preguntas__filtros"><label>Buscar pregunta<input type="search" value={busqueda} onChange={(evento) => cambiarBusqueda(evento.target.value)} placeholder="Escribí parte del enunciado" /></label><label>Categoría<select value={categoria} onChange={(evento) => cambiarCategoria(evento.target.value)}><option value="todas">Todas las categorías</option>{categorias.map((nombre) => <option key={nombre} value={nombre}>{nombre}</option>)}</select></label><label>Estado<select value={estado} onChange={(evento) => cambiarEstado(evento.target.value)}><option value="todas">Todos los estados</option><option>ACTIVA</option><option>BORRADOR</option></select></label></div>
        <p className="admin-preguntas__cantidad" role="status">{filtradas.length} {filtradas.length === 1 ? 'resultado' : 'resultados'}</p>
        {visibles.length ? <div className="admin-preguntas__tabla"><div className="admin-preguntas__cabecera" aria-hidden="true"><span>Pregunta</span><span>Categoría</span><span>Dificultad</span><span>Estado</span><span>Acciones</span></div><ul>{visibles.map((pregunta) => <li key={pregunta.id}><strong>{pregunta.enunciado}</strong><span data-etiqueta="Categoría">{pregunta.categoria}</span><span data-etiqueta="Dificultad">{pregunta.dificultad}</span><span className={`admin-categorias__estado${pregunta.estado === 'BORRADOR' ? ' admin-categorias__estado--borrador' : ''}`}>{pregunta.estado}</span><details className="admin-preguntas__menu"><summary aria-label={`Acciones de pregunta: ${pregunta.enunciado}`}>•••</summary><div className="admin-preguntas__fila-acciones"><Link className="admin-preguntas__editar" aria-label={`Editar pregunta: ${pregunta.enunciado}`} to={`/admin/preguntas/${pregunta.id}/editar${sufijo}`}>Editar</Link><button type="button" aria-label={`Eliminar pregunta: ${pregunta.enunciado}`} onClick={(evento) => { evento.currentTarget.closest('details').open = false; establecerPreguntaAEliminar(pregunta); establecerErrorEliminar('') }}>Eliminar</button></div></details></li>)}</ul></div> : <p className="admin-preguntas__vacio">No hay preguntas que coincidan con los filtros.</p>}
        <nav className="admin-preguntas__paginacion" aria-label="Páginas de preguntas"><span>Página {pagina} de {totalPaginas}</span><div><button type="button" disabled={pagina === 1} onClick={() => establecerPagina((actual) => actual - 1)}>Anterior</button><button type="button" disabled={pagina === totalPaginas} onClick={() => establecerPagina((actual) => actual + 1)}>Siguiente</button></div></nav>
      </section>}
      {preguntaAEliminar && <dialog ref={dialogo} className="admin-preguntas__confirmacion" onCancel={(evento) => { evento.preventDefault(); if (!eliminando) establecerPreguntaAEliminar(null) }} role="alertdialog" aria-modal="true" aria-labelledby="titulo-eliminar-pregunta" aria-describedby="detalle-eliminar-pregunta" onKeyDown={(evento) => {
        if (evento.key === 'Escape' && !eliminando) establecerPreguntaAEliminar(null)
        if (evento.key === 'Tab') {
          const botones = evento.currentTarget.querySelectorAll('button:not(:disabled)')
          const primero = botones[0]
          const ultimo = botones[botones.length - 1]
          if (evento.shiftKey && document.activeElement === primero) { evento.preventDefault(); ultimo?.focus() }
          else if (!evento.shiftKey && document.activeElement === ultimo) { evento.preventDefault(); primero?.focus() }
        }
      }}><h2 id="titulo-eliminar-pregunta">¿Eliminar pregunta?</h2><p id="detalle-eliminar-pregunta">{preguntaAEliminar.enunciado}</p><p>Esta acción quitará la pregunta del listado temporal.</p>{errorEliminar && <p role="alert">{errorEliminar}</p>}<div><button ref={botonCancelar} type="button" disabled={eliminando} onClick={() => establecerPreguntaAEliminar(null)}>Cancelar</button><button type="button" disabled={eliminando} onClick={confirmarEliminacion}>{eliminando ? 'Eliminando…' : 'Sí, eliminar'}</button></div></dialog>}
    </div>
  </MarcoTorneo>
}
