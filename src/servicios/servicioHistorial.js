import { solicitarApi } from './clienteApi.js'

function adaptarPartidaIndividual(partida) {
  return {
    id: partida.partida_id,
    fecha: partida.fecha_fin,
    categoria: partida.categoria_nombre || 'Sin categoría',
    modo: 'Individual',
    resultado: 'Completada',
    puntaje: Number(partida.puntaje_final ?? 0),
  }
}

function adaptarDuelo(duelo) {
  return {
    id: `duelo-${duelo.duelo_id}`,
    fecha: duelo.fecha_fin,
    categoria: duelo.categoria_nombre || 'Sin categoría',
    modo: 'Duelo',
    resultado: duelo.resultado,
    puntaje: Number(duelo.puntaje_propio ?? 0),
    oponente: duelo.rival_nombre,
    detalle: `Marcador: ${duelo.puntaje_propio}–${duelo.puntaje_rival}`,
  }
}

function normalizarEstadoTorneo(estado) {
  const texto = (estado || 'Completado').replaceAll('_', ' ').toLocaleLowerCase('es-AR')
  return `${texto.charAt(0).toLocaleUpperCase('es-AR')}${texto.slice(1)}`
}

function adaptarTorneo(torneo) {
  const ronda = torneo.ronda_alcanzada
  return {
    id: `torneo-${torneo.torneo_id}`,
    fecha: torneo.fecha_creacion,
    categoria: torneo.nombre,
    modo: 'Torneo',
    resultado: torneo.es_campeon ? 'Victoria' : normalizarEstadoTorneo(torneo.estado),
    puntaje: null,
    detalle: ronda ? `Ronda alcanzada: ${ronda}` : 'El torneo todavía no generó cruces.',
    esCampeon: Boolean(torneo.es_campeon),
  }
}

function ordenarPorFechaDescendente(registros) {
  return registros.sort((registroA, registroB) => {
    const fechaA = registroA.fecha ? new Date(registroA.fecha).getTime() : 0
    const fechaB = registroB.fecha ? new Date(registroB.fecha).getTime() : 0
    return fechaB - fechaA
  })
}

// Consulta los tres historiales privados del usuario autenticado y unifica sus DTOs para React.
export async function obtenerHistorialPersonal() {
  // El backend mantiene una consulta independiente para cada tipo de actividad del jugador.
  const [respuestaIndividual, respuestaDuelos, respuestaTorneos] = await Promise.all([
    solicitarApi('/api/historial/partidas-individuales'),
    solicitarApi('/api/historial/duelos'),
    solicitarApi('/api/historial/torneos'),
  ])

  const partidasIndividuales = (respuestaIndividual?.partidas ?? []).map(adaptarPartidaIndividual)
  const duelos = (respuestaDuelos?.duelos ?? []).map(adaptarDuelo)
  const torneos = (respuestaTorneos?.torneos ?? []).map(adaptarTorneo)
  const partidasHistorial = ordenarPorFechaDescendente([...partidasIndividuales, ...duelos])

  return {
    estadisticasGenerales: {
      partidasJugadas: Number(respuestaIndividual?.total ?? partidasIndividuales.length)
        + Number(respuestaDuelos?.total ?? duelos.length),
      duelosGanados: duelos.filter((duelo) => duelo.resultado === 'VICTORIA').length,
      porcentajeVictorias: null,
      puntajeAcumulado: null,
      torneosDisputados: Number(respuestaTorneos?.total ?? torneos.length),
      torneosGanados: torneos.filter((torneo) => torneo.esCampeon).length,
    },
    partidasHistorial,
    torneosHistorial: ordenarPorFechaDescendente(torneos),
  }
}
