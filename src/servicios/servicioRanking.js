import { solicitarApi } from './clienteApi.js'

const TAMANO_PAGINA_RANKING = 100

function obtenerIniciales(nombre = '') {
  return nombre
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0].toLocaleUpperCase('es-AR'))
    .join('')
}

function adaptarJugadorRanking(jugador) {
  const nombre = jugador.nombre || 'Jugador'
  return {
    posicion: Number(jugador.posicion),
    id: jugador.usuario_id,
    nombre,
    avatar: obtenerIniciales(nombre),
    partidasJugadas: null,
    victorias: null,
    puntajeTotal: Number(jugador.puntaje_total ?? 0),
    variacionPosicion: null,
    esUsuarioActual: false,
  }
}

async function obtenerPaginaRanking(pagina) {
  const parametros = new URLSearchParams({
    pagina: String(pagina),
    tamano_pagina: String(TAMANO_PAGINA_RANKING),
  })
  return solicitarApi(`/api/ranking?${parametros.toString()}`)
}

// El endpoint requiere sesión y devuelve una clasificación paginada junto a mi_posicion.
export async function obtenerRankingGeneral() {
  const primeraRespuesta = await obtenerPaginaRanking(1)
  const totalJugadores = Number(primeraRespuesta?.total_jugadores ?? 0)
  const cantidadPaginas = Math.ceil(totalJugadores / TAMANO_PAGINA_RANKING)
  const respuestasRestantes = await Promise.all(
    Array.from({ length: Math.max(0, cantidadPaginas - 1) }, (_, indice) => obtenerPaginaRanking(indice + 2)),
  )

  const filasBackend = [primeraRespuesta, ...respuestasRestantes]
    .flatMap((respuesta) => respuesta?.jugadores ?? [])
  const filaUsuarioActual = primeraRespuesta?.mi_posicion ?? null
  const idUsuarioActual = filaUsuarioActual?.usuario_id

  const listaClasificacion = filasBackend
    .map(adaptarJugadorRanking)
    .sort((jugadorA, jugadorB) => jugadorA.posicion - jugadorB.posicion)
    .map((jugador) => ({
      ...jugador,
      esUsuarioActual: idUsuarioActual !== null && idUsuarioActual !== undefined
        && String(jugador.id) === String(idUsuarioActual),
    }))

  const usuarioActual = filaUsuarioActual ? {
    ...adaptarJugadorRanking(filaUsuarioActual),
    esUsuarioActual: true,
  } : null

  return {
    listaClasificacion,
    posicionUsuarioActual: usuarioActual?.posicion ?? null,
    usuarioActual,
    totalJugadores,
  }
}
