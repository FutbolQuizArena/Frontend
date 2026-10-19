import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import MarcoTorneo from '../componentes/MarcoTorneo.jsx'
import NavegacionAdmin from '../componentes/NavegacionAdmin.jsx'
import { obtenerPerfil } from '../servicios/servicioPerfil.js'
import { esSesionAdminPrueba, obtenerToken } from '../servicios/servicioSesion.js'
import { eliminarPreguntaAdmin, obtenerPreguntasAdmin } from '../servicios/servicioPreguntasAdmin.js'
import { obtenerCategoriasAdmin } from '../servicios/servicioCategoriasAdmin.js'
import '../estilos/estilosSalaDetalleTorneo.css'
import '../estilos/estilosPreguntasAdmin.css'
import '../estilos/estilosMarcoAdmin.css'

const tamanioPagina = 5

export default function PaginaPreguntasAdmin() {
  const [parametros] = useSearchParams()
  const ubicacion = useLocation()
  const vistaPrevia = import.meta.env.DEV && parametros.get('vistaPrevia') === '1'
  const datosEjemplo = vistaPrevia || esSesionAdminPrueba(obtenerToken())
  const sufijo = vistaPrevia ? '?vistaPrevia=1' : ''
  const [rol, establecerRol] = useState(null)
  const [preguntas, establecerPreguntas] = useState([])
  const [cargando, establecerCargando] = useState(true)
  const [errorCarga, establecerErrorCarga] = useState('')
  const [busqueda, establecerBusqueda] = useState('')
  const [busquedaAplicada, establecerBusquedaAplicada] = useState('')
  const [categoria, establecerCategoria] = useState('todas')
  const [estado, establecerEstado] = useState('todas')
  const [pagina, establecerPagina] = useState(1)
  const [total, establecerTotal] = useState(0)
  const [paginasServidor, establecerPaginasServidor] = useState(1)
  const [categoriasServidor, establecerCategoriasServidor] = useState([])
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
    const temporizador = setTimeout(() => establecerBusquedaAplicada(busqueda), 300)
    return () => clearTimeout(temporizador)
  }, [busqueda])

  useEffect(() => {
    let vigente = true
    establecerCargando(true)
    establecerErrorCarga('')
    async function cargar() {
      const rolUsuario = vistaPrevia ? 'VISTA_PREVIA' : (await obtenerPerfil()).rol
      if (rolUsuario !== 'ADMINISTRADOR' && !vistaPrevia) {
        if (vigente) { establecerRol(rolUsuario); establecerPreguntas([]) }
        return
      }
      if (datosEjemplo) {
        const lista = await obtenerPreguntasAdmin({ vistaPrevia })
        if (vigente) { establecerRol(rolUsuario); establecerPreguntas(lista) }
      } else {
        const [lista, categorias] = await Promise.all([
          obtenerPreguntasAdmin({ pagina, buscar: busquedaAplicada, categoriaId: categoria, estado }),
          obtenerCategoriasAdmin(),
        ])
        if (vigente) {
          establecerRol(rolUsuario)
          establecerPreguntas(lista.preguntas)
          establecerTotal(lista.total)
          establecerPaginasServidor(lista.totalPaginas)
          establecerCategoriasServidor(categorias)
        }
      }
    }
    cargar().catch((error) => { if (vigente) establecerErrorCarga(error.message || 'No pudimos cargar las preguntas.') })
      .finally(() => { if (vigente) establecerCargando(false) })
    return () => { vigente = false }
  }, [intento, vistaPrevia, datosEjemplo, pagina, busquedaAplicada, categoria, estado])

  const categorias = datosEjemplo
    ? [...new Set(preguntas.map((pregunta) => pregunta.categoria))].sort((a, b) => a.localeCompare(b, 'es-AR')).map((nombre) => ({ id: nombre, nombre }))
    : categoriasServidor
  const consulta = busqueda.trim().toLocaleLowerCase('es-AR')
  const filtradas = preguntas.filter((pregunta) =>
    (!consulta || pregunta.enunciado.toLocaleLowerCase('es-AR').includes(consulta)) &&
    (categoria === 'todas' || pregunta.categoria === categoria) &&
    (estado === 'todas' || pregunta.estado === estado))
  const cantidad = datosEjemplo ? filtradas.length : total
  const totalPaginas = datosEjemplo ? Math.max(1, Math.ceil(filtradas.length / tamanioPagina)) : paginasServidor
  const visibles = datosEjemplo ? filtradas.slice((pagina - 1) * tamanioPagina, pagina * tamanioPagina) : preguntas

  function cambiarBusqueda(valor) { establecerBusqueda(valor); establecerPagina(1) }
  function cambiarCategoria(valor) { establecerCategoria(valor); establecerPagina(1) }
  function cambiarEstado(valor) { establecerEstado(valor); establecerPagina(1) }

  async function confirmarEliminacion() {
    if (!preguntaAEliminar || eliminando) return
    establecerEliminando(true)
    establecerErrorEliminar('')
    try {
      await eliminarPreguntaAdmin(preguntaAEliminar.id, { vistaPrevia })
      if (visibles.length === 1 && pagina > 1) establecerPagina((actual) => actual - 1)
      establecerIntento((actual) => actual + 1)
      establecerPreguntaAEliminar(null)
      establecerAviso(datosEjemplo ? 'Pregunta eliminada temporalmente. El cambio se pierde al recargar la página.' : 'Pregunta eliminada.')
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
        <div className="admin-preguntas__titulo"><div><h2 id="titulo-preguntas-admin">Preguntas</h2><p>{datosEjemplo ? preguntas.length : total} {datosEjemplo ? 'preguntas de ejemplo' : 'preguntas'}</p></div></div>
        <div className="admin-preguntas__filtros"><label>Buscar pregunta<input type="search" value={busqueda} onChange={(evento) => cambiarBusqueda(evento.target.value)} placeholder="Escribí parte del enunciado" /></label><label>Categoría<select value={categoria} onChange={(evento) => cambiarCategoria(evento.target.value)}><option value="todas">Todas las categorías</option>{categorias.map(({ id, nombre }) => <option key={id} value={id}>{nombre}</option>)}</select></label><label>Estado<select value={estado} onChange={(evento) => cambiarEstado(evento.target.value)}><option value="todas">Todos los estados</option><option>ACTIVA</option><option>BORRADOR</option></select></label></div>
        <p className="admin-preguntas__cantidad" role="status">{cantidad} {cantidad === 1 ? 'resultado' : 'resultados'}</p>
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
      }}><h2 id="titulo-eliminar-pregunta">¿Eliminar pregunta?</h2><p id="detalle-eliminar-pregunta">{preguntaAEliminar.enunciado}</p><p>{datosEjemplo ? 'Esta acción quitará la pregunta del listado temporal.' : 'Esta acción eliminará la pregunta del banco de contenido.'}</p>{errorEliminar && <p role="alert">{errorEliminar}</p>}<div><button ref={botonCancelar} type="button" disabled={eliminando} onClick={() => establecerPreguntaAEliminar(null)}>Cancelar</button><button type="button" disabled={eliminando} onClick={confirmarEliminacion}>{eliminando ? 'Eliminando…' : 'Sí, eliminar'}</button></div></dialog>}
    </div>
  </MarcoTorneo>
}
