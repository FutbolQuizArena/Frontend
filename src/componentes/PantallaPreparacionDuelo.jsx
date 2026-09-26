export default function PantallaPreparacionDuelo({ nombres, onChange, onIniciar, cargando = false, error = '' }) {
  return (
    <div className="duelo-local__panel duelo-local__panel--preparacion">
      <p className="sobretitulo">DUEL0 LOCAL</p>
      <h1 className="duelo-local__titulo">Preparación del duelo</h1>

      <div className="duelo-local__formulario">
        <label className="duelo-local__campo">
          <span>Jugador 1</span>
          <input
            type="text"
            value={nombres.jugador1}
            onChange={(evento) => onChange('jugador1', evento.target.value)}
            aria-label="Jugador 1"
            placeholder="Nombre del Jugador 1"
          />
        </label>

        <label className="duelo-local__campo">
          <span>Jugador 2</span>
          <input
            type="text"
            value={nombres.jugador2}
            onChange={(evento) => onChange('jugador2', evento.target.value)}
            aria-label="Jugador 2"
            placeholder="Nombre del Jugador 2"
          />
        </label>
      </div>

      {error && <p className="duelo-local__error" role="alert">{error}</p>}

      <button type="button" className="duelo-local__boton-primary" onClick={onIniciar} disabled={cargando}>
        {cargando ? 'Cargando preguntas…' : 'Comenzar Duelo'}
      </button>
    </div>
  )
}
