import { useEffect, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import MarcoTorneo from '../componentes/MarcoTorneo.jsx'
import NavegacionAdmin from '../componentes/NavegacionAdmin.jsx'
import { obtenerPerfil } from '../servicios/servicioPerfil.js'
import { esSesionAdminPrueba, obtenerToken } from '../servicios/servicioSesion.js'
import { obtenerCategoriasAdmin } from '../servicios/servicioCategoriasAdmin.js'
import '../estilos/estilosSalaDetalleTorneo.css'
import '../estilos/estilosPreguntasAdmin.css'
import '../estilos/estilosMarcoAdmin.css'

export default function PaginaCategoriasAdmin() {
  const [parametros] = useSearchParams()
  const ubicacion = useLocation()
  const vistaPrevia = import.meta.env.DEV && parametros.get('vistaPrevia') === '1'
  const datosEjemplo = vistaPrevia || esSesionAdminPrueba(obtenerToken())
  const sufijo = vistaPrevia ? '?vistaPrevia=1' : ''
  const [rol, establecerRol] = useState(null)
  const [categorias, establecerCategorias] = useState([])
  const [busqueda, establecerBusqueda] = useState('')
  const [cargando, establecerCargando] = useState(true)
  const [error, establecerError] = useState('')
  const [intento, establecerIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    establecerCargando(true)
    establecerError('')
    async function cargar() {
      const rolActual = vistaPrevia ? 'VISTA_PREVIA' : (await obtenerPerfil()).rol
      const lista = rolActual === 'ADMINISTRADOR' || vistaPrevia ? await obtenerCategoriasAdmin({ vistaPrevia }) : []
      if (vigente) { establecerRol(rolActual); establecerCategorias(lista) }
    }
    cargar().catch((fallo) => { if (vigente) establecerError(fallo.message || 'No pudimos cargar las categorías.') })
      .finally(() => { if (vigente) establecerCargando(false) })
    return () => { vigente = false }
  }, [intento, vistaPrevia])

  const consulta = busqueda.trim().toLocaleLowerCase('es-AR')
  const visibles = categorias.filter((categoria) => categoria.nombre.toLocaleLowerCase('es-AR').includes(consulta))

  return <MarcoTorneo administrador sufijoAdmin={vistaPrevia ? '?vistaPrevia=1' : ''} tituloMovil="Administración" subtituloMovil="Categorías">
    <div className="admin-preguntas admin-categorias">
      <header className="admin-preguntas__encabezado"><div><h1>Categorías</h1><p>Creá y organizá las categorías del banco de preguntas.</p></div>{!cargando && !error && (rol === 'ADMINISTRADOR' || vistaPrevia) && <Link className="admin-listado__nuevo" to={`/admin/categorias/nueva${sufijo}`}>Nueva categoría</Link>}</header>
      {cargando && <p className="admin-preguntas__estado" role="status">Cargando categorías…</p>}
      {!cargando && error && <div className="admin-preguntas__estado" role="alert"><p>{error}</p><button type="button" onClick={() => establecerIntento((actual) => actual + 1)}>Reintentar</button></div>}
      {!cargando && !error && rol !== 'ADMINISTRADOR' && !vistaPrevia && <div className="admin-preguntas__estado" role="alert"><p>Solo los administradores pueden consultar esta sección.</p><Link to="/home">Volver al inicio</Link></div>}
      {!cargando && !error && (rol === 'ADMINISTRADOR' || vistaPrevia) && <section className="admin-preguntas__panel" aria-labelledby="titulo-categorias-admin">
        {ubicacion.state?.avisoCategoria && <p className="admin-preguntas__aviso" role="status">{ubicacion.state.avisoCategoria}</p>}
        {vistaPrevia && <p className="admin-preguntas__aviso" role="status">Vista previa local: rol de administrador simulado y categorías de ejemplo.</p>}
        <NavegacionAdmin vistaPrevia={vistaPrevia} />
        <div className="admin-preguntas__titulo"><div><h2 id="titulo-categorias-admin">Gestión de categorías</h2><p>{categorias.length} {datosEjemplo ? 'categorías de ejemplo · datos temporales' : 'categorías'}</p></div></div>
        <div className="admin-categorias__busqueda"><label>Buscar categoría<input type="search" value={busqueda} onChange={(evento) => establecerBusqueda(evento.target.value)} placeholder="Escribí el nombre de la categoría" /></label></div>
        <p className="admin-preguntas__cantidad" role="status">{visibles.length} {visibles.length === 1 ? 'resultado' : 'resultados'}</p>
        {visibles.length ? <div className="admin-categorias__tabla"><div className="admin-categorias__cabecera" aria-hidden="true"><span>Categoría</span><span>Preguntas</span><span>Estado</span><span>Acciones</span></div><ul>{visibles.map((categoria) => <li key={categoria.id}><strong>{categoria.nombre}</strong><span className="admin-categorias__cantidad">{categoria.cantidadPreguntas}<span className="admin-categorias__unidad"> preguntas</span></span><span className={`admin-categorias__estado${categoria.estado === 'BORRADOR' ? ' admin-categorias__estado--borrador' : ''}`}>{categoria.estado}</span><Link className="admin-categorias__editar" to={`/admin/categorias/${categoria.id}/editar${sufijo}`} aria-label={`Editar categoría: ${categoria.nombre}`}>Editar</Link></li>)}</ul></div> : <p className="admin-preguntas__vacio">No hay categorías que coincidan con la búsqueda.</p>}
      </section>}
    </div>
  </MarcoTorneo>
}
