import { useEffect as usarEfecto, useState as usarEstado } from 'react'
import { Link as Enlace, useLocation as usarUbicacion, useSearchParams as usarParametrosBusqueda } from 'react-router-dom'
import MarcoTorneo from '../componentes/MarcoTorneo.jsx'
import { obtenerPerfil } from '../servicios/servicioPerfil.js'
import { obtenerPreguntasAdmin } from '../servicios/servicioPreguntasAdmin.js'
import '../estilos/estilosSalaDetalleTorneo.css'
import '../estilos/estilosPreguntasAdmin.css'

const tamanioPagina = 5

export default function PaginaPreguntasAdmin() {
  const [parametrosBusqueda] = usarParametrosBusqueda()
  const ubicacion = usarUbicacion()
  const vistaPrevia = import.meta.env.DEV && parametrosBusqueda.get('vistaPrevia') === '1'
  const sufijoVistaPrevia = vistaPrevia ? '?vistaPrevia=1' : ''
  const [rol, establecerRol] = usarEstado(null)
  const [preguntas, establecerPreguntas] = usarEstado([])
  const [cargando, establecerCargando] = usarEstado(true)
  const [mensajeError, establecerMensajeError] = usarEstado('')
  const [busqueda, establecerBusqueda] = usarEstado('')
  const [categoria, establecerCategoria] = usarEstado('todas')
  const [dificultad, establecerDificultad] = usarEstado('todas')
  const [pagina, establecerPagina] = usarEstado(1)
  const [intentoCarga, establecerIntentoCarga] = usarEstado(0)

  usarEfecto(() => {
    let vigente = true
    establecerCargando(true)
    establecerMensajeError('')
    const obtenerContenido = async () => {
      if (vistaPrevia) return { rolUsuario: 'VISTA_PREVIA', preguntasAdmin: await obtenerPreguntasAdmin() }
      const perfil = await obtenerPerfil()
      return { rolUsuario: perfil.rol, preguntasAdmin: perfil.rol === 'ADMINISTRADOR' ? await obtenerPreguntasAdmin() : [] }
    }
    obtenerContenido()
      .then(({ rolUsuario, preguntasAdmin }) => {
        if (vigente) {
          establecerRol(rolUsuario)
          establecerPreguntas(preguntasAdmin)
        }
      })
      .catch((error) => {
        if (vigente) establecerMensajeError(error.message || 'No pudimos cargar las preguntas.')
      })
      .finally(() => { if (vigente) establecerCargando(false) })
    return () => { vigente = false }
  }, [intentoCarga, vistaPrevia])

  const categorias = [...new Set(preguntas.map((pregunta) => pregunta.categoria))].sort((a, b) => a.localeCompare(b, 'es-AR'))
  const consulta = busqueda.trim().toLocaleLowerCase('es-AR')
  const filtradas = preguntas.filter((pregunta) =>
    (!consulta || pregunta.enunciado.toLocaleLowerCase('es-AR').includes(consulta)) &&
    (categoria === 'todas' || pregunta.categoria === categoria) &&
    (dificultad === 'todas' || pregunta.dificultad === dificultad)
  )
  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / tamanioPagina))
  const visibles = filtradas.slice((pagina - 1) * tamanioPagina, pagina * tamanioPagina)

  function cambiarBusqueda(valor) { establecerBusqueda(valor); establecerPagina(1) }
  function cambiarCategoria(valor) { establecerCategoria(valor); establecerPagina(1) }
  function cambiarDificultad(valor) { establecerDificultad(valor); establecerPagina(1) }

  return (
    <MarcoTorneo tituloMovil="Administración" subtituloMovil="Preguntas">
      <div className="admin-preguntas">
        <header className="admin-preguntas__encabezado">
          <div><span className="admin-preguntas__seccion">PANEL DE ADMINISTRACIÓN</span><h1>Administración</h1><p>Gestioná el banco de preguntas de FutbolQuiz Arena.</p></div>
          <Enlace to="/home">Volver al inicio</Enlace>
        </header>

        {cargando && <p className="admin-preguntas__estado" role="status">Cargando preguntas…</p>}
        {!cargando && mensajeError && <div className="admin-preguntas__estado" role="alert"><p>{mensajeError}</p><button type="button" onClick={() => establecerIntentoCarga((intento) => intento + 1)}>Reintentar</button></div>}
        {!cargando && !mensajeError && rol !== 'ADMINISTRADOR' && !vistaPrevia && <div className="admin-preguntas__estado" role="alert"><p>Solo los administradores pueden consultar esta sección.</p><Enlace to="/home">Volver al inicio</Enlace></div>}

        {!cargando && !mensajeError && (rol === 'ADMINISTRADOR' || vistaPrevia) && (
          <section className="admin-preguntas__panel" aria-labelledby="titulo-preguntas-admin">
            {ubicacion.state?.avisoPregunta && <p className="admin-preguntas__aviso" role="status">{ubicacion.state.avisoPregunta}</p>}
            {vistaPrevia && <p className="admin-preguntas__aviso" role="status">Vista previa local: rol de administrador simulado y preguntas de ejemplo.</p>}
            <div className="admin-preguntas__titulo"><div><h2 id="titulo-preguntas-admin">Preguntas</h2><p>{preguntas.length} preguntas de ejemplo</p></div><div className="admin-preguntas__acciones"><span>Datos temporales</span><Enlace to={`/admin/preguntas/nueva${sufijoVistaPrevia}`}>Nueva pregunta</Enlace></div></div>
            <div className="admin-preguntas__filtros">
              <label>Buscar pregunta<input type="search" value={busqueda} onChange={(evento) => cambiarBusqueda(evento.target.value)} placeholder="Escribí parte del enunciado" /></label>
              <label>Categoría<select value={categoria} onChange={(evento) => cambiarCategoria(evento.target.value)}><option value="todas">Todas las categorías</option>{categorias.map((nombre) => <option key={nombre} value={nombre}>{nombre}</option>)}</select></label>
              <label>Dificultad<select value={dificultad} onChange={(evento) => cambiarDificultad(evento.target.value)}><option value="todas">Todas</option><option>Fácil</option><option>Media</option><option>Difícil</option></select></label>
            </div>
            <p className="admin-preguntas__cantidad" role="status">{filtradas.length} {filtradas.length === 1 ? 'resultado' : 'resultados'}</p>
            {visibles.length ? <div className="admin-preguntas__tabla"><div className="admin-preguntas__cabecera" aria-hidden="true"><span>Pregunta</span><span>Categoría</span><span>Dificultad</span><span /></div><ul>{visibles.map((pregunta) => <li key={pregunta.id}><strong>{pregunta.enunciado}</strong><span data-etiqueta="Categoría">{pregunta.categoria}</span><span data-etiqueta="Dificultad">{pregunta.dificultad}</span><Enlace className="admin-preguntas__editar" aria-label={`Editar pregunta: ${pregunta.enunciado}`} to={`/admin/preguntas/${pregunta.id}/editar${sufijoVistaPrevia}`}>Editar</Enlace></li>)}</ul></div> : <p className="admin-preguntas__vacio">No hay preguntas que coincidan con los filtros.</p>}
            <nav className="admin-preguntas__paginacion" aria-label="Páginas de preguntas"><span>Página {pagina} de {totalPaginas}</span><div><button type="button" disabled={pagina === 1} onClick={() => establecerPagina((actual) => actual - 1)}>Anterior</button><button type="button" disabled={pagina === totalPaginas} onClick={() => establecerPagina((actual) => actual + 1)}>Siguiente</button></div></nav>
          </section>
        )}
      </div>
    </MarcoTorneo>
  )
}
