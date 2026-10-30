export default function PantallaCambioTurno({ jugador, onListo }) {
  const nombreJugador = jugador?.trim() || 'Siguiente jugador'
  const iniciales = nombreJugador
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase()

  return (
    <section className="duelo-local__panel duelo-local__panel--turno" aria-labelledby="titulo-cambio-turno">
      <div className="duelo-local__turno-contenido">
        <span className="duelo-local__turno-etapa">
          <span className="duelo-local__turno-punto" aria-hidden="true" />
          Cambio de turno
        </span>

        <div className="duelo-local__turno-icono" aria-hidden="true">
          <svg viewBox="0 0 48 48" fill="none">
            <rect x="16" y="6" width="20" height="36" rx="5" stroke="currentColor" strokeWidth="2" />
            <path d="M22 11h8M24 37h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="m11 19-5 5 5 5m-5-5h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h1 id="titulo-cambio-turno" className="duelo-local__turno-titulo">Pasá el dispositivo</h1>
        <p className="duelo-local__turno-descripcion">La próxima jugada es de <strong>{nombreJugador}</strong>.</p>

        <div className="duelo-local__turno-jugador">
          <span className="duelo-local__turno-avatar" aria-hidden="true">{iniciales}</span>
          <div className="duelo-local__turno-jugador-info">
            <span>Ahora juega</span>
            <strong>{nombreJugador}</strong>
          </div>
          <span className="duelo-local__turno-flecha" aria-hidden="true">→</span>
        </div>

        <button type="button" className="duelo-local__boton-primary duelo-local__turno-boton" onClick={onListo}>
          ¡Estoy listo!
          <span aria-hidden="true">→</span>
        </button>
        <p className="duelo-local__turno-ayuda">Tocá el botón cuando tengas el dispositivo.</p>
      </div>
    </section>
  )
}
