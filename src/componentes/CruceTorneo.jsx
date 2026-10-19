function FilaJugador({ jugador, esGanador }) {
  const iniciales = jugador.nombre
    .split(/[_\s]+/)
    .map((parte) => parte[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className={`cruce-torneo__jugador${esGanador ? ' cruce-torneo__jugador--ganador' : ''}`}>
      <span className="cruce-torneo__avatar" aria-hidden="true">{iniciales}</span>
      <strong>{jugador.nombre}</strong>
      <span className="cruce-torneo__puntaje">{jugador.puntaje ?? '—'}</span>
    </div>
  )
}

export default function CruceTorneo({ cruce, destacado = false }) {
  const enCurso = cruce.estado === 'EN_CURSO'

  return (
    <article className={`cruce-torneo${destacado || enCurso ? ' cruce-torneo--destacado' : ''}`} aria-label={`Partido entre ${cruce.jugadorA.nombre} y ${cruce.jugadorB.nombre}`}>
      {enCurso && <span className="cruce-torneo__estado">EN CURSO</span>}
      <FilaJugador jugador={cruce.jugadorA} esGanador={cruce.ganadorId === cruce.jugadorA.id} />
      <FilaJugador jugador={cruce.jugadorB} esGanador={cruce.ganadorId === cruce.jugadorB.id} />
    </article>
  )
}
