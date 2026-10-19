export default function MarcadorDuelo({ categoriaActual, tiempoRestante, tiempoTotal }) {
  const porcentaje = tiempoTotal ? (tiempoRestante / tiempoTotal) * 100 : 0

  return (
    <div className="partida-duelo__marcador">
      <div className="partida-duelo__categoria">
        <span>Categoría</span>
        <strong>{categoriaActual}</strong>
      </div>

      <div className="partida-duelo__temporizador" aria-live="polite">
        <span>Tiempo</span>
        <strong>{tiempoRestante}s</strong>
      </div>

      <div className="partida-duelo__barra-tiempo" aria-label="Tiempo restante de la pregunta">
        <div style={{ width: `${Math.max(0, Math.min(100, porcentaje))}%` }} />
      </div>
    </div>
  )
}
