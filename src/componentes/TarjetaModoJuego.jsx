import { Link as Enlace } from 'react-router-dom'

export default function TarjetaModoJuego({ titulo, descripcion, destino, icono, etiqueta }) {
  return (
    <Enlace className="tarjeta-modo-juego" to={destino} aria-label={`${titulo}: ${descripcion}`}>
      <span className="tarjeta-modo-juego__icono" aria-hidden="true">{icono}</span>
      <div className="tarjeta-modo-juego__contenido">
        <span className="tarjeta-modo-juego__etiqueta">{etiqueta}</span>
        <h2>{titulo}</h2>
        <p>{descripcion}</p>
      </div>
      <span className="tarjeta-modo-juego__flecha" aria-hidden="true">→</span>
    </Enlace>
  )
}
