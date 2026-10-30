function formatearFecha(fecha) {
  if (!fecha) return 'Fecha no disponible'
  const valorFecha = new Date(fecha)
  if (Number.isNaN(valorFecha.getTime())) return fecha
  const mesesAbreviados = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return `${String(valorFecha.getDate()).padStart(2, '0')} ${mesesAbreviados[valorFecha.getMonth()]} ${valorFecha.getFullYear()}`
}

function obtenerTextoResultado(partida) {
  const resultado = String(partida.resultado ?? '').toUpperCase()
  if (resultado.includes('VICTORIA') || resultado === 'GANADA' || resultado === 'GANADO') return 'Victoria'
  if (resultado.includes('DERROTA') || resultado === 'PERDIDA' || resultado === 'PERDIDO') return 'Derrota'
  if (partida.respuestasCorrectas !== null && partida.totalRespuestas) return `${partida.respuestasCorrectas}/${partida.totalRespuestas}`
  return partida.resultado || 'Completada'
}

/** Resume una partida del historial y abre su detalle cuando se solicita. */
export default function TarjetaPartidaHistorial({ partida, alVerDetalle: manejarVerDetalle }) {
  const textoResultado = obtenerTextoResultado(partida)
  let tonoResultado = 'neutral'
  if (textoResultado === 'Victoria') {
    tonoResultado = 'victoria'
  } else if (textoResultado === 'Derrota') {
    tonoResultado = 'derrota'
  }
  const puntaje = partida.puntaje === null ? '—' : `${partida.puntaje.toLocaleString('es-AR')} pts`

  return (
    <tr className="historial__fila">
      <td data-etiqueta="Fecha">{formatearFecha(partida.fecha)}</td>
      <td data-etiqueta="Categoría"><span className="historial__categoria">{partida.categoria}</span></td>
      <td data-etiqueta="Modo">{partida.modo}</td>
      <td data-etiqueta="Resultado"><span className={`historial__resultado historial__resultado--${tonoResultado}`}>{textoResultado}</span></td>
      <td data-etiqueta="Puntaje"><strong className="historial__puntaje">{puntaje}</strong></td>
      <td data-etiqueta="Detalle"><button className="historial__detalle" type="button" onClick={() => manejarVerDetalle(partida)}>Ver detalle ›</button></td>
    </tr>
  )
}
