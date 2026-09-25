function obtenerIniciales(nombre) {
  return nombre
    .split(/[\s_]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase()
}

export default function ListaParticipantesTorneo({ participantes, capacidad }) {
  const lugaresDisponibles = Math.max(capacidad - participantes.length, 0)
  const lugares = [
    ...participantes.map((participante) => ({ ...participante, disponible: false })),
    ...Array.from({ length: lugaresDisponibles }, (_, indice) => ({ id: `disponible-${indice}`, disponible: true })),
  ]

  return (
    <section className="lista-participantes" aria-labelledby="titulo-participantes">
      <h2 id="titulo-participantes">Participantes · {participantes.length}/{capacidad}</h2>
      <p className="lista-participantes__etiqueta-movil">JUGADORES</p>
      <div className="lista-participantes__grilla">
        {lugares.map((participante, indice) => {
          const esOrganizador = participante.esCreador
          return (
            <article className={`lista-participantes__jugador${participante.disponible ? ' lista-participantes__jugador--disponible' : ''}`} key={participante.id}>
              <span className={`lista-participantes__avatar${participante.disponible ? '' : ` lista-participantes__avatar--${indice % 3}`}`} aria-hidden="true">
                {participante.disponible ? '+' : obtenerIniciales(participante.nombre)}
              </span>
              <div>
                <strong>{participante.disponible ? 'Lugar disponible' : participante.nombre}{esOrganizador ? <span className="lista-participantes__creador"> (creador)</span> : null}</strong>
                {!participante.disponible && <small>LISTO</small>}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
