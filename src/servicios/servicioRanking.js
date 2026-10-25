import { solicitarApi } from './clienteApi.js'
import { obtenerPerfil } from './servicioPerfil.js'

// TODO: ajustar los alias de campos cuando el contrato definitivo de GET /api/ranking esté publicado.
function normalizarUsuarioRanking(usuario, indice) {
  // El servicio acepta los nombres del contrato HTTP y los expone a la vista en camelCase.
  return {
    posicion: Number(usuario?.posicion ?? usuario?.position ?? indice + 1),
    id: usuario?.id ?? usuario?.usuario_id ?? usuario?.user_id ?? `usuario-${indice + 1}`,
    nombre: usuario?.nombre ?? usuario?.name ?? 'Jugador',
    avatar: usuario?.avatar ?? usuario?.iniciales ?? usuario?.initials ?? '',
    partidasJugadas: Number(usuario?.partidas_jugadas ?? usuario?.partidasJugadas ?? usuario?.games_played ?? 0),
    victorias: Number(usuario?.victorias ?? usuario?.wins ?? 0),
    puntajeTotal: Number(usuario?.puntaje_total ?? usuario?.puntajeTotal ?? usuario?.total_score ?? 0),
    variacionPosicion: Number(usuario?.variacion_posicion ?? usuario?.variacionPosicion ?? usuario?.rank_change ?? 0),
    esUsuarioActual: Boolean(usuario?.es_usuario_actual ?? usuario?.esUsuarioActual ?? usuario?.is_current_user ?? false),
  }
}

// TODO: ajustar los alias de respuesta cuando el contrato definitivo de GET /api/ranking esté publicado.
function extraerUsuariosRanking(respuesta) {
  const datos = respuesta?.data ?? respuesta?.resultado ?? respuesta
  if (Array.isArray(datos)) return datos

  return datos?.lista_clasificacion
    ?? datos?.listaClasificacion
    ?? datos?.clasificacion
    ?? datos?.ranking
    ?? datos?.usuarios
    ?? datos?.items
    ?? []
}

// TODO: ajustar filtros y metadatos cuando el contrato definitivo de GET /api/ranking esté publicado.
export async function obtenerRankingGeneral(filtroPeriodo, filtroCategoria) {
  const filtros = filtroPeriodo && typeof filtroPeriodo === 'object'
    ? filtroPeriodo
    : { periodo: filtroPeriodo, categoriaId: filtroCategoria }
  const parametros = new URLSearchParams()
  const periodo = filtros.periodo ?? filtros.filtroPeriodo
  const categoriaId = filtros.categoriaId ?? filtros.categoria_id

  if (periodo) parametros.set('periodo', String(periodo))
  if (categoriaId) parametros.set('categoria_id', String(categoriaId))

  const consulta = parametros.toString()
  const ruta = `/api/ranking${consulta ? `?${consulta}` : ''}`

  // Si el endpoint falla, se propaga el error para que la pantalla muestre el estado correspondiente.
  const [respuesta, perfil] = await Promise.all([
    solicitarApi(ruta),
    obtenerPerfil().catch(() => null),
  ])

  const datosRespuesta = respuesta?.data ?? respuesta?.resultado ?? respuesta
  const usuariosRespuesta = extraerUsuariosRanking(respuesta)
  const listaClasificacion = usuariosRespuesta
    .map(normalizarUsuarioRanking)
    .sort((usuarioA, usuarioB) => usuarioB.puntajeTotal - usuarioA.puntajeTotal || usuarioA.posicion - usuarioB.posicion)

  // La posición enviada por el backend prevalece; si no está, se deriva del orden recibido.
  listaClasificacion.forEach((usuario, indice) => {
    if (!usuario.posicion || usuario.posicion < 1) usuario.posicion = indice + 1
    const esPerfilActual = perfil?.id !== undefined && String(usuario.id) === String(perfil.id)
    usuario.esUsuarioActual = usuario.esUsuarioActual || esPerfilActual
  })

  const usuarioActualRespuesta = datosRespuesta?.usuario_actual ?? datosRespuesta?.usuarioActual
  const usuarioActualEnLista = listaClasificacion.find((usuario) => usuario.esUsuarioActual) ?? null
  const usuarioActual = usuarioActualEnLista
    ?? (usuarioActualRespuesta ? normalizarUsuarioRanking(usuarioActualRespuesta, 0) : null)
  const posicionRespuesta = datosRespuesta?.posicion_usuario_actual
    ?? datosRespuesta?.posicionUsuarioActual
    ?? datosRespuesta?.posicion_actual
  const posicionUsuarioActual = Number(
    (typeof posicionRespuesta === 'object' ? posicionRespuesta?.posicion : posicionRespuesta)
      ?? usuarioActual?.posicion
      ?? 0,
  ) || null

  return {
    listaClasificacion,
    posicionUsuarioActual,
    usuarioActual: usuarioActual
      ? { ...usuarioActual, posicion: posicionUsuarioActual ?? usuarioActual.posicion, esUsuarioActual: true }
      : null,
  }
}
