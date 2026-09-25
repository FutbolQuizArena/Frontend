import { NavLink } from 'react-router-dom'

export default function NavegacionAdmin({ vistaPrevia = false }) {
  const sufijo = vistaPrevia ? '?vistaPrevia=1' : ''
  return <nav className="admin-preguntas__navegacion" aria-label="Secciones de administración">
    <NavLink to={`/admin${sufijo}`} end className={({ isActive }) => isActive ? 'activo' : ''}>Preguntas</NavLink>
    <NavLink to={`/admin/categorias${sufijo}`} className={({ isActive }) => isActive ? 'activo' : ''}>Categorías</NavLink>
  </nav>
}
