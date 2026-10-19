export default function PantallaResultadoDueloLocal({ resultado, onRevancha, onVolver }) {
  const nombreGanador = resultado?.ganadorNombre || 'Empate'
  const titulo = resultado?.ganador === 'empate' ? '¡Empate!' : `¡Ganador: ${nombreGanador}!`

  return (
    <div className="duelo-local__panel duelo-local__panel--resultado">
      <p className="sobretitulo">Resultado final</p>
      <h1 className="duelo-local__titulo">{titulo}</h1>

      <div className="duelo-local__resultado">
        <div className="duelo-local__resultado-jugador">
          <strong>{resultado?.jugador1Nombre || 'Jugador 1'}</strong>
          <span>{resultado?.puntajeJugador1 ?? 0} pts</span>
          <small>{resultado?.aciertosJugador1 ?? 0} aciertos</small>
        </div>

        <div className="duelo-local__resultado-versus">VS</div>

        <div className="duelo-local__resultado-jugador">
          <strong>{resultado?.jugador2Nombre || 'Jugador 2'}</strong>
          <span>{resultado?.puntajeJugador2 ?? 0} pts</span>
          <small>{resultado?.aciertosJugador2 ?? 0} aciertos</small>
        </div>
      </div>

      <div className="duelo-local__acciones">
        <button type="button" className="duelo-local__boton-primary" onClick={onRevancha}>
          Revancha Local
        </button>
        <button type="button" className="duelo-local__boton-secondary" onClick={onVolver}>
          Volver a Modos de Juego
        </button>
      </div>
    </div>
  )
}
