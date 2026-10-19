import { Link as Enlace } from 'react-router-dom'

export default function TarjetaModo({ titulo, descripcion, destino, textoEnlace }) {
  return (
    <article className="tarjeta-modo">
      <div><h2>{titulo}</h2><p>{descripcion}</p></div>
      <Enlace to={destino}>{textoEnlace}</Enlace>
    </article>
  )
}
