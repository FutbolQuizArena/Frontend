import { solicitarApi } from './clienteApi.js'

function normalizarCodigo(codigo) {
  return codigo.trim().replace(/\s+/g, '').toUpperCase()
}

function formatearFecha(fecha) {
  if (!fecha) return 'Fecha no disponible'
  const valor = new Date(fecha)
  if (Number.isNaN(valor.getTime())) return 'Fecha no disponible'
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }).format(valor)
}

function obtenerTono(indice) {
  return ['verde', 'dorado', 'azul'][indice % 3]
}

function adaptarTorneo(torneo, filtro, indice) {
  const participantes = torneo.cantidad_participantes_actual
  const capacidad = torneo.cantidad_participantes
  const progreso = capacidad ? Math.round((participantes / capacidad) * 100) : 0
  const estadoVisible = torneo.estado === 'ESPERANDO_JUGADORES' ? (filtro === 'disponibles' ? 'ABIERTO' : 'ESPERANDO') : torneo.estado.replaceAll('_', ' ')
  const codigo = torneo.codigo_acceso || ''

  return {
    id: torneo.id,
    nombre: torneo.nombre,
    formato: 'Eliminación directa',
    inicio: torneo.estado === 'ESPERANDO_JUGADORES' ? 'Inscripciones abiertas' : `Creado ${formatearFecha(torneo.fecha_creacion)}`,
    fecha: formatearFecha(torneo.fecha_creacion),
    participantes,
    capacidad,
    estado: estadoVisible,
    estadoOriginal: torneo.estado,
    detalle: `${participantes}/${capacidad} jugadores${codigo ? ` · Código ${codigo}` : ''}`,
    progreso,
    tono: obtenerTono(indice),
    codigo,
    requiereContrasena: torneo.tiene_contrasena,
    creadorId: torneo.creador_id,
    campeon: 'Resultado disponible en el detalle',
    resultado: 'Finalizado',
    victorias: null,
  }
}

async function obtenerTorneos(filtro) {
  const torneos = await solicitarApi(`/api/torneos?filtro=${encodeURIComponent(filtro)}`)
  return torneos.map((torneo, indice) => adaptarTorneo(torneo, filtro, indice))
}

export async function crearTorneo(datosTorneo) {
  const respuesta = await solicitarApi('/api/torneos', {
    metodo: 'POST',
    datos: {
      nombre: datosTorneo.nombre.trim(),
      cantidad_participantes: datosTorneo.cantidadParticipantes,
      contrasena_acceso: datosTorneo.contrasena.trim() || null,
    },
  })

  return { ...respuesta, idTorneo: respuesta.id, codigoAcceso: respuesta.codigo_acceso }
}

export function obtenerMisTorneos() {
  return obtenerTorneos('mios')
}

export function obtenerTorneosDisponibles() {
  return obtenerTorneos('disponibles')
}

export function obtenerTorneosFinalizados() {
  return obtenerTorneos('finalizados')
}

export async function unirseATorneo(codigo, contrasena = '') {
  const respuesta = await solicitarApi('/api/torneos/unirse', {
    metodo: 'POST',
    datos: { codigo_acceso: normalizarCodigo(codigo), contrasena: contrasena || null },
  })
  return { ...respuesta, idTorneo: respuesta.id }
}

export function salirDelTorneo(idTorneo) {
  return solicitarApi(`/api/torneos/${encodeURIComponent(idTorneo)}/salir`, { metodo: 'DELETE' })
}


function obtenerTorneo(idTorneo) {
  return solicitarApi(`/api/torneos/${encodeURIComponent(idTorneo)}`)
}

function adaptarSala(torneo) {
  return {
    id: torneo.id,
    nombre: torneo.nombre,
    codigo: torneo.codigo_acceso,
    estado: torneo.estado.replaceAll('_', ' '),
    capacidad: torneo.cantidad_participantes,
    organizador: torneo.creador_nombre,
    creadorId: torneo.creador_id,
    participantes: (torneo.participantes || []).map((persona) => ({
      id: persona.usuario_id,
      nombre: persona.nombre,
      esCreador: persona.es_creador,
    })),
  }
}

function nombreRonda(numero, capacidad) {
  const participantes = capacidad / 2 ** (numero - 1)
  if (participantes === 2) return 'Final'
  if (participantes === 4) return 'Semifinales'
  if (participantes === 8) return 'Cuartos de final'
  return 'Octavos de final'
}

function adaptarCuadro(torneo) {
  const cruces = torneo.cuadro || []
  const rondas = [...new Set(cruces.map((cruce) => cruce.ronda))].sort((a, b) => a - b).map((numero) => ({
    clave: nombreRonda(numero, torneo.cantidad_participantes).toLowerCase().replaceAll(' ', '-'),
    nombre: nombreRonda(numero, torneo.cantidad_participantes),
    cruces: cruces.filter((cruce) => cruce.ronda === numero).map((cruce) => ({
      id: cruce.id,
      jugadorA: { id: cruce.jugador_a_id ?? cruce.jugador_a?.id, nombre: cruce.jugador_a?.nombre || 'Por definir', puntaje: null },
      jugadorB: { id: cruce.jugador_b_id ?? cruce.jugador_b?.id, nombre: cruce.jugador_b?.nombre || 'Por definir', puntaje: null },
      ganadorId: cruce.ganador_id ?? cruce.ganador?.id,
      estado: cruce.estado === 'JUGADO' ? 'FINALIZADO' : 'PENDIENTE',
    })),
  }))
  const final = rondas.at(-1)?.cruces[0]
  const ganador = final?.ganadorId
  const campeon = ganador && final.jugadorA.id === ganador ? final.jugadorA : ganador && final.jugadorB.id === ganador ? final.jugadorB : null
  const rondaActual = rondas.find((ronda) => ronda.cruces.some((cruce) => cruce.estado !== 'FINALIZADO'))?.nombre || rondas.at(-1)?.nombre || 'Por definir'
  return {
    id: torneo.id,
    nombre: torneo.nombre,
    estado: torneo.estado,
    formato: 'Eliminación directa',
    participantes: torneo.cantidad_participantes,
    rondaActual,
    rondas,
    campeon,
    fechaFinalizacion: null,
    proximaPartida: null,
    premio: null,
    resultadoUsuario: null,
  }
}

export async function obtenerSalaTorneo(idTorneo) {
  return adaptarSala(await obtenerTorneo(idTorneo))
}

export async function obtenerDetalleTorneo(idTorneo) {
  const torneo = await obtenerTorneo(idTorneo)
  const cuadro = adaptarCuadro(torneo)
  return {
    id: torneo.id,
    nombre: torneo.nombre,
    estado: torneo.estado === 'ESPERANDO_JUGADORES' ? 'ESPERANDO' : torneo.estado.replaceAll('_', ' '),
    formato: 'Eliminación directa',
    participantes: torneo.cantidad_participantes_actual,
    capacidad: torneo.cantidad_participantes,
    proximaRonda: torneo.estado === 'ESPERANDO_JUGADORES' ? 'Esperando participantes' : cuadro.rondaActual,
    codigo: torneo.codigo_acceso,
    resultado: torneo.estado === 'FINALIZADO' && cuadro.campeon ? `Campeón: ${cuadro.campeon.nombre}` : null,
    accion: torneo.estado === 'ESPERANDO_JUGADORES' ? 'Ir a la sala' : 'Ver cuadro',
  }
}

export async function obtenerCuadroTorneo(idTorneo) {
  return adaptarCuadro(await obtenerTorneo(idTorneo))
}
