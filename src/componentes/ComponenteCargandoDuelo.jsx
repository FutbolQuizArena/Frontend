/** Muestra la animación visual durante la búsqueda de un rival. */
export default function ComponenteCargandoDuelo() {
  return (
    <output className="cargando-duelo" aria-label="Buscando rival">
      <span className="cargando-duelo__anillo" aria-hidden="true" />
      <span className="cargando-duelo__anillo cargando-duelo__anillo--dos" aria-hidden="true" />
      <span className="cargando-duelo__centro" aria-hidden="true">VS</span>
    </output>
  )
}
