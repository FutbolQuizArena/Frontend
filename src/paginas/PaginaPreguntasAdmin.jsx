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

async function cargarDatosPreguntas({ vistaPrevia, datosEjemplo, pagina, busquedaAplicada, categoria, estado }) {
  const rolUsuario = vistaPrevia ? 'VISTA_PREVIA' : (await obtenerPerfil()).rol
  if (rolUsuario !== 'ADMINISTRADOR' && !vistaPrevia) {
    return { rolUsuario, preguntas: [], sinAcceso: true }
  }

  if (datosEjemplo) {
    const preguntas = await obtenerPreguntasAdmin({ vistaPrevia })
    return { rolUsuario, preguntas }
  }

  const [resultado, categorias] = await Promise.all([
    obtenerPreguntasAdmin({ pagina, buscar: busquedaAplicada, categoriaId: categoria, estado }),
    obtenerCategoriasAdmin(),
  ])

  return {
    rolUsuario,
    preguntas: resultado.preguntas,
    total: resultado.total,
    totalPaginas: resultado.totalPaginas,
    categorias,
  }
}

function manejarTeclasDialogoEliminar(evento, eliminando) {
  if (evento.key === 'Escape' && !eliminando) return 'cerrar'
  if (evento.key !== 'Tab') return null

  const botones = evento.currentTarget.querySelectorAll('button:not(:disabled)')
  const primero = botones[0]
  const ultimo = botones[botones.length - 1]
  if (evento.shiftKey && document.activeElement === primero) return ultimo
  if (!evento.shiftKey && document.activeElement === ultimo) return primero
  return null
}

function coincideConFiltros(pregunta, consulta, categoria, estado) {
  return (!consulta || pregunta.enunciado.toLocaleLowerCase('es-AR').includes(consulta)) &&
    (categoria === 'todas' || pregunta.categoria === categoria) &&
    (estado === 'todas' || pregunta.estado === estado)
}

function obtenerPaginaPreguntas({ datosEjemplo, filtradas, preguntas, total, paginasServidor, pagina }) {
  if (!datosEjemplo) {
    return { cantidad: total, totalPaginas: paginasServidor, visibles: preguntas }
  }
  return {
    cantidad: filtradas.length,
    totalPaginas: Math.max(1, Math.ceil(filtradas.length / tamanioPagina)),
    visibles: filtradas.slice((pagina - 1) * tamanioPagina, pagina * tamanioPagina),
  }
}

export default function PaginaPreguntasAdmin() {
  const [parametros] = useSearchParams()
  const ubicacion = useLocation()
  const vistaPrevia = import.meta.env.DEV && parametros.get('vistaPrevia') === '1'
  const datosEjemplo = vistaPrevia || esSesionAdminPrueba(obtenerToken())
  const sufijo = vistaPrevia ? '?vistaPrevia=1' : ''
  const [rol, setRol] = useState(null)
  const [preguntas, setPreguntas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [busquedaAplicada, setBusquedaAplicada] = useState('')
  const [categoria, setCategoria] = useState('todas')
  const [estado, setEstado] = useState('todas')
  const [pagina, setPagina] = useState(1)
  const [total, setTotal] = useState(0)
  const [paginasServidor, setPaginasServidor] = useState(1)
  const [categoriasServidor, setCategoriasServidor] = useState([])
  const [intento, setIntento] = useState(0)
  const [preguntaAEliminar, setPreguntaAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminar, setErrorEliminar] = useState('')
  const [aviso, setAviso] = useState('')
  const botonCancelar = useRef(null)
  const dialogo = useRef(null)

  useEffect(() => {
    if (preguntaAEliminar) { dialogo.current?.showModal(); botonCancelar.current?.focus() }
  }, [preguntaAEliminar])

  useEffect(() => {
    const temporizador = setTimeout(() => setBusquedaAplicada(busqueda), 300)
    return () => clearTimeout(temporizador)
  }, [busqueda])

  useEffect(() => {
    let vigente = true
    setCargando(true)
    setErrorCarga('')
    cargarDatosPreguntas({ vistaPrevia, datosEjemplo, pagina, busquedaAplicada, categoria, estado })
      .then((datos) => {
        if (!vigente) return
        setRol(datos.rolUsuario)
        setPreguntas(datos.preguntas)
        if (!datos.sinAcceso && !datosEjemplo) {
          setTotal(datos.total)
          setPaginasServidor(datos.totalPaginas)
          setCategoriasServidor(datos.categorias)
        }
      })
      .catch((error) => { if (vigente) setErrorCarga(error.message || 'No pudimos cargar las preguntas.') })
      .finally(() => { if (vigente) setCargando(false) })
    return () => { vigente = false }
  }, [intento, vistaPrevia, datosEjemplo, pagina, busquedaAplicada, categoria, estado])

  const categorias = datosEjemplo
    ? [...new Set(preguntas.map((pregunta) => pregunta.categoria))].sort((a, b) => a.localeCompare(b, 'es-AR')).map((nombre) => ({ id: nombre, nombre }))
    : categoriasServidor
  const consulta = busqueda.trim().toLocaleLowerCase('es-AR')
  const filtradas = preguntas.filter((pregunta) => coincideConFiltros(pregunta, consulta, categoria, estado))
  const { cantidad, totalPaginas, visibles } = obtenerPaginaPreguntas({
    datosEjemplo, filtradas, preguntas, total, paginasServidor, pagina,
  })

  function cambiarBusqueda(valor) { setBusqueda(valor); setPagina(1) }
  function cambiarCategoria(valor) { setCategoria(valor); setPagina(1) }
  function cambiarEstado(valor) { setEstado(valor); setPagina(1) }

  async function confirmarEliminacion() {
    if (!preguntaAEliminar || eliminando) return
    setEliminando(true)
    setErrorEliminar('')
    try {
      await eliminarPreguntaAdmin(preguntaAEliminar.id, { vistaPrevia })
      if (visibles.length === 1 && pagina > 1) setPagina((actual) => actual - 1)
      setIntento((actual) => actual + 1)
      setPreguntaAEliminar(null)
      setAviso(datosEjemplo ? 'Pregunta eliminada temporalmente. El cambio se pierde al recargar la página.' : 'Pregunta eliminada.')
    } catch (error) {
      setErrorEliminar(error.message || 'No pudimos eliminar la pregunta.')
    } finally {
      setEliminando(false)
    }
  }

  return <MarcoTorneo administrador sufijoAdmin={sufijo} tituloMovil="Administración" subtituloMovil="Preguntas">
    <div className="admin-preguntas admin-listado">
      <header className="admin-preguntas__encabezado"><div><h1>Administración de preguntas</h1><p>Gestioná el banco de contenido de FutbolQuiz.</p></div>{!cargando && !errorCarga && (rol === 'ADMINISTRADOR' || vistaPrevia) && <Link className="admin-listado__nuevo" to={`/admin/preguntas/nueva${sufijo}`}>Nueva pregunta</Link>}</header>
      {cargando && <p className="admin-preguntas__estado"><output>Cargando preguntas…</output></p>}
      {!cargando && errorCarga && <div className="admin-preguntas__estado" role="alert"><p>{errorCarga}</p><button type="button" onClick={() => setIntento((actual) => actual + 1)}>Reintentar</button></div>}
      {!cargando && !errorCarga && rol !== 'ADMINISTRADOR' && !vistaPrevia && <div className="admin-preguntas__estado" role="alert"><p>Solo los administradores pueden consultar esta sección.</p><Link to="/home">Volver al inicio</Link></div>}
      {!cargando && !errorCarga && (rol === 'ADMINISTRADOR' || vistaPrevia) && <section className="admin-preguntas__panel" aria-labelledby="titulo-preguntas-admin">
        {ubicacion.state?.avisoPregunta && <p className="admin-preguntas__aviso"><output>{ubicacion.state.avisoPregunta}</output></p>}
        {aviso && <p className="admin-preguntas__aviso"><output>{aviso}</output></p>}
        {vistaPrevia && <p className="admin-preguntas__aviso"><output>Vista previa local: rol de administrador simulado y preguntas de ejemplo.</output></p>}
        <NavegacionAdmin vistaPrevia={vistaPrevia} />
        <div className="admin-preguntas__titulo"><div><h2 id="titulo-preguntas-admin">Preguntas</h2><p>{datosEjemplo ? preguntas.length : total} {datosEjemplo ? 'preguntas de ejemplo' : 'preguntas'}</p></div></div>
        <div className="admin-preguntas__filtros"><label>Buscar pregunta<input type="search" value={busqueda} onChange={(evento) => cambiarBusqueda(evento.target.value)} placeholder="Escribí parte del enunciado" /></label><label>Categoría<select value={categoria} onChange={(evento) => cambiarCategoria(evento.target.value)}><option value="todas">Todas las categorías</option>{categorias.map(({ id, nombre }) => <option key={id} value={id}>{nombre}</option>)}</select></label><label>Estado<select value={estado} onChange={(evento) => cambiarEstado(evento.target.value)}><option value="todas">Todos los estados</option><option>ACTIVA</option><option>BORRADOR</option></select></label></div>
        <p className="admin-preguntas__cantidad"><output>{cantidad} {cantidad === 1 ? 'resultado' : 'resultados'}</output></p>
        {visibles.length ? <div className="admin-preguntas__tabla"><div className="admin-preguntas__cabecera" aria-hidden="true"><span>Pregunta</span><span>Categoría</span><span>Dificultad</span><span>Estado</span><span>Acciones</span></div><ul>{visibles.map((pregunta) => <li key={pregunta.id}><strong>{pregunta.enunciado}</strong><span data-etiqueta="Categoría">{pregunta.categoria}</span><span data-etiqueta="Dificultad">{pregunta.dificultad}</span><span className={`admin-categorias__estado${pregunta.estado === 'BORRADOR' ? ' admin-categorias__estado--borrador' : ''}`}>{pregunta.estado}</span><details className="admin-preguntas__menu"><summary aria-label={`Acciones de pregunta: ${pregunta.enunciado}`}>•••</summary><div className="admin-preguntas__fila-acciones"><Link className="admin-preguntas__editar" aria-label={`Editar pregunta: ${pregunta.enunciado}`} to={`/admin/preguntas/${pregunta.id}/editar${sufijo}`}>Editar</Link><button type="button" aria-label={`Eliminar pregunta: ${pregunta.enunciado}`} onClick={(evento) => { evento.currentTarget.closest('details').open = false; setPreguntaAEliminar(pregunta); setErrorEliminar('') }}>Eliminar</button></div></details></li>)}</ul></div> : <p className="admin-preguntas__vacio">No hay preguntas que coincidan con los filtros.</p>}
        <nav className="admin-preguntas__paginacion" aria-label="Páginas de preguntas"><span>Página {pagina} de {totalPaginas}</span><div><button type="button" disabled={pagina === 1} onClick={() => setPagina((actual) => actual - 1)}>Anterior</button><button type="button" disabled={pagina === totalPaginas} onClick={() => setPagina((actual) => actual + 1)}>Siguiente</button></div></nav>
      </section>}
      {preguntaAEliminar && <dialog ref={dialogo} className="admin-preguntas__confirmacion" onCancel={(evento) => { evento.preventDefault(); if (!eliminando) setPreguntaAEliminar(null) }} role="alertdialog" aria-modal="true" aria-labelledby="titulo-eliminar-pregunta" aria-describedby="detalle-eliminar-pregunta" onKeyDown={(evento) => {
        const destino = manejarTeclasDialogoEliminar(evento, eliminando)
        if (destino === 'cerrar') setPreguntaAEliminar(null)
        else if (destino) { evento.preventDefault(); destino.focus() }
      }}><h2 id="titulo-eliminar-pregunta">¿Eliminar pregunta?</h2><p id="detalle-eliminar-pregunta">{preguntaAEliminar.enunciado}</p><p>{datosEjemplo ? 'Esta acción quitará la pregunta del listado temporal.' : 'Esta acción eliminará la pregunta del banco de contenido.'}</p>{errorEliminar && <p role="alert">{errorEliminar}</p>}<div><button ref={botonCancelar} type="button" disabled={eliminando} onClick={() => setPreguntaAEliminar(null)}>Cancelar</button><button type="button" disabled={eliminando} onClick={() => { void confirmarEliminacion() }}>{eliminando ? 'Eliminando…' : 'Sí, eliminar'}</button></div></dialog>}
    </div>
  </MarcoTorneo>
}
