export default function TarjetaJugadorDuelo({
  nombre,
  alias,
  avatar,
  puntaje,
  aciertos,
  estado,
  local = false,
}) {
  return (
    <article className={`partida-duelo__jugador ${local ? 'partida-duelo__jugador--local' : 'partida-duelo__jugador--rival'}`}>
      <div className={`partida-duelo__avatar ${local ? 'partida-duelo__avatar--local' : 'partida-duelo__avatar--rival'}`} aria-label={local ? `Jugador local ${nombre}` : `Rival ${nombre}`}>
        {avatar}
      </div>

      <div className="partida-duelo__datos-jugador">
        <span className="partida-duelo__tipo-jugador">{local ? 'Tú' : 'Rival'}</span>
        <h2>{nombre}</h2>
        <p>{alias}</p>
      </div>

      <div className="partida-duelo__estadisticas-jugador">
        <strong>{puntaje}</strong>
        <span>{aciertos} aciertos</span>
      </div>

      <div className="partida-duelo__estado-jugador">
        {estado}
      </div>
    </article>
  )
}
