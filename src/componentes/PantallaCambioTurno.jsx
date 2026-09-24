export default function PantallaCambioTurno({ jugador, onListo }) {
  return (
    <div className="duelo-local__panel duelo-local__panel--turno">
      <p className="sobretitulo">Cambio de turno</p>
      <h2 className="duelo-local__titulo">Pasa el dispositivo</h2>
      <p className="duelo-local__mensaje">{jugador ? `a ${jugador}` : 'al siguiente jugador'}</p>
      <div className="duelo-local__turno-actual">
        <span>Turno de</span>
        <strong>{jugador || 'Siguiente jugador'}</strong>
      </div>

      <button type="button" className="duelo-local__boton-primary" onClick={onListo}>
        ¡Estoy Listo!
      </button>
    </div>
  )
}
