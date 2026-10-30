/** Destaca a uno de los primeros puestos del ranking. */
export default function TarjetaPodio({ usuario, puesto, destacada = false }) {
  // En el podio se muestra el nombre corto; la etiqueta accesible conserva el nombre completo.
  const nombre = usuario.nombre.split(/\s+/)[0]

  return (
    <article className={`ranking-podio__tarjeta${destacada ? ' ranking-podio__tarjeta--destacada' : ''}`} aria-label={`Puesto ${puesto}: ${usuario.nombre}, ${usuario.puntajeTotal.toLocaleString('es-AR')} puntos`}>
      <span className="ranking-podio__puesto">#{puesto}</span>
      <strong className="ranking-podio__nombre">{nombre}</strong>
      <span className="ranking-podio__puntaje">{usuario.puntajeTotal.toLocaleString('es-AR')} pts</span>
    </article>
  )
}
