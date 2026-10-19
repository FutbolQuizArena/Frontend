import { Link as Enlace } from 'react-router-dom'

export default function PaginaPendiente({ titulo, destinoAccion, textoAccion }) {
  return (
    <main className="pagina-no-encontrada">
      <p className="sobretitulo">FUTBOLQUIZ ARENA</p>
      <h1>{titulo}</h1>
      <p>Estamos preparando esta sección. Pronto vas a poder disfrutarla.</p>
      {destinoAccion && <Enlace to={destinoAccion}>{textoAccion}</Enlace>}
      {destinoAccion && <span aria-hidden="true"> · </span>}
      <Enlace to="/home">Volver al inicio</Enlace>
    </main>
  )
}
