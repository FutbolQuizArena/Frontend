export function navegarConManejo(navegar, destino, opciones) {
  const registrarError = (error) => {
    console.error(`No se pudo navegar a ${destino}.`, error)
  }

  try {
    void Promise.resolve(navegar(destino, opciones)).catch(registrarError)
  } catch (error) {
    registrarError(error)
  }
}
