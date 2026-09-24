import { useEffect as usarEfecto, useState as usarEstado } from 'react'
import { Link as Enlace, NavLink as EnlaceNavegacion } from 'react-router-dom'
import { obtenerPerfil } from '../servicios/servicioPerfil.js'

const enlaces = [
  { destino: '/home', titulo: 'Inicio', simbolo: '⌂' },
  { destino: '/partida-individual', titulo: 'Jugar', simbolo: '▶' },
  { destino: '/torneos', titulo: 'Torneos', simbolo: '◆' },
  { destino: '/ranking', titulo: 'Ranking', simbolo: '★' },
  { destino: '/perfil', titulo: 'Perfil', simbolo: '●' },
]

export default function MarcoTorneo({ children: contenido, tituloMovil, subtituloMovil }) {
  const [usuario, establecerUsuario] = usarEstado(null)

  usarEfecto(() => {
    let vigente = true
    obtenerPerfil().then((perfil) => { if (vigente) establecerUsuario(perfil) }).catch(() => {})
    return () => { vigente = false }
  }, [])

  return (
    <div className="marco-torneo">
      <a className="enlace-salto" href="#contenido-torneo">Ir al contenido</a>
      <aside className="marco-torneo__lateral">
        <Enlace className="marca marco-torneo__marca" to="/home" aria-label="FutbolQuiz Arena">FUTBOLQUIZ<span className="marca__arena">ARENA</span></Enlace>
        <nav className="marco-torneo__navegacion" aria-label="Navegación principal">
          {enlaces.map(({ destino, titulo, simbolo }) => (
            <EnlaceNavegacion key={destino} to={destino} end={destino === '/torneos'} className={({ isActive: activo }) => `marco-torneo__enlace${activo ? ' marco-torneo__enlace--activo' : ''}`}>
              <span aria-hidden="true">{simbolo}</span>{titulo}
            </EnlaceNavegacion>
          ))}
        </nav>
        <div className="marco-torneo__acumulado"><p>PUNTAJE ACUMULADO</p><span>{usuario ? `${usuario.rol === 'ADMINISTRADOR' ? 'Administrador' : 'Jugador'} · ${usuario.puntajeTotal.toLocaleString('es-AR')} pts` : 'Cargando…'}</span></div>
      </aside>

      <header className="marco-torneo__cabecera">
        <span className="marco-torneo__escudo" aria-label="FutbolQuiz Arena">FQ</span>
        <div className="marco-torneo__titulo-movil"><strong>{tituloMovil}</strong><span>{subtituloMovil}</span></div>
        <Enlace className="marco-torneo__avatar" to="/perfil" aria-label="Ver mi perfil"><span>{usuario?.iniciales || 'FQ'}</span></Enlace>
      </header>

      <main id="contenido-torneo" className="marco-torneo__contenido">{contenido}</main>
    </div>
  )
}
