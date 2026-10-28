import { Link as Enlace, NavLink as EnlaceNavegacion, useLocation as usarUbicacion } from 'react-router-dom'
import BotonCerrarSesion from './BotonCerrarSesion.jsx'
import EnlaceAdministracion from './EnlaceAdministracion.jsx'
import { obtenerPerfilEnCache } from '../servicios/servicioPerfil.js'
import '../estilos/estilosPerfil.css'

const enlaces = [
  { destino: '/home', titulo: 'Inicio', simbolo: '⌂' },
  { destino: '/jugar', titulo: 'Jugar', simbolo: '▶' },
  { destino: '/torneos', titulo: 'Torneos', simbolo: '◆' },
  { destino: '/ranking', titulo: 'Ranking', simbolo: '★' },
  { destino: '/perfil', titulo: 'Perfil', simbolo: '●' },
]

export default function MarcoPerfil({ tituloMovil, subtituloMovil, perfil, children }) {
  const perfilVisible = perfil ?? obtenerPerfilEnCache()
  const iniciales = perfilVisible?.iniciales || 'FQ'
  const puntaje = perfilVisible?.puntajeTotal
  const etiquetaRol = perfilVisible?.rol === 'ADMINISTRADOR' ? 'Administrador' : 'Jugador'
  const textoPuntaje = puntaje == null ? 'No disponible' : `${etiquetaRol} · ${puntaje.toLocaleString('es-AR')} pts`
  const ubicacion = usarUbicacion()
  const esAdministrador = perfilVisible?.rol === 'ADMINISTRADOR'

  return (
    <div className="perfil">
      <a className="enlace-salto" href="#contenido-perfil">Ir al contenido</a>
      <aside className="perfil__lateral">
        <Enlace className="marca perfil__marca" to="/home" aria-label="FutbolQuiz Arena">
          FUTBOLQUIZ<span className="marca__arena">ARENA</span>
        </Enlace>
        <nav className={`perfil__navegacion${esAdministrador ? ' perfil__navegacion--admin' : ''}`} aria-label="Navegación principal">
          {enlaces.map(({ destino, titulo, simbolo }) => (
            <EnlaceNavegacion key={destino} to={destino} className={({ isActive: activo }) => `perfil__enlace${activo || (destino === '/perfil' && ubicacion.pathname === '/historial') ? ' perfil__enlace--activo' : ''}`}>
              <span aria-hidden="true">{simbolo}</span>{titulo}
            </EnlaceNavegacion>
          ))}
          <EnlaceAdministracion claseEnlace="perfil__enlace" />
        </nav>
        <div className="perfil__acumulado">
          <p>PUNTAJE ACUMULADO</p>
          <span>{textoPuntaje}</span>
        </div>
      </aside>

      <header className="perfil__cabecera">
        <span className="perfil__escudo" aria-label="FutbolQuiz Arena">FQ</span>
        <div className="perfil__titulo-movil"><h1>{tituloMovil}</h1><span>{subtituloMovil}</span></div>
        <span className="perfil__avatar" aria-label="Avatar del perfil">{iniciales}</span>
        <BotonCerrarSesion />
      </header>
      {children}
    </div>
  )
}
