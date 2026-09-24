export default function ComponenteCargandoDuelo() {
  return (
    <div className="cargando-duelo" aria-label="Buscando rival" role="status">
      <span className="cargando-duelo__anillo" aria-hidden="true" />
      <span className="cargando-duelo__anillo cargando-duelo__anillo--dos" aria-hidden="true" />
      <span className="cargando-duelo__centro" aria-hidden="true">VS</span>
    </div>
  )
}
