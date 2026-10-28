import { useEffect as usarEfecto, useState as usarEstado } from 'react'
import { Link as Enlace, NavLink as EnlaceNavegacion, useLocation } from 'react-router-dom'
import EnlaceAdministracion from './EnlaceAdministracion.jsx'
import { obtenerPerfil, obtenerPerfilEnCache } from '../servicios/servicioPerfil.js'

const enlaces = [
  { destino: '/home', titulo: 'Inicio', simbolo: '⌂' },
  { destino: '/jugar', titulo: 'Jugar', simbolo: '▶' },
  { destino: '/torneos', titulo: 'Torneos', simbolo: '◆' },
  { destino: '/ranking', titulo: 'Ranking', simbolo: '★' },
  { destino: '/perfil', titulo: 'Perfil', simbolo: '●' },
]

export default function MarcoTorneo({ children: contenido, tituloMovil, subtituloMovil, administrador = false, sufijoAdmin = '', claseAdicional = '', inicialesUsuario }) {
  const [usuario, establecerUsuario] = usarEstado(obtenerPerfilEnCache)
  const ubicacion = useLocation()
  const etiquetaRolUsuario = usuario?.rol === 'ADMINISTRADOR' ? 'Administrador' : 'Jugador'
  const textoPuntajeAcumulado = usuario
    ? `${etiquetaRolUsuario} · ${usuario.puntajeTotal.toLocaleString('es-AR')} pts`
    : 'Cargando…'
  const clasesMarco = ['marco-torneo', administrador && 'marco-admin', claseAdicional].filter(Boolean).join(' ')
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
    <div className={clasesMarco}>
      <a className="enlace-salto" href="#contenido-torneo">Ir al contenido</a>
      <aside className="marco-torneo__lateral">
        <Enlace className="marca marco-torneo__marca" to="/home" aria-label="FutbolQuiz Arena">FUTBOLQUIZ<span className="marca__arena">{administrador ? 'ADMIN' : 'ARENA'}</span></Enlace>
        <nav className="marco-torneo__navegacion" aria-label="Navegación principal">
          {administrador && <p className="marco-admin__gestion">GESTIÓN</p>}
          {(administrador ? enlacesAdmin : enlaces).map(({ destino, titulo, simbolo }) => (
            <EnlaceNavegacion key={destino} to={destino} end={administrador && destino.startsWith('/admin')} aria-current={esFormularioDeSeccion(destino) ? 'page' : undefined} className={({ isActive: activo }) => `marco-torneo__enlace${(activo || esFormularioDeSeccion(destino) || (destino === '/perfil' && ubicacion.pathname === '/historial')) ? ' marco-torneo__enlace--activo' : ''}`}>
              <span aria-hidden="true">{simbolo}</span>{titulo}
            </EnlaceNavegacion>
          ))}
          {!administrador && <EnlaceAdministracion claseEnlace="marco-torneo__enlace" />}
        </nav>
        <div className="marco-torneo__acumulado"><p>{administrador ? 'Rol: Administrador' : 'PUNTAJE ACUMULADO'}</p><span hidden={administrador}>{textoPuntajeAcumulado}</span></div>
      </aside>

      <header className="marco-torneo__cabecera">
        <span className="marco-torneo__escudo" aria-label="FutbolQuiz Arena">FQ</span>
        <div className="marco-torneo__titulo-movil"><strong>{tituloMovil}</strong><span>{subtituloMovil}</span></div>
        {/* Permite que pantallas con datos propios del usuario prioricen sus iniciales calculadas. */}
        <Enlace className="marco-torneo__avatar" to="/perfil" aria-label="Ver mi perfil"><span>{inicialesUsuario || usuario?.iniciales || 'FQ'}</span></Enlace>
      </header>

      <main id="contenido-torneo" className="marco-torneo__contenido">{contenido}</main>
      {administrador && <nav className="marco-admin__juego-movil" aria-label="Secciones de administración">{enlacesAdmin.map(({ destino, titulo, simbolo }) => <Enlace key={destino} to={destino}><span aria-hidden="true">{simbolo}</span>{titulo}</Enlace>)}</nav>}
    </div>
  )
}
