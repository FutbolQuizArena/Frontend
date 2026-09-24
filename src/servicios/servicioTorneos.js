const nombresTorneosTemporales = new Set()

const misTorneosTemporales = [
  { id: 1, nombre: 'Copa Leyendas', formato: 'Eliminación', inicio: 'Hoy · 21:00', participantes: 8, capacidad: 8, estado: 'EN CURSO', detalle: 'Semifinal · Próximo partido hoy 21:00', progreso: 67, tono: 'verde' },
  { id: 2, nombre: 'Liga Relámpago', formato: 'Liga', inicio: 'Mañana · 19:30', participantes: 6, capacidad: 8, estado: 'ESPERANDO', detalle: '6/8 jugadores · Código LIGA24', progreso: 80, tono: 'dorado' },
  { id: 3, nombre: 'Clásicos del Mundo', formato: 'Eliminación', inicio: '12 Sep · 20:00', participantes: 12, capacidad: 16, estado: 'ABIERTO', detalle: '12/16 jugadores · Próximo torneo', progreso: 75, tono: 'verde' },
  { id: 4, nombre: 'Mundial Retro', formato: 'Eliminación', inicio: '15 Sep · 22:00', participantes: 4, capacidad: 8, estado: 'PRÓXIMO', detalle: '4/8 jugadores · Próximo torneo', progreso: 50, tono: 'dorado' },
]

const torneosDisponiblesTemporales = [
  { id: 5, codigo: 'LIGA24', nombre: 'Liga de Campeones', inicio: 'Hoy · 19:30', participantes: 6, capacidad: 8, estado: 'ABIERTO', requiereContrasena: false, progreso: 75, tono: 'verde' },
  { id: 6, codigo: 'CLASICOS16', nombre: 'Clásicos del Mundo', inicio: '12 Sep · 20:00', participantes: 12, capacidad: 16, estado: 'ABIERTO', requiereContrasena: true, progreso: 75, tono: 'dorado' },
  { id: 7, codigo: 'COPA04', nombre: 'Copa Nacional', inicio: '13 Sep · 18:00', participantes: 3, capacidad: 4, estado: 'ABIERTO', requiereContrasena: false, progreso: 75, tono: 'verde' },
  { id: 8, codigo: 'RETRO08', nombre: 'Mundial Retro', inicio: '15 Sep · 22:00', participantes: 4, capacidad: 8, estado: 'ABIERTO', requiereContrasena: true, progreso: 50, tono: 'azul' },
]

const torneosFinalizadosTemporales = [
  { id: 9, nombre: 'Copa Apertura', fecha: '28 Ago 2026', campeon: 'SofiGol', resultado: 'Semifinal', victorias: 3, tono: 'verde' },
  { id: 10, nombre: 'Leyendas de América', fecha: '20 Ago 2026', campeon: 'Lucas', resultado: 'Campeón', victorias: 4, tono: 'dorado' },
  { id: 11, nombre: 'Copa Relámpago', fecha: '12 Ago 2026', campeon: 'Mati10', resultado: 'Cuartos', victorias: 2, tono: 'azul' },
  { id: 12, nombre: 'Reto Mundial', fecha: '03 Ago 2026', campeon: 'Fede_9', resultado: 'Finalista', victorias: 3, tono: 'verde' },
  { id: 13, nombre: 'Clásicos Eternos', fecha: '25 Jul 2026', campeon: 'NicoFC', resultado: 'Primera ronda', victorias: 0, tono: 'dorado' },
]

const invitacionesTemporales = {
  LIGA24: { id: 5, nombre: 'Liga de Campeones', participantes: 6, capacidad: 8 },
  FQA8K2: { id: 14, nombre: 'Copa de Amigos', participantes: 6, capacidad: 8, contrasena: 'cancha' },
  LLENO8: { id: 15, nombre: 'Copa Completa', participantes: 8, capacidad: 8, error: 'El torneo ya alcanzó el máximo de participantes.' },
  INSCR1: { id: 16, nombre: 'Copa del Barrio', participantes: 4, capacidad: 8, error: 'Ya estás registrado en este torneo.' },
}

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
  17: { id: 17, nombre: 'Copa Completa', codigo: 'LISTO8', estado: 'LISTO PARA COMENZAR', capacidad: 8, organizador: 'Lucas', esOrganizador: true, participantes: participantesTemporales },
}

const detallesTemporales = {
  1: { id: 1, nombre: 'Copa de Campeones', estado: 'EN CURSO', formato: 'Eliminación directa', participantes: 8, capacidad: 8, proximaRonda: 'Semifinal · Hoy 21:00', codigo: 'COPA26', accion: 'Continuar' },
  5: { id: 5, nombre: 'Liga de Campeones', estado: 'ESPERANDO', formato: 'Eliminación directa', participantes: 6, capacidad: 8, proximaRonda: 'Esperando participantes', codigo: 'LIGA24', accion: 'Ir a la sala' },
  9: { id: 9, nombre: 'Copa Apertura', estado: 'FINALIZADO', formato: 'Eliminación directa', participantes: 8, capacidad: 8, proximaRonda: 'Campeona · SofiGol', codigo: 'APER26', resultado: 'Semifinal · 3 victorias', accion: 'Ver cuadro' },
  14: { id: 14, nombre: 'Copa de Amigos', estado: 'ESPERANDO', formato: 'Eliminación directa', participantes: 6, capacidad: 8, proximaRonda: 'Esperando participantes', codigo: 'FQA8K2', accion: 'Ir a la sala' },
  17: { id: 17, nombre: 'Copa Completa', estado: 'LISTO', formato: 'Eliminación directa', participantes: 8, capacidad: 8, proximaRonda: 'Lista para comenzar', codigo: 'LISTO8', accion: 'Ir a la sala' },
}

function normalizarCodigo(codigo) {
  return codigo.trim().replace(/\s+/g, '').toUpperCase()
}

function devolverCopia(datos) {
  return new Promise((resolver) => {
    setTimeout(() => resolver(datos.map((dato) => ({ ...dato }))), 220)
  })
}

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

export function obtenerMisTorneos() {
  // TODO: reemplazar por endpoint real cuando el backend de torneos esté listo
  return devolverCopia(misTorneosTemporales)
}

export function obtenerTorneosDisponibles() {
  // TODO: reemplazar por endpoint real cuando el backend de torneos esté listo
  return devolverCopia(torneosDisponiblesTemporales)
}

export function obtenerTorneosFinalizados() {
  // TODO: reemplazar por endpoint real cuando el backend de torneos esté listo
  return devolverCopia(torneosFinalizadosTemporales)
}

export function unirseATorneo(codigo, contrasena = '') {
  // TODO: reemplazar por endpoint real cuando el backend de torneos esté listo
  return new Promise((resolver, rechazar) => {
    setTimeout(() => {
      const codigoNormalizado = normalizarCodigo(codigo)
      const torneo = invitacionesTemporales[codigoNormalizado]

      if (!torneo) {
        rechazar(new Error('No encontramos un torneo con ese código.'))
        return
      }

      if (torneo.error) {
        rechazar(new Error(torneo.error))
        return
      }

      if (torneo.contrasena && contrasena !== torneo.contrasena) {
        rechazar(new Error('La contraseña del torneo es incorrecta.'))
        return
      }

      resolver({ idTorneo: torneo.id, nombre: torneo.nombre })
    }, 350)
  })
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

export function iniciarTorneo(idTorneo) {
  // TODO: reemplazar por endpoint real cuando el backend de torneos esté listo
  return new Promise((resolver, rechazar) => {
    setTimeout(() => {
      const sala = salasTemporales[idTorneo]

      if (!sala) {
        rechazar(crearErrorTorneo('TORNEO_NO_ENCONTRADO', 'No encontramos el torneo solicitado.'))
        return
      }
      if (!sala.esOrganizador) {
        rechazar(crearErrorTorneo('ACCION_NO_PERMITIDA', 'Solo el organizador puede iniciar el torneo.'))
        return
      }
      if (sala.participantes.length < sala.capacidad) {
        rechazar(crearErrorTorneo('CUPOS_INCOMPLETOS', 'El torneo necesita completar todos los lugares antes de comenzar.'))
        return
      }

      resolver({ idTorneo: sala.id, estado: 'EN CURSO' })
    }, 450)
  })
}
