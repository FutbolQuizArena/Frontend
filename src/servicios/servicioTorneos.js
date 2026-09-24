import { solicitarApi } from './clienteApi.js'

const participantesTemporales = [
  { id: 1, nombre: 'Lucas' },
  { id: 2, nombre: 'Mati10' },
  { id: 3, nombre: 'SofiGol' },
  { id: 4, nombre: 'Fede_9' },
  { id: 5, nombre: 'NicoFC' },
  { id: 6, nombre: 'LauGol' },
  { id: 7, nombre: 'AnaGol' },
  { id: 8, nombre: 'JuanPro' },
]

const salasTemporales = {
  5: { id: 5, nombre: 'Liga de Campeones', codigo: 'LIGA24', estado: 'ESPERANDO JUGADORES', capacidad: 8, organizador: 'AnaGol', esOrganizador: false, participantes: participantesTemporales.slice(0, 6) },
  14: { id: 14, nombre: 'Copa de Amigos', codigo: 'FQA8K2', estado: 'ESPERANDO JUGADORES', capacidad: 8, organizador: 'Lucas', esOrganizador: true, participantes: participantesTemporales.slice(0, 6) },
  16: { id: 16, nombre: 'Copa del Barrio', codigo: 'INSCR1', estado: 'ESPERANDO JUGADORES', capacidad: 8, organizador: 'Mati10', esOrganizador: false, participantes: participantesTemporales.slice(0, 4) },
  17: { id: 17, nombre: 'Copa Completa', codigo: 'LISTO8', estado: 'EN CURSO', capacidad: 8, organizador: 'Lucas', esOrganizador: true, participantes: participantesTemporales },
}

const detallesTemporales = {
  1: { id: 1, nombre: 'Copa de Campeones', estado: 'EN CURSO', formato: 'Eliminación directa', participantes: 8, capacidad: 8, proximaRonda: 'Semifinal · Hoy 21:00', codigo: 'COPA26', accion: 'Continuar' },
  5: { id: 5, nombre: 'Liga de Campeones', estado: 'ESPERANDO', formato: 'Eliminación directa', participantes: 6, capacidad: 8, proximaRonda: 'Esperando participantes', codigo: 'LIGA24', accion: 'Ir a la sala' },
  9: { id: 9, nombre: 'Copa Apertura', estado: 'FINALIZADO', formato: 'Eliminación directa', participantes: 8, capacidad: 8, proximaRonda: 'Campeona · SofiGol', codigo: 'APER26', resultado: 'Semifinal · 3 victorias', accion: 'Ver cuadro' },
  14: { id: 14, nombre: 'Copa de Amigos', estado: 'ESPERANDO', formato: 'Eliminación directa', participantes: 6, capacidad: 8, proximaRonda: 'Esperando participantes', codigo: 'FQA8K2', accion: 'Ir a la sala' },
  17: { id: 17, nombre: 'Copa Completa', estado: 'EN CURSO', formato: 'Eliminación directa', participantes: 8, capacidad: 8, proximaRonda: 'Primera ronda generada', codigo: 'LISTO8', accion: 'Continuar' },
}

const cuadroBaseTemporal = [
  {
    clave: 'cuartos',
    nombre: 'Cuartos de final',
    cruces: [
      { id: 1, jugadorA: { id: 1, nombre: 'Lucas', puntaje: 8 }, jugadorB: { id: 2, nombre: 'Mati10', puntaje: 6 }, ganadorId: 1, estado: 'FINALIZADO' },
      { id: 2, jugadorA: { id: 3, nombre: 'SofiGol', puntaje: 7 }, jugadorB: { id: 4, nombre: 'Fede_9', puntaje: 9 }, ganadorId: 4, estado: 'FINALIZADO' },
      { id: 3, jugadorA: { id: 5, nombre: 'NicoFC', puntaje: 6 }, jugadorB: { id: 6, nombre: 'Juli_22', puntaje: 5 }, ganadorId: 5, estado: 'FINALIZADO' },
      { id: 4, jugadorA: { id: 7, nombre: 'TomiCR7', puntaje: 9 }, jugadorB: { id: 8, nombre: 'LauGol', puntaje: 7 }, ganadorId: 7, estado: 'FINALIZADO' },
    ],
  },
  {
    clave: 'semifinales',
    nombre: 'Semifinales',
    cruces: [
      { id: 5, jugadorA: { id: 1, nombre: 'Lucas', puntaje: 5 }, jugadorB: { id: 4, nombre: 'Fede_9', puntaje: 3 }, ganadorId: 1, estado: 'EN_CURSO' },
      { id: 6, jugadorA: { id: 5, nombre: 'NicoFC', puntaje: 4 }, jugadorB: { id: 7, nombre: 'TomiCR7', puntaje: 2 }, ganadorId: 5, estado: 'FINALIZADO' },
    ],
  },
  {
    clave: 'final',
    nombre: 'Final',
    cruces: [
      { id: 7, jugadorA: { id: 1, nombre: 'Lucas', puntaje: null }, jugadorB: { id: 5, nombre: 'NicoFC', puntaje: null }, ganadorId: null, estado: 'PENDIENTE' },
    ],
  },
]

const cuadrosTemporales = {
  1: {
    id: 1,
    nombre: 'Copa de Campeones',
    estado: 'EN_CURSO',
    formato: 'Eliminación directa',
    participantes: 8,
    rondaActual: 'Semifinales',
    proximaPartida: 'Hoy · 21:00',
    premio: 1500,
    rondas: cuadroBaseTemporal,
    campeon: null,
  },
  17: {
    id: 17,
    nombre: 'Copa Completa',
    estado: 'EN_CURSO',
    formato: 'Eliminación directa',
    participantes: 8,
    rondaActual: 'Cuartos de final',
    proximaPartida: 'Hoy · 21:45',
    premio: 1500,
    rondas: cuadroBaseTemporal,
    campeon: null,
  },
  9: {
    id: 9,
    nombre: 'Copa Apertura',
    estado: 'FINALIZADO',
    formato: 'Eliminación directa',
    participantes: 8,
    rondaActual: 'Finalizado',
    proximaPartida: 'Finalizado',
    premio: 1500,
    fechaFinalizacion: '28 Ago 2026',
    rondas: cuadroBaseTemporal.map((ronda) => ronda.clave === 'final'
      ? { ...ronda, cruces: [{ id: 7, jugadorA: { id: 3, nombre: 'SofiGol', puntaje: 5 }, jugadorB: { id: 1, nombre: 'Lucas', puntaje: 3 }, ganadorId: 3, estado: 'FINALIZADO' }] }
      : ronda),
    campeon: { id: 3, nombre: 'SofiGol' },
    resultadoUsuario: { instancia: 'Semifinal', partidasJugadas: 3, puntosObtenidos: 420, victorias: 2, derrotas: 1 },
  },
}

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

function crearErrorTorneo(codigo, mensaje) {
  const error = new Error(mensaje)
  error.codigo = codigo
  return error
}

function obtenerCopiaTemporal(coleccion, idTorneo) {
  return new Promise((resolver, rechazar) => {
    setTimeout(() => {
      if (String(idTorneo) === '500') {
        rechazar(crearErrorTorneo('ERROR_CARGA', 'No pudimos cargar el torneo. Intentá de nuevo.'))
        return
      }

      const torneo = coleccion[idTorneo]
      if (!torneo) {
        rechazar(crearErrorTorneo('TORNEO_NO_ENCONTRADO', 'No encontramos el torneo solicitado.'))
        return
      }

      resolver({
        ...torneo,
        participantes: Array.isArray(torneo.participantes)
          ? torneo.participantes.map((participante) => ({ ...participante }))
          : torneo.participantes,
      })
    }, 220)
  })
}

export function obtenerDetalleTorneo(idTorneo) {
  // TODO: reemplazar por endpoint real cuando el backend de torneos esté listo
  return obtenerCopiaTemporal(detallesTemporales, idTorneo)
}

export function obtenerSalaTorneo(idTorneo) {
  // TODO: reemplazar por endpoint real cuando el backend de torneos esté listo
  return obtenerCopiaTemporal(salasTemporales, idTorneo)
}

export function obtenerCuadroTorneo(idTorneo) {
  // TODO: reemplazar por endpoint real de estado y cruces cuando el backend de torneos esté listo
  return new Promise((resolver, rechazar) => {
    setTimeout(() => {
      if (String(idTorneo) === '500') {
        rechazar(crearErrorTorneo('ERROR_CARGA', 'No pudimos cargar el cuadro. Intentá de nuevo.'))
        return
      }

      const torneo = cuadrosTemporales[idTorneo]
      if (!torneo) {
        rechazar(crearErrorTorneo('TORNEO_NO_ENCONTRADO', 'No encontramos el torneo solicitado.'))
        return
      }

      resolver(JSON.parse(JSON.stringify(torneo)))
    }, 220)
  })
}
