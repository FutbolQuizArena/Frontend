/** Unifica el aspecto y los estados de carga de los botones de acción. */
export default function Boton({
  children: contenido,
  tipo = 'button',
  cargando = false,
  deshabilitado = false,
  textoCargando = 'Enviando…',
  alHacerClic,
}) {
  return (
    <button
      className="boton"
      type={tipo}
      disabled={deshabilitado || cargando}
      aria-busy={cargando}
      onClick={alHacerClic}
    >
      {cargando ? textoCargando : contenido}
    </button>
  )
}
