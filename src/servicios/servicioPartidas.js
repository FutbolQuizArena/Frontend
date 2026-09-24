export const categoriasPartidas = [
  'Historia',
  'Mundiales',
  'Clubes',
  'Jugadores',
  'Reglas',
  'Tácticas',
]

const preguntasBase = {
  Historia: [
    { id: 'historia-1', categoria: 'Historia', enunciado: '¿Qué selección ganó la Copa Mundial de 2018?', opciones: [{ id: 'a', texto: 'Francia' }, { id: 'b', texto: 'Alemania' }, { id: 'c', texto: 'Brasil' }, { id: 'd', texto: 'Argentina' }], opcionCorrectaId: 'a' },
    { id: 'historia-2', categoria: 'Historia', enunciado: '¿En qué año se fundó la FIFA?', opciones: [{ id: 'a', texto: '1910' }, { id: 'b', texto: '1904' }, { id: 'c', texto: '1920' }, { id: 'd', texto: '1898' }], opcionCorrectaId: 'b' },
    { id: 'historia-3', categoria: 'Historia', enunciado: '¿Qué equipo ganó la Copa Libertadores 2023?', opciones: [{ id: 'a', texto: 'River Plate' }, { id: 'b', texto: 'Flamengo' }, { id: 'c', texto: 'Boca Juniors' }, { id: 'd', texto: 'Palmeiras' }], opcionCorrectaId: 'b' },
    { id: 'historia-4', categoria: 'Historia', enunciado: '¿Cuál es el máximo goleador histórico de la selección argentina?', opciones: [{ id: 'a', texto: 'Sergio Agüero' }, { id: 'b', texto: 'Lionel Messi' }, { id: 'c', texto: 'Gabriel Batistuta' }, { id: 'd', texto: 'Julio Cruz' }], opcionCorrectaId: 'b' },
  ],
  Mundiales: [
    { id: 'mundiales-1', categoria: 'Mundiales', enunciado: '¿Cuál selección fue campeona del Mundial 2022?', opciones: [{ id: 'a', texto: 'Francia' }, { id: 'b', texto: 'Argentina' }, { id: 'c', texto: 'Brasil' }, { id: 'd', texto: 'Alemania' }], opcionCorrectaId: 'b' },
    { id: 'mundiales-2', categoria: 'Mundiales', enunciado: '¿Qué país organizó el Mundial de 2010?', opciones: [{ id: 'a', texto: 'Sudáfrica' }, { id: 'b', texto: 'Brasil' }, { id: 'c', texto: 'Qatar' }, { id: 'd', texto: 'Alemania' }], opcionCorrectaId: 'a' },
    { id: 'mundiales-3', categoria: 'Mundiales', enunciado: '¿Cuántos mundiales ganó Brasil?', opciones: [{ id: 'a', texto: '4' }, { id: 'b', texto: '5' }, { id: 'c', texto: '6' }, { id: 'd', texto: '7' }], opcionCorrectaId: 'b' },
    { id: 'mundiales-4', categoria: 'Mundiales', enunciado: '¿Quién fue el capitán de la selección campeona del Mundial 2014?', opciones: [{ id: 'a', texto: 'Ronaldinho' }, { id: 'b', texto: 'Neymar' }, { id: 'c', texto: 'Dani Alves' }, { id: 'd', texto: 'Thomas Müller' }], opcionCorrectaId: 'c' },
  ],
  Clubes: [
    { id: 'clubes-1', categoria: 'Clubes', enunciado: '¿Qué club es conocido como “Los Blancos”?', opciones: [{ id: 'a', texto: 'Barcelona' }, { id: 'b', texto: 'Real Madrid' }, { id: 'c', texto: 'Juventus' }, { id: 'd', texto: 'Bayern' }], opcionCorrectaId: 'b' },
    { id: 'clubes-2', categoria: 'Clubes', enunciado: '¿Cuál club ganó la Champions 2024?', opciones: [{ id: 'a', texto: 'Real Madrid' }, { id: 'b', texto: 'Bayern Munich' }, { id: 'c', texto: 'Manchester City' }, { id: 'd', texto: 'Inter' }], opcionCorrectaId: 'a' },
    { id: 'clubes-3', categoria: 'Clubes', enunciado: '¿Qué equipo juega en el estadio “Etihad Stadium”?', opciones: [{ id: 'a', texto: 'Liverpool' }, { id: 'b', texto: 'Manchester City' }, { id: 'c', texto: 'Arsenal' }, { id: 'd', texto: 'Chelsea' }], opcionCorrectaId: 'b' },
    { id: 'clubes-4', categoria: 'Clubes', enunciado: '¿Qué club ganó la Copa Libertadores 2022?', opciones: [{ id: 'a', texto: 'Flamengo' }, { id: 'b', texto: 'Colo-Colo' }, { id: 'c', texto: 'Peñarol' }, { id: 'd', texto: 'River Plate' }], opcionCorrectaId: 'a' },
  ],
  Jugadores: [
    { id: 'jugadores-1', categoria: 'Jugadores', enunciado: '¿Quién ganó el Balón de Oro 2023?', opciones: [{ id: 'a', texto: 'Kylian Mbappé' }, { id: 'b', texto: 'Erling Haaland' }, { id: 'c', texto: 'Lionel Messi' }, { id: 'd', texto: 'Kevin De Bruyne' }], opcionCorrectaId: 'c' },
    { id: 'jugadores-2', categoria: 'Jugadores', enunciado: '¿Qué jugador fue apodado “CR7”?', opciones: [{ id: 'a', texto: 'Cristiano Ronaldo' }, { id: 'b', texto: 'Karim Benzema' }, { id: 'c', texto: 'Kylian Mbappé' }, { id: 'd', texto: 'Luis Suárez' }], opcionCorrectaId: 'a' },
    { id: 'jugadores-3', categoria: 'Jugadores', enunciado: '¿Qué jugador es conocido como “El Bicho”?', opciones: [{ id: 'a', texto: 'Paolo Maldini' }, { id: 'b', texto: 'Ronaldo Fenómeno' }, { id: 'c', texto: 'Roberto Carlos' }, { id: 'd', texto: 'Zinedine Zidane' }], opcionCorrectaId: 'b' },
    { id: 'jugadores-4', categoria: 'Jugadores', enunciado: '¿Qué futbolista ganó el Mundial con Argentina en 2022?', opciones: [{ id: 'a', texto: 'Di María' }, { id: 'b', texto: 'Lautaro Martínez' }, { id: 'c', texto: 'Lionel Messi' }, { id: 'd', texto: 'Angel Di María' }], opcionCorrectaId: 'c' },
  ],
  Reglas: [
    { id: 'reglas-1', categoria: 'Reglas', enunciado: '¿Cuántos jugadores puede haber en el campo por equipo al inicio del partido?', opciones: [{ id: 'a', texto: '9' }, { id: 'b', texto: '10' }, { id: 'c', texto: '11' }, { id: 'd', texto: '12' }], opcionCorrectaId: 'c' },
    { id: 'reglas-2', categoria: 'Reglas', enunciado: '¿Qué sanción recibe un jugador por una falta grave?', opciones: [{ id: 'a', texto: 'Tarjeta amarilla' }, { id: 'b', texto: 'Tarjeta roja' }, { id: 'c', texto: 'Corner' }, { id: 'd', texto: 'Penal' }], opcionCorrectaId: 'b' },
    { id: 'reglas-3', categoria: 'Reglas', enunciado: '¿Cuánto dura un partido de fútbol profesional reglamentario?', opciones: [{ id: 'a', texto: '70 minutos' }, { id: 'b', texto: '80 minutos' }, { id: 'c', texto: '90 minutos' }, { id: 'd', texto: '110 minutos' }], opcionCorrectaId: 'c' },
    { id: 'reglas-4', categoria: 'Reglas', enunciado: '¿Qué sucede si el balón cruza totalmente la línea de gol y la última acción fue un defensor?', opciones: [{ id: 'a', texto: 'Tiro libre' }, { id: 'b', texto: 'Corner' }, { id: 'c', texto: 'Penal' }, { id: 'd', texto: 'Gol' }], opcionCorrectaId: 'b' },
  ],
  Tácticas: [
    { id: 'tacticas-1', categoria: 'Tácticas', enunciado: '¿Qué significa “pressing alto”?', opciones: [{ id: 'a', texto: 'Presionar arriba y recuperar rápido' }, { id: 'b', texto: 'Esperar al rival en su área' }, { id: 'c', texto: 'Marcar en mitad de cancha' }, { id: 'd', texto: 'Guardar la pelota' }], opcionCorrectaId: 'a' },
    { id: 'tacticas-2', categoria: 'Tácticas', enunciado: '¿Cuál es la función del volante “número 10”?', opciones: [{ id: 'a', texto: 'Marcar goles desde el área' }, { id: 'b', texto: 'Organizar juego y crear oportunidades' }, { id: 'c', texto: 'Defender la línea de fondo' }, { id: 'd', texto: 'Reponer en un saque de esquina' }], opcionCorrectaId: 'b' },
    { id: 'tacticas-3', categoria: 'Tácticas', enunciado: '¿Qué es un “cambio de orientación”?', opciones: [{ id: 'a', texto: 'Pase largo al rival' }, { id: 'b', texto: 'Traspasar la pelota a un lado de la cancha' }, { id: 'c', texto: 'Tirar a la red' }, { id: 'd', texto: 'Fallar un remate' }], opcionCorrectaId: 'b' },
    { id: 'tacticas-4', categoria: 'Tácticas', enunciado: '¿Qué busca la formación 4-3-3?', opciones: [{ id: 'a', texto: 'Máxima presión y amplitud' }, { id: 'b', texto: 'Tres defensores' }, { id: 'c', texto: 'Cuatro mediocampistas' }, { id: 'd', texto: 'Tres delanteros y tres defensores' }], opcionCorrectaId: 'a' },
  ],
}

export function obtenerCategoriaAleatoria(categorias = categoriasPartidas) {
  // TODO: reemplazar por endpoint real cuando el backend del motor de partidas esté listo
  if (!Array.isArray(categorias) || categorias.length === 0) {
    return null
  }

  const indiceAleatorio = Math.floor(Math.random() * categorias.length)
  const categoriaElegida = categorias[indiceAleatorio]

  return typeof categoriaElegida === 'string' ? { nombre: categoriaElegida } : categoriaElegida
}

export function obtenerPreguntasPorCategoria(categoriaId, cantidad = 10) {
  const nombreCategoria = typeof categoriaId === 'string' ? categoriaId : categoriaId?.nombre
  const preguntasDisponibles = preguntasBase[nombreCategoria] ?? []

  if (!preguntasDisponibles.length) {
    return []
  }

  const totalPreguntas = Math.max(1, Number(cantidad) || 10)

  return Array.from({ length: totalPreguntas }, (_, indice) => {
    const preguntaBase = preguntasDisponibles[indice % preguntasDisponibles.length]
    return {
      ...preguntaBase,
      id: `${preguntaBase.id}-${indice}`,
    }
  })
}

export function registrarRespuestaPartida(idPartida, idPregunta, opcionSeleccionada, tiempoEmpleado) {
  return {
    idPartida,
    idPregunta,
    opcionSeleccionada,
    tiempoEmpleado,
    registrado: true,
  }
}

export function finalizarPartidaIndividual(idPartida, respuestas = []) {
  const puntaje = respuestas.reduce((acumulado, respuesta) => {
    const fueCorrecta = respuesta.esCorrecta === true
    if (!fueCorrecta) {
      return acumulado
    }

    const bonus = 100 + (respuesta.tiempoEmpleado ?? 0) * 5
    return acumulado + bonus
  }, 0)

  return {
    idPartida,
    puntaje,
    totalRespuestas: respuestas.length,
    respuestasCorrectas: respuestas.filter((respuesta) => respuesta.esCorrecta).length,
    finalizada: true,
  }
}

export default {
  obtenerCategoriaAleatoria,
  obtenerPreguntasPorCategoria,
  registrarRespuestaPartida,
  finalizarPartidaIndividual,
}
