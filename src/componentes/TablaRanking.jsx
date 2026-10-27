function IndicadorPosicion({ variacion }) {
  if (variacion === null || variacion === undefined) return <span className="ranking-fila__variacion" aria-label="Variación no disponible">—</span>
  if (!variacion) return <span className="ranking-fila__variacion" aria-label="Sin cambios">—</span>
  if (variacion < 0) return <span className="ranking-fila__variacion" aria-label={`Bajó ${Math.abs(variacion)} lugares`}>↓ {Math.abs(variacion)}</span>
  return <span className="ranking-fila__variacion" aria-label={`Subió ${variacion} lugares`}>↑ {variacion}</span>
}

function FilaRanking({ usuario, propia = false }) {
  return (
    <li className={`ranking-fila${propia ? ' ranking-fila--propia' : ''}`}>
      <span className="ranking-fila__puesto">#{usuario.posicion}</span>
      <span className="ranking-fila__identidad">
        <strong>{usuario.nombre}</strong>
        <small>{usuario.puntajeTotal.toLocaleString('es-AR')} puntos{propia && usuario.variacionPosicion > 0 ? ` · Subiste ${usuario.variacionPosicion} lugares` : ''}</small>
      </span>
      <IndicadorPosicion variacion={usuario.variacionPosicion} />
    </li>
  )
}

export default function TablaRanking({ usuarios, usuarioActual }) {
  // La fila personal se muestra aparte; la lista general comienza después del podio.
  const clasificacion = usuarios.filter((usuario) => usuario.posicion > 3
    && String(usuario.id) !== String(usuarioActual?.id))

  return (
    <div className="ranking-listas">
      <section className="ranking-seccion" aria-labelledby="titulo-tu-posicion">
        <h2 className="ranking-seccion__titulo" id="titulo-tu-posicion">Tu posición</h2>
        {usuarioActual ? <ol className="ranking-seccion__lista"><FilaRanking usuario={usuarioActual} propia /></ol> : <p className="ranking-seccion__vacio">No encontramos tu posición en el ranking.</p>}
      </section>

      <section className="ranking-seccion" aria-labelledby="titulo-clasificacion">
        <h2 className="ranking-seccion__titulo" id="titulo-clasificacion">Clasificación</h2>
        {clasificacion.length ? (
          <ol className="ranking-seccion__lista">
            {clasificacion.map((usuario) => <FilaRanking key={usuario.id} usuario={usuario} />)}
          </ol>
        ) : <p className="ranking-seccion__vacio">Todavía no hay más jugadores para mostrar.</p>}
      </section>
    </div>
  )
}
