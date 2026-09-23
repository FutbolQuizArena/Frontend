const nombresTorneosTemporales = new Set()

function generarCodigoTemporal() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

export function crearTorneo(datosTorneo) {
  // TODO: reemplazar por endpoint real cuando el backend de torneos esté listo
  return new Promise((resolver, rechazar) => {
    setTimeout(() => {
      const nombreNormalizado = datosTorneo.nombre.trim().toLocaleLowerCase('es-AR')

      if (nombresTorneosTemporales.has(nombreNormalizado)) {
        rechazar(new Error('Ya existe un torneo temporal con ese nombre.'))
        return
      }

      nombresTorneosTemporales.add(nombreNormalizado)
      resolver({ codigoTemporal: generarCodigoTemporal() })
    }, 350)
  })
}
