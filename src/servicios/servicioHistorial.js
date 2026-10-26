import { solicitarApi } from './clienteApi.js'

// Normaliza cada registro para que la vista no dependa de nombres snake_case del backend.
// TODO: reemplazar por endpoint real cuando el backend de historial esté listo (GET /api/historial)
function adaptarPartida(partida) {
  return {
    id: partida.id ?? partida.partida_id ?? partida.torneo_id,
    fecha: partida.fecha ?? partida.fecha_fin ?? partida.fecha_creacion,
    categoria: partida.categoria ?? partida.categoria_nombre ?? partida.nombre_categoria ?? partida.torneo_nombre ?? '—',
    modo: partida.modo ?? partida.tipo_partida ?? partida.tipo ?? 'Individual',
    resultado: partida.resultado ?? partida.estado_resultado ?? partida.estado ?? 'Completada',
    puntaje: Number(partida.puntaje ?? partida.puntaje_final ?? partida.puntaje_obtenido ?? 0),
    respuestasCorrectas: partida.respuestasCorrectas ?? partida.respuestas_correctas ?? null,
    totalRespuestas: partida.totalRespuestas ?? partida.total_respuestas ?? null,
    oponente: partida.oponente ?? partida.nombre_oponente ?? null,
    detalle: partida.detalle ?? partida.descripcion ?? null,
  }
}

// Conserva las métricas del DTO aunque todavía no se muestren en la captura de la pantalla.
// TODO: reemplazar por endpoint real cuando el backend de historial esté listo (GET /api/historial)
function adaptarEstadisticas(estadisticas = {}) {
  return {
    partidasJugadas: Number(estadisticas.partidasJugadas ?? estadisticas.partidas_jugadas ?? 0),
    porcentajeVictorias: Number(estadisticas.porcentajeVictorias ?? estadisticas.porcentaje_victorias ?? 0),
    puntajeAcumulado: Number(estadisticas.puntajeAcumulado ?? estadisticas.puntaje_acumulado ?? 0),
    torneosDisputados: Number(estadisticas.torneosDisputados ?? estadisticas.torneos_disputados ?? 0),
    torneosGanados: Number(estadisticas.torneosGanados ?? estadisticas.torneos_ganados ?? 0),
  }
}

// Adapta los nombres del contrato HTTP a un DTO estable para las pantallas.
// TODO: reemplazar por endpoint real cuando el backend de historial esté listo (GET /api/historial)
export async function obtenerHistorialPersonal() {
  const respuesta = await solicitarApi('/api/historial')
  const partidas = respuesta?.partidasHistorial ?? respuesta?.partidas_historial ?? respuesta?.partidas ?? []
  const torneos = respuesta?.torneosHistorial ?? respuesta?.torneos_historial ?? respuesta?.torneos ?? []

  return {
    estadisticasGenerales: adaptarEstadisticas(respuesta?.estadisticasGenerales ?? respuesta?.estadisticas_generales ?? {}),
    partidasHistorial: Array.isArray(partidas) ? partidas.map(adaptarPartida) : [],
    torneosHistorial: Array.isArray(torneos) ? torneos.map(adaptarPartida) : [],
  }
}
