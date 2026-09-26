export default function TarjetaComparativaDuelo({
  jugador,
  esLocal = false,
  esGanador = false,
  esEmpate = false,
  enEspera = false,
}) {
  const resultadoEtiqueta = enEspera
    ? (esLocal ? 'Completado' : 'Respondiendo...')
    : (esGanador ? 'Ganador' : esEmpate ? 'Empate' : 'Rival')

  return (
    <article className={`tarjeta-comparativa-duelo${esLocal ? ' tarjeta-comparativa-duelo--local' : ''}`}>
      <div className="tarjeta-comparativa-duelo__encabezado">
        <div className="tarjeta-comparativa-duelo__avatar" aria-label={`Avatar de ${jugador?.nombre ?? 'jugador'}`}>
          {jugador?.avatar ?? 'J'}
        </div>

        <div className="tarjeta-comparativa-duelo__identidad">
          <strong>{jugador?.nombre ?? 'Jugador'}</strong>
          <span>{jugador?.alias ?? 'Alias'}</span>
        </div>

        <span className="tarjeta-comparativa-duelo__estado">{resultadoEtiqueta}</span>
      </div>

      <div className="tarjeta-comparativa-duelo__datos">
        <div className="tarjeta-comparativa-duelo__dato">
          <span>Puntaje</span>
          <strong>{enEspera && !esLocal ? '—' : (jugador?.puntaje ?? 0)}</strong>
        </div>
        <div className="tarjeta-comparativa-duelo__dato">
          <span>Aciertos</span>
          <strong>{enEspera && !esLocal ? '—' : `${jugador?.aciertos ?? 0}/${jugador?.totalPreguntas ?? 10}`}</strong>
        </div>
        <div className="tarjeta-comparativa-duelo__dato">
          <span>Tiempo</span>
          <strong>{enEspera && !esLocal ? '—' : `${jugador?.tiempoPromedio ?? 0}s`}</strong>
        </div>
      </div>
    </article>
  )
}
