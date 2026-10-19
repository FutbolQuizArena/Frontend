const participantes = ['Lucas', 'Mati10', 'SofiGol', 'Fede_9', 'NicoFC', 'LauGol', 'Ana', 'Juan'].map((nombre, indice) => ({
  id: indice + 1,
  usuario_id: indice + 10,
  nombre,
  es_creador: indice === 0,
}))

function cruce(id, ronda, jugadorA, jugadorB, ganador = null) {
  return {
    id,
    ronda,
    jugador_a_id: jugadorA?.id ?? null,
    jugador_b_id: jugadorB?.id ?? null,
    ganador_id: ganador?.id ?? null,
    jugador_a: jugadorA,
    jugador_b: jugadorB,
    ganador,
    estado: ganador ? 'JUGADO' : 'PENDIENTE',
  }
}

function torneo(id, nombre, estado, inscriptos, cuadro = []) {
  return {
    id,
    nombre,
    estado,
    cantidad_participantes: 8,
    cantidad_participantes_actual: inscriptos,
    creador_id: 10,
    creador_nombre: 'Lucas',
    codigo_acceso: 'FQA8K2',
    fecha_creacion: '2026-09-24T12:00:00Z',
    participantes: participantes.slice(0, inscriptos),
    cuadro,
  }
}

const crucesActivos = [
  cruce(1, 1, participantes[0], participantes[1], participantes[0]),
  cruce(2, 1, participantes[2], participantes[3], participantes[2]),
  cruce(3, 1, participantes[4], participantes[5], participantes[4]),
  cruce(4, 1, participantes[6], participantes[7], participantes[6]),
  cruce(5, 2, participantes[0], participantes[2]),
  cruce(6, 2, participantes[4], participantes[6]),
  cruce(7, 3, null, null),
]

const torneos = {
  1: torneo(1, 'Copa de Campeones', 'EN_CURSO', 8, crucesActivos),
  5: torneo(5, 'Liga de Campeones', 'ESPERANDO_JUGADORES', 4),
  14: torneo(14, 'Copa de Amigos', 'ESPERANDO_JUGADORES', 6),
  17: torneo(17, 'Copa Completa', 'EN_CURSO', 8, crucesActivos),
  9: torneo(9, 'Copa Apertura', 'FINALIZADO', 8, [
    ...crucesActivos.slice(0, 4),
    cruce(5, 2, participantes[0], participantes[2], participantes[2]),
    cruce(6, 2, participantes[4], participantes[6], participantes[4]),
    cruce(7, 3, participantes[2], participantes[4], participantes[2]),
  ]),
}

export async function interceptarDetallesTorneo(pagina) {
  await pagina.route(/\/api\/torneos\/\d+$/, (ruta) => {
    const id = Number(new URL(ruta.request().url()).pathname.split('/').at(-1))
    if (id === 500) return ruta.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ code: 'ERROR_INTERNO', message: 'Error del servidor' }) })
    if (!torneos[id]) return ruta.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ code: 'TORNEO_NO_DISPONIBLE', message: 'No se encontró el torneo' }) })
    return ruta.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(torneos[id]) })
  })
}
