import { NavLink as EnlaceNavegacion } from 'react-router-dom'
import EnlaceAdministracion from './EnlaceAdministracion.jsx'

/** Comparte los enlaces principales y permite elegir el destino del acceso a Jugar. */
export default function NavegacionInicio({ destinoJugar = '/jugar' }) {
  const enlaces = [
    { destino: '/home', titulo: 'Inicio', simbolo: '⌂' },
    { destino: destinoJugar, titulo: 'Jugar', simbolo: '▶' },
    { destino: '/torneos', titulo: 'Torneos', simbolo: '◆' },
    { destino: '/ranking', titulo: 'Ranking', simbolo: '★' },
    { destino: '/perfil', titulo: 'Perfil', simbolo: '●' },
  ]

  return <nav className="inicio__navegacion" aria-label="Navegación principal">
    {enlaces.map(({ destino, titulo, simbolo }) => (
      <EnlaceNavegacion
        key={destino}
        to={destino}
        className={({ isActive: activo }) => `inicio__enlace${activo ? ' inicio__enlace--activo' : ''}`}
      >
        <span aria-hidden="true">{simbolo}</span>
        {titulo}
      </EnlaceNavegacion>
    ))}
    <EnlaceAdministracion claseEnlace="inicio__enlace" />
  </nav>
}
