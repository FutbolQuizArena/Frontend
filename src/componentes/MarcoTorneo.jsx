import { useEffect as usarEfecto, useState as usarEstado } from 'react'
import { Link as Enlace, NavLink as EnlaceNavegacion, useLocation } from 'react-router-dom'
import { obtenerPerfil } from '../servicios/servicioPerfil.js'

const enlaces = [
  { destino: '/home', titulo: 'Inicio', simbolo: '⌂' },
  { destino: '/partida-individual', titulo: 'Jugar', simbolo: '▶' },
  { destino: '/torneos', titulo: 'Torneos', simbolo: '◆' },
  { destino: '/ranking', titulo: 'Ranking', simbolo: '★' },
  { destino: '/perfil', titulo: 'Perfil', simbolo: '●' },
]

export default function MarcoTorneo({ children: contenido, tituloMovil, subtituloMovil, administrador = false, sufijoAdmin = '' }) {
  const [usuario, establecerUsuario] = usarEstado(null)
  const ubicacion = useLocation()
  const enlacesAdmin = [
    { destino: `/admin${sufijoAdmin}`, titulo: 'Preguntas', simbolo: '?' },
    { destino: `/admin/categorias${sufijoAdmin}`, titulo: 'Categorías', simbolo: '▦' },
    { destino: `/admin/usuarios${sufijoAdmin}`, titulo: 'Usuarios', simbolo: '●' },
    { destino: '/home', titulo: 'Volver al juego', simbolo: '←' },
  ]
  function esFormularioDeSeccion(destino) {
    const ruta = destino.split('?')[0]
    return ruta === '/admin'
      ? ubicacion.pathname.startsWith('/admin/preguntas/')
      : ruta.startsWith('/admin/') && ubicacion.pathname.startsWith(`${ruta}/`)
  }

  usarEfecto(() => {
    let vigente = true
    obtenerPerfil().then((perfil) => { if (vigente) establecerUsuario(perfil) }).catch(() => {})
    return () => { vigente = false }
  }, [])

  return (
    <div className={`marco-torneo${administrador ? ' marco-admin' : ''}`}>
      <a className="enlace-salto" href="#contenido-torneo">Ir al contenido</a>
      <aside className="marco-torneo__lateral">
        <Enlace className="marca marco-torneo__marca" to="/home" aria-label="FutbolQuiz Arena">FUTBOLQUIZ<span className="marca__arena">{administrador ? 'ADMIN' : 'ARENA'}</span></Enlace>
        <nav className="marco-torneo__navegacion" aria-label="Navegación principal">
          {administrador && <p className="marco-admin__gestion">GESTIÓN</p>}
          {(administrador ? enlacesAdmin : [...enlaces, ...(usuario?.rol === 'ADMINISTRADOR' ? [{ destino: '/admin', titulo: 'Administración', simbolo: '⚙' }] : [])]).map(({ destino, titulo, simbolo }) => (
            <EnlaceNavegacion key={destino} to={destino} end={administrador && destino.startsWith('/admin')} aria-current={esFormularioDeSeccion(destino) ? 'page' : undefined} className={({ isActive: activo }) => `marco-torneo__enlace${(activo || esFormularioDeSeccion(destino)) ? ' marco-torneo__enlace--activo' : ''}`}>
              <span aria-hidden="true">{simbolo}</span>{titulo}
            </EnlaceNavegacion>
          ))}
        </nav>
        <div className="marco-torneo__acumulado"><p>{administrador ? 'Rol: Administrador' : 'PUNTAJE ACUMULADO'}</p><span hidden={administrador}>{usuario ? `${usuario.rol === 'ADMINISTRADOR' ? 'Administrador' : 'Jugador'} · ${usuario.puntajeTotal.toLocaleString('es-AR')} pts` : 'Cargando…'}</span></div>
      </aside>

      <header className="marco-torneo__cabecera">
        <span className="marco-torneo__escudo" aria-label="FutbolQuiz Arena">FQ</span>
        <div className="marco-torneo__titulo-movil"><strong>{tituloMovil}</strong><span>{subtituloMovil}</span></div>
        <Enlace className="marco-torneo__avatar" to="/perfil" aria-label="Ver mi perfil"><span>{usuario?.iniciales || 'FQ'}</span></Enlace>
      </header>

      <main id="contenido-torneo" className="marco-torneo__contenido">{contenido}</main>
      {administrador && <nav className="marco-admin__juego-movil" aria-label="Secciones de administración">{enlacesAdmin.map(({ destino, titulo, simbolo }) => <Enlace key={destino} to={destino}><span aria-hidden="true">{simbolo}</span>{titulo}</Enlace>)}</nav>}
    </div>
  )
}
