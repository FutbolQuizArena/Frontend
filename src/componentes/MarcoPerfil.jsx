import { Link as Enlace, NavLink as EnlaceNavegacion } from 'react-router-dom'
import BotonCerrarSesion from './BotonCerrarSesion.jsx'
import '../estilos/estilosPerfil.css'

const enlaces = [
  { destino: '/home', titulo: 'Inicio', simbolo: '⌂' },
  { destino: '/partida-individual', titulo: 'Jugar', simbolo: '▶' },
  { destino: '/torneos', titulo: 'Torneos', simbolo: '◆' },
  { destino: '/ranking', titulo: 'Ranking', simbolo: '★' },
  { destino: '/perfil', titulo: 'Perfil', simbolo: '●' },
]

export default function MarcoPerfil({ tituloMovil, subtituloMovil, perfil, children }) {
  const iniciales = perfil?.iniciales || 'FQ'
  const puntaje = perfil?.puntajeTotal

  return (
    <div className="perfil">
      <a className="enlace-salto" href="#contenido-perfil">Ir al contenido</a>
      <aside className="perfil__lateral">
        <Enlace className="marca perfil__marca" to="/home" aria-label="FutbolQuiz Arena">
          FUTBOLQUIZ<span className="marca__arena">ARENA</span>
        </Enlace>
        <nav className="perfil__navegacion" aria-label="Navegación principal">
          {enlaces.map(({ destino, titulo, simbolo }) => (
            <EnlaceNavegacion key={destino} to={destino} className={({ isActive: activo }) => `perfil__enlace${activo ? ' perfil__enlace--activo' : ''}`}>
              <span aria-hidden="true">{simbolo}</span>{titulo}
            </EnlaceNavegacion>
          ))}
        </nav>
        <div className="perfil__acumulado">
          <p>PUNTAJE ACUMULADO</p>
          <span>{puntaje == null ? 'No disponible' : `${perfil.rol === 'ADMINISTRADOR' ? 'Administrador' : 'Jugador'} · ${puntaje.toLocaleString('es-AR')} pts`}</span>
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
