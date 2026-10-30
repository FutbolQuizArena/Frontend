import { solicitarApi } from './clienteApi.js'
import { normalizarDueloOnline } from './servicioDuelos.js'

/** Quita espacios y unifica mayúsculas antes de enviar una invitación. */
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

/** Convierte un torneo de la API en la tarjeta que usa cada listado. */
function adaptarTorneo(torneo, filtro, indice) {
  const participantes = torneo.cantidad_participantes_actual
  const capacidad = torneo.cantidad_participantes
  const progreso = capacidad ? Math.round((participantes / capacidad) * 100) : 0
  let estadoVisible
  if (torneo.estado === 'ESPERANDO_JUGADORES') {
    estadoVisible = filtro === 'disponibles' ? 'ABIERTO' : 'ESPERANDO'
  } else {
    estadoVisible = torneo.estado.replaceAll('_', ' ')
  }
  const codigo = torneo.codigo_acceso || ''
  const detalleCodigo = codigo ? ` · Código ${codigo}` : ''

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
    detalle: `${participantes}/${capacidad} jugadores${detalleCodigo}`,
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

/** Comparte la consulta de listados propios, disponibles y finalizados. */
async function obtenerTorneos(filtro) {
  const torneos = await solicitarApi(`/api/torneos?filtro=${encodeURIComponent(filtro)}`)
  return torneos.map((torneo, indice) => adaptarTorneo(torneo, filtro, indice))
}

/** Convierte el formulario al contrato de creación y devuelve el ID para la sala. */
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

/** Solicita la inscripción con código y contraseña opcional. */
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

/** Prepara los participantes y el código que muestra la sala. */
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

/** Deriva el nombre de la ronda según los jugadores que quedan. */
function nombreRonda(numero, capacidad) {
  const participantes = capacidad / 2 ** (numero - 1)
  if (participantes === 2) return 'Final'
  if (participantes === 4) return 'Semifinales'
  if (participantes === 8) return 'Cuartos de final'
  return 'Octavos de final'
}

/** Distingue cruces pendientes, en juego y finalizados. */
function estadoVisibleCruce(cruce) {
  if (cruce.estado === 'JUGADO') return 'FINALIZADO'
  if (cruce.duelo_id) return 'EN_CURSO'
  return 'PENDIENTE'
}

/** Agrupa cruces por ronda y determina campeón y próxima ronda visible. */
function adaptarCuadro(torneo) {
  const cruces = torneo.cuadro || []
  const rondas = [...new Set(cruces.map((cruce) => cruce.ronda))].sort((a, b) => a - b).map((numero) => ({
    clave: nombreRonda(numero, torneo.cantidad_participantes).toLowerCase().replaceAll(' ', '-'),
    nombre: nombreRonda(numero, torneo.cantidad_participantes),
    cruces: cruces.filter((cruce) => cruce.ronda === numero).map((cruce) => ({
      id: cruce.id,
      dueloId: cruce.duelo_id ?? null,
      jugadorA: { id: cruce.jugador_a_id ?? cruce.jugador_a?.id, usuarioId: cruce.jugador_a?.usuario_id, nombre: cruce.jugador_a?.nombre || 'Por definir', puntaje: null },
      jugadorB: { id: cruce.jugador_b_id ?? cruce.jugador_b?.id, usuarioId: cruce.jugador_b?.usuario_id, nombre: cruce.jugador_b?.nombre || 'Por definir', puntaje: null },
      ganadorId: cruce.ganador_id ?? cruce.ganador?.id,
      estado: estadoVisibleCruce(cruce),
    })),
  }))
  const final = rondas.at(-1)?.cruces[0]
  const ganador = final?.ganadorId
  let campeon = null
  if (ganador && final.jugadorA.id === ganador) {
    campeon = final.jugadorA
  } else if (ganador && final.jugadorB.id === ganador) {
    campeon = final.jugadorB
  }
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

/** Combina el estado del torneo y su cuadro para la vista de detalle. */
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

/** Inicia o recupera el duelo y guarda sus preguntas para abrir la partida. */
export async function iniciarDueloCruce(idTorneo, idCruce, usuarioActual) {
  const respuesta = await solicitarApi(`/api/torneos/${encodeURIComponent(idTorneo)}/cruces/${encodeURIComponent(idCruce)}/iniciar-duelo`, {
    metodo: 'POST',
  })
  const duelo = normalizarDueloOnline(respuesta.duelo, usuarioActual)
  if (!duelo.id || duelo.preguntas.length === 0) {
    throw new Error('El servidor no devolvió las preguntas del duelo.')
  }
  const dueloTorneo = { ...duelo, torneoId: Number(idTorneo), cruceId: Number(idCruce) }
  window.sessionStorage.setItem('dueloActual', JSON.stringify(dueloTorneo))
  window.sessionStorage.removeItem('resultadoDuelo')
  return dueloTorneo
}
