import { solicitarApi } from './clienteApi.js'

export const modosJuegoBase = [
  {
    id: 'partida-individual',
    titulo: 'Partida Individual',
    descripcion: 'Jugá una partida rápida con categorías y respuestas de alto nivel.',
    destino: '/partida/ruleta',
    icono: '⚽',
    etiqueta: 'Partida rápida',
  },
  {
    id: 'duelo-1v1',
    titulo: 'Duelo 1v1',
    descripcion: 'Desafiá a otro jugador y comprobá quién domina el campo.',
    destino: '/duelo/esperando',
    icono: '⚔️',
    etiqueta: 'Competencia',
  },
  {
    id: 'juego-local',
    titulo: 'Juego local',
    descripcion: 'Disputá un duelo presencial 1v1 en el mismo dispositivo con turnos alternados.',
    destino: '/duelo/local',
    icono: '📱',
    etiqueta: 'Local',
  },
]

function normalizarModoJuego(modo) {
  if (!modo || typeof modo !== 'object') {
    return null
  }

  const titulo = modo.titulo ?? modo.title ?? modo.nombre ?? modo.name ?? null
  if (!titulo) {
    return null
  }

  const descripcion = modo.descripcion ?? modo.description ?? modo.resumen ?? 'Modo de juego disponible.'
  const destino = modo.destino ?? modo.ruta ?? modo.path ?? modo.url ?? modo.link ?? null
  const icono = modo.icono ?? modo.emoji ?? modo.simbolo ?? modo.icon ?? '🎯'
  const etiqueta = modo.etiqueta ?? modo.label ?? modo.tag ?? modo.tipo ?? 'Disponible'

  return {
    id: modo.id ?? String(titulo).toLowerCase().replace(/\s+/g, '-'),
    titulo: String(titulo),
    descripcion: String(descripcion),
    destino: destino || '/home',
    icono: String(icono),
    etiqueta: String(etiqueta),
  }
}

function extraerModosDesdeRespuesta(respuesta) {
  if (!respuesta) return []

  const colecciones = [
    respuesta.modos,
    respuesta.modos_juego,
    respuesta.game_modes,
    respuesta.juegos,
    respuesta.items,
    respuesta.data,
    respuesta.result,
  ]

  for (const coleccion of colecciones) {
    if (Array.isArray(coleccion)) {
      return coleccion
    }
  }

  if (Array.isArray(respuesta.modosJuego)) {
    return respuesta.modosJuego
  }

  return []
}

export async function obtenerModosJuego() {
  const rutasPosibles = [
    '/api/juegos/modos',
    '/api/modos-juego',
    '/api/game-modes',
    '/api/modos',
    '/api/juegos',
  ]

  for (const ruta of rutasPosibles) {
    try {
      const respuesta = await solicitarApi(ruta, { metodo: 'GET' })
      const modos = extraerModosDesdeRespuesta(respuesta)
      const modosNormalizados = modos
        .map(normalizarModoJuego)
        .filter(Boolean)

      if (modosNormalizados.length > 0) {
        return modosNormalizados
      }
    } catch {
      // El backend aún no expone este recurso; se utiliza fallback local.
    }
  }

  return modosJuegoBase
}
