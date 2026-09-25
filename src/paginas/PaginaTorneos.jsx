import { useEffect as usarEfecto, useState as usarEstado } from 'react'
import { Link as Enlace, NavLink as EnlaceNavegacion } from 'react-router-dom'
import TarjetaTorneo from '../componentes/TarjetaTorneo.jsx'
import { obtenerMisTorneos, obtenerTorneosDisponibles, obtenerTorneosFinalizados } from '../servicios/servicioTorneos.js'
import '../estilos/estilosTorneos.css'

const enlaces = [
  { destino: '/home', titulo: 'Inicio', simbolo: '⌂' },
  { destino: '/partida-individual', titulo: 'Jugar', simbolo: '▶' },
  { destino: '/torneos', titulo: 'Torneos', simbolo: '◆' },
  { destino: '/ranking', titulo: 'Ranking', simbolo: '★' },
  { destino: '/perfil', titulo: 'Perfil', simbolo: '●' },
]

const secciones = {
  propios: {
    etiqueta: 'Mis torneos',
    titulo: 'Torneos',
    descripcion: 'Competí contra otros jugadores y llegá a la final.',
    descripcionMovil: 'Competí y llegá a la final',
    obtener: obtenerMisTorneos,
  },
  disponibles: {
    etiqueta: 'Disponibles',
    titulo: 'Torneos disponibles',
    descripcion: 'Ingresá el código para unirte. El cuadro es solo para participantes.',
    descripcionMovil: 'Encontrá tu próxima copa',
    obtener: obtenerTorneosDisponibles,
  },
  finalizados: {
    etiqueta: 'Finalizados',
    titulo: 'Torneos finalizados',
    descripcion: 'Consultá campeones y tu resultado en torneos anteriores.',
    descripcionMovil: 'Tu historial competitivo',
    obtener: obtenerTorneosFinalizados,
  },
}

export default function PaginaTorneos() {
  const [seccionActiva, establecerSeccionActiva] = usarEstado('propios')
  const [torneos, establecerTorneos] = usarEstado([])
  const [cargando, establecerCargando] = usarEstado(true)
  const [mensajeError, establecerMensajeError] = usarEstado('')
  const [busqueda, establecerBusqueda] = usarEstado('')
  const [filtro, establecerFiltro] = usarEstado('todos')
  const seccion = secciones[seccionActiva]
  const consulta = busqueda.trim().toLocaleLowerCase('es-AR')
  const torneosVisibles = seccionActiva === 'disponibles'
    ? torneos.filter((torneo) => {
        const coincideBusqueda = !consulta || torneo.nombre.toLocaleLowerCase('es-AR').includes(consulta) || (torneo.codigo || '').toLocaleLowerCase('es-AR').includes(consulta)
        const coincideFiltro = filtro === 'todos' || (filtro === 'gratis' && !torneo.requiereContrasena) || (filtro === 'hoy' && torneo.inicio.startsWith('Hoy')) || (filtro === 'extremos' && [4, 16].includes(torneo.capacidad))
        return coincideBusqueda && coincideFiltro
      })
    : torneos

  usarEfecto(() => {
    let vigente = true
    establecerCargando(true)
    establecerMensajeError('')

    seccion.obtener()
      .then((resultado) => {
        if (vigente) establecerTorneos(resultado)
      })
      .catch((error) => {
        if (vigente) {
          establecerTorneos([])
          establecerMensajeError(error.message || 'No pudimos cargar los torneos.')
        }
      })
      .finally(() => {
        if (vigente) establecerCargando(false)
      })

    return () => { vigente = false }
  }, [seccion])

  function reintentarCarga() {
    establecerCargando(true)
    establecerMensajeError('')
    seccion.obtener()
      .then(establecerTorneos)
      .catch((error) => establecerMensajeError(error.message || 'No pudimos cargar los torneos.'))
      .finally(() => establecerCargando(false))
  }

  return (
    <div className="torneos">
      <a className="enlace-salto" href="#contenido-torneos">Ir al contenido</a>
      <aside className="torneos__lateral">
        <Enlace className="marca torneos__marca" to="/home" aria-label="FutbolQuiz Arena">
          FUTBOLQUIZ<span className="marca__arena">ARENA</span>
        </Enlace>
        <nav className="torneos__navegacion" aria-label="Navegación principal">
          {enlaces.map(({ destino, titulo, simbolo }) => (
            <EnlaceNavegacion key={destino} to={destino} end={destino === '/torneos'} className={({ isActive: activo }) => `torneos__enlace${activo ? ' torneos__enlace--activo' : ''}`}>
              <span aria-hidden="true">{simbolo}</span>{titulo}
            </EnlaceNavegacion>
          ))}
        </nav>
        <div className="torneos__acumulado"><p>PUNTAJE ACUMULADO</p><span>Jugador · 2.450 pts</span></div>
      </aside>

      <header className="torneos__cabecera">
        <span className="torneos__escudo" aria-label="FutbolQuiz Arena">FQ</span>
        <div className="torneos__titulo-movil"><strong>Torneos</strong><span>{seccion.descripcionMovil}</span></div>
        <Enlace className="torneos__avatar" to="/perfil" aria-label="Ver mi perfil"><span className="torneos__iniciales">LM</span></Enlace>
      </header>

      <main className="torneos__contenido" id="contenido-torneos">
        <div className="torneos__introduccion">
          <div>
            <h1>{seccion.titulo}</h1>
            <p>{seccion.descripcion}</p>
          </div>
          {seccionActiva === 'propios' && <Enlace className="torneos__boton torneos__boton--principal" to="/torneos/crear">Crear torneo</Enlace>}
          {seccionActiva === 'disponibles' && <Enlace className="torneos__boton torneos__boton--secundario" to="/torneos/unirse">Ingresar código</Enlace>}
        </div>

        <nav className="torneos__pestanas" aria-label="Listados de torneos">
          {Object.entries(secciones).map(([clave, datosSeccion]) => (
            <button key={clave} type="button" aria-pressed={seccionActiva === clave}
              className={seccionActiva === clave ? 'torneos__pestana torneos__pestana--activa' : 'torneos__pestana'}
              onClick={() => establecerSeccionActiva(clave)}>
              {datosSeccion.etiqueta}
            </button>
          ))}
        </nav>

        {seccionActiva === 'disponibles' && (
          <div className="torneos__filtros">
            <label><span aria-hidden="true">⌕</span><span className="solo-lectores">Buscar torneo</span><input type="search" placeholder="Buscar por nombre o código" value={busqueda} onChange={(evento) => establecerBusqueda(evento.target.value)} /></label>
            <div aria-label="Filtros de torneos">
              {[['todos', 'Todos'], ['gratis', 'Gratis'], ['hoy', 'Hoy'], ['extremos', '4–16']].map(([valor, etiqueta]) => (
                <button key={valor} type="button" className={filtro === valor ? 'activo' : ''} aria-pressed={filtro === valor} onClick={() => establecerFiltro(valor)}>{etiqueta}</button>
              ))}
            </div>
          </div>
        )}

        {cargando && <section className="torneos__estado" aria-live="polite"><span className="torneos__carga" aria-hidden="true" /><p>Cargando torneos…</p></section>}
        {!cargando && mensajeError && <section className="torneos__estado" role="alert"><p>{mensajeError}</p><button type="button" onClick={reintentarCarga}>Reintentar</button></section>}
        {!cargando && !mensajeError && torneosVisibles.length === 0 && <section className="torneos__estado"><p>No hay torneos para mostrar en esta sección.</p></section>}

        {!cargando && !mensajeError && torneosVisibles.length > 0 && (
          <section className={`torneos__listado torneos__listado--${seccionActiva}`} aria-label={seccion.etiqueta}>
            <h2 className="torneos__titulo-listado">{seccionActiva === 'propios' ? 'ACTIVOS' : seccionActiva === 'finalizados' ? 'ÚLTIMOS RESULTADOS' : 'TORNEOS DISPONIBLES'}</h2>
            <div className="torneos__encabezados" aria-hidden="true">
              {seccionActiva === 'propios' && <><span>Nombre</span><span>Formato</span><span>Inicio</span><span>Jugadores</span><span>Estado</span><span /></>}
              {seccionActiva === 'finalizados' && <><span>Torneo</span><span>Fecha</span><span>Campeón</span><span>Tu resultado</span><span /></>}
            </div>
            <div className="torneos__tarjetas">
              {torneosVisibles.map((torneo) => <TarjetaTorneo key={torneo.id} torneo={torneo} tipo={seccionActiva} />)}
            </div>
            {seccionActiva === 'disponibles' && <p className="torneos__deslizar">Deslizá para ver más torneos</p>}
          </section>
        )}

        {seccionActiva === 'propios' && !cargando && (
          <section className="torneos__acciones" aria-label="Acciones rápidas">
            <h2>ACCIONES RÁPIDAS</h2>
            <div>
              <Enlace to="/torneos/crear"><span aria-hidden="true">＋</span><strong>Crear torneo</strong><small>Configurá reglas</small></Enlace>
              <Enlace to="/torneos/unirse"><span aria-hidden="true">→</span><strong>Unirme</strong><small>Ingresá un código</small></Enlace>
            </div>
          </section>
        )}

        {seccionActiva === 'propios' && !cargando && <aside className="torneos__mejor-puesto"><span>🏆 Tu historial</span><strong>Consultá tus resultados en Finalizados</strong></aside>}
        {seccionActiva === 'finalizados' && !cargando && <aside className="torneos__resumen"><span>HISTORIAL DE TORNEOS</span><strong>{torneos.length} {torneos.length === 1 ? 'torneo finalizado' : 'torneos finalizados'}</strong></aside>}
      </main>
    </div>
  )
}
