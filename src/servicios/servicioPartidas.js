export const categoriasPartidas = [
  'Historia',
  'Mundiales',
  'Clubes',
  'Jugadores',
  'Reglas',
  'Tácticas',
]

export function obtenerCategoriaAleatoria(categorias = categoriasPartidas) {
  // TODO: reemplazar por endpoint real cuando el backend del motor de partidas esté listo
  if (!Array.isArray(categorias) || categorias.length === 0) {
    return null
  }

  const indiceAleatorio = Math.floor(Math.random() * categorias.length)
  const categoriaElegida = categorias[indiceAleatorio]

  return typeof categoriaElegida === 'string' ? { nombre: categoriaElegida } : categoriaElegida
}

export default {
  obtenerCategoriaAleatoria,
}
