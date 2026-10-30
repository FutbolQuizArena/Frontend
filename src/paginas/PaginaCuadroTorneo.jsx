import { useEffect as usarEfecto, useState as usarEstado } from 'react'
import { Link as Enlace, useNavigate as usarNavegacion, useParams as usarParametros } from 'react-router-dom'
import CruceTorneo from '../componentes/CruceTorneo.jsx'
import MarcoTorneo from '../componentes/MarcoTorneo.jsx'
import { iniciarDueloCruce, obtenerCuadroTorneo } from '../servicios/servicioTorneos.js'
import { obtenerPerfil } from '../servicios/servicioPerfil.js'
import '../estilos/estilosSalaDetalleTorneo.css'
import '../estilos/estilosCuadroTorneo.css'

function formatearPuntos(puntos) {
  return new Intl.NumberFormat('es-AR').format(puntos)
}

/** Encuentra el cruce del usuario entre todas las rondas. */
function obtenerCrucePropio(torneo, usuarioId) {
  return torneo?.rondas.flatMap((ronda) => ronda.cruces).find((cruce) =>
    cruce.estado !== 'FINALIZADO' && cruce.jugadorA.usuarioId != null && cruce.jugadorB.usuarioId != null &&
    (Number(cruce.jugadorA.usuarioId) === Number(usuarioId) || Number(cruce.jugadorB.usuarioId) === Number(usuarioId))
  )
}

function obtenerTextoBotonDuelo(iniciando, dueloId) {
  if (iniciando) return 'Abriendo duelo…'
  if (dueloId) return 'Continuar duelo'
  return 'Jugar duelo'
}

function obtenerDescripcionCruce(cruce, alternativa) {
  if (!cruce) return alternativa
  return `${cruce.jugadorA.nombre} vs. ${cruce.jugadorB.nombre}`
}

/** Dibuja las rondas completas o resumidas según la vista. */
function CuadroLlaves({ torneo, completo = false }) {
  const indiceRondaActual = Math.max(0, torneo.rondas.findIndex((ronda) => ronda.nombre === torneo.rondaActual))
  const numeroCampeon = String(torneo.rondas.length + 1).padStart(2, '0')

  return (
    <section className={`llaves-torneo${completo ? ' llaves-torneo--completo' : ''}`} aria-label="Cuadro de llaves">
      <div className="llaves-torneo__columnas">
        {torneo.rondas.map((ronda, indice) => (
          <section key={ronda.clave} className={`llaves-torneo__ronda llaves-torneo__ronda--${ronda.clave}${indice >= indiceRondaActual ? ' llaves-torneo__ronda--camino' : ''}`}>
            <header><span>{String(indice + 1).padStart(2, '0')}</span><h2>{ronda.nombre}</h2></header>
            <div className="llaves-torneo__cruces">
              {ronda.cruces.map((cruce) => <CruceTorneo key={cruce.id} cruce={cruce} destacado={cruce.estado === 'EN_CURSO'} />)}
            </div>
          </section>
        ))}
        <section className="llaves-torneo__ronda llaves-torneo__campeon">
          <header><span>{numeroCampeon}</span><h2>Campeón</h2></header>
          <div><span aria-hidden="true">♛</span><small>CAMPEÓN</small><strong>{torneo.campeon?.nombre || 'Por definir'}</strong></div>
        </section>
      </div>
    </section>
  )
}

function TorneoFinalizado({ torneo }) {
  const [mostrarCuadro, establecerMostrarCuadro] = usarEstado(false)
  const [mensajeCompartir, establecerMensajeCompartir] = usarEstado('')

  // Ofrece compartir el resultado final mediante el navegador.
  async function compartirResultado() {
    const texto = `${torneo.campeon?.nombre || 'El campeón'} ganó ${torneo.nombre} en FutbolQuiz Arena.`
    establecerMensajeCompartir('')

    try {
      if (navigator.share) {
        await navigator.share({ title: torneo.nombre, text: texto })
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(texto)
      } else {
        throw new Error('Compartir no disponible')
      }
      establecerMensajeCompartir('Resultado listo para compartir.')
    } catch (error) {
      if (error.name !== 'AbortError') establecerMensajeCompartir('No pudimos compartir el resultado.')
    }
  }

  if (mostrarCuadro) {
    return (
      <div className="cuadro-torneo">
        <header className="cuadro-torneo__encabezado">
          <div><span className="cuadro-torneo__sobrelinea">TORNEO FINALIZADO</span><h1>{torneo.nombre}</h1><p>{torneo.formato} · {torneo.participantes} jugadores</p></div>
          <button type="button" className="cuadro-torneo__volver-resultado" onClick={() => establecerMostrarCuadro(false)}>Ver resultado</button>
        </header>
        <CuadroLlaves torneo={torneo} completo />
      </div>
    )
  }

  return (
    <div className="torneo-finalizado">
      <header><span>TORNEO FINALIZADO</span><h1>{torneo.nombre}</h1><p>{torneo.participantes} participantes</p></header>
      <section className="torneo-finalizado__campeon" aria-labelledby="titulo-campeon">
        <div className="torneo-finalizado__trofeo" aria-hidden="true">♛</div>
        <span>¡CAMPEÓN!</span>
        <h2 id="titulo-campeon">{torneo.campeon?.nombre || 'Por definir'}</h2>
        <p>Campeón de {torneo.nombre}</p>
        {torneo.premio !== null && <strong>+{formatearPuntos(torneo.premio)} puntos</strong>}
      </section>
      <p className="torneo-finalizado__balance">El resumen personal estará disponible cuando el backend publique los resultados de las partidas.</p>
      <div className="torneo-finalizado__acciones">
        <button type="button" onClick={() => { void compartirResultado() }}>Compartir resultado</button>
        <button type="button" onClick={() => establecerMostrarCuadro(true)}>Ver cuadro completo</button>
        <Enlace to="/torneos">Volver a torneos</Enlace>
      </div>
      {mensajeCompartir && <p className="torneo-finalizado__mensaje"><output>{mensajeCompartir}</output></p>}
    </div>
  )
}

/** Obtiene los cruces del torneo y habilita el duelo que corresponde al usuario. */
export default function PaginaCuadroTorneo() {
  const { idTorneo } = usarParametros()
  const navegar = usarNavegacion()
  const [torneo, establecerTorneo] = usarEstado(null)
  const [perfil, establecerPerfil] = usarEstado(null)
  const [iniciando, establecerIniciando] = usarEstado(false)
  const [mensajeAccion, establecerMensajeAccion] = usarEstado('')
  const [cargando, establecerCargando] = usarEstado(true)
  const [mensajeError, establecerMensajeError] = usarEstado('')
  const [codigoError, establecerCodigoError] = usarEstado('')
  const [intentoCarga, establecerIntentoCarga] = usarEstado(0)

  usarEfecto(() => {
    let vigente = true
    establecerCargando(true)
    establecerMensajeError('')
    establecerCodigoError('')

    obtenerCuadroTorneo(idTorneo)
      .then((resultado) => { if (vigente) establecerTorneo(resultado) })
      .catch((error) => {
        if (vigente) {
          establecerTorneo(null)
          establecerCodigoError(error.codigo || 'ERROR_CARGA')
          establecerMensajeError(error.message || 'No pudimos cargar el cuadro del torneo.')
        }
      })
      .finally(() => { if (vigente) establecerCargando(false) })

    obtenerPerfil()
      .then((resultado) => { if (vigente) establecerPerfil(resultado) })
      .catch(() => { if (vigente) establecerPerfil(null) })

    return () => { vigente = false }
  }, [idTorneo, intentoCarga])

  const crucePropio = obtenerCrucePropio(torneo, perfil?.id)
  const textoBotonDuelo = obtenerTextoBotonDuelo(iniciando, crucePropio?.dueloId)

  // Abre la partida solo después de que el servidor confirme el duelo del cruce.
  async function jugarCruce() {
    if (!crucePropio || !perfil || iniciando) return
    establecerIniciando(true)
    establecerMensajeAccion('')
    try {
      await iniciarDueloCruce(idTorneo, crucePropio.id, perfil)
      await Promise.resolve(navegar('/duelo/juegan'))
    } catch (error) {
      establecerMensajeAccion(error.message || 'No pudimos iniciar el duelo. Intentá de nuevo.')
      establecerIniciando(false)
    }
  }

  if (cargando) {
    return <MarcoTorneo tituloMovil="Cuadro del torneo" subtituloMovil={`Torneo #${idTorneo}`}><section className="estado-pantalla-torneo" aria-live="polite"><span className="estado-pantalla-torneo__carga" /><p>Cargando cuadro…</p></section></MarcoTorneo>
  }

  if (mensajeError) {
    const noEncontrado = codigoError === 'TORNEO_NO_DISPONIBLE' || codigoError === 'TORNEO_NO_ENCONTRADO' || codigoError === 'RECURSO_NO_ENCONTRADO'
    return (
      <MarcoTorneo tituloMovil="Cuadro del torneo" subtituloMovil={`Torneo #${idTorneo}`}>
        <section className="estado-pantalla-torneo" role="alert">
          <strong>{noEncontrado ? 'Torneo inexistente' : 'No pudimos cargar el cuadro'}</strong><p>{mensajeError}</p>
          {noEncontrado ? <Enlace to="/torneos">Volver a Torneos</Enlace> : <button type="button" onClick={() => establecerIntentoCarga((intento) => intento + 1)}>Reintentar</button>}
        </section>
      </MarcoTorneo>
    )
  }

  if (torneo.estado === 'ESPERANDO_JUGADORES' || torneo.rondas.length === 0) {
    return (
      <MarcoTorneo tituloMovil="Cuadro del torneo" subtituloMovil={torneo.nombre}>
        <section className="estado-pantalla-torneo" aria-live="polite">
          <strong>Los cruces todavía no están disponibles</strong>
          <p>Cuando se complete el cupo, el cuadro aparecerá aquí.</p>
          <Enlace to={`/torneos/${idTorneo}/sala`}>Volver a la sala</Enlace>
        </section>
      </MarcoTorneo>
    )
  }

  return (
    <MarcoTorneo tituloMovil={torneo.estado === 'FINALIZADO' ? torneo.nombre : 'Cuadro del torneo'} subtituloMovil={torneo.estado === 'FINALIZADO' ? 'Torneo finalizado' : torneo.nombre}>
      {torneo.estado === 'FINALIZADO' ? <TorneoFinalizado torneo={torneo} /> : (
        <div className="cuadro-torneo">
          <header className="cuadro-torneo__encabezado">
            <div><span className="cuadro-torneo__sobrelinea">CUADRO DEL TORNEO</span><h1>{torneo.nombre}</h1><p>{torneo.formato} · {torneo.participantes} jugadores</p></div>
            <span className="cuadro-torneo__estado">EN CURSO</span>
          </header>
          <dl className="cuadro-torneo__resumen">
            <div><dt>Ronda actual</dt><dd>{torneo.rondaActual}</dd></div>
            <div><dt>Próxima partida</dt><dd>{obtenerDescripcionCruce(crucePropio, 'Por definir')}</dd></div>
            <div><dt>Premio</dt><dd>Pendiente</dd></div>
          </dl>
          <h2 className="cuadro-torneo__camino">Tu camino a la final</h2>
          <CuadroLlaves torneo={torneo} />
          <aside className="cuadro-torneo__proximo">
            <div><small>TU CRUCE</small><strong>{obtenerDescripcionCruce(crucePropio, 'Todavía no tenés un cruce disponible')}</strong></div>
            {crucePropio && <button type="button" onClick={() => { void jugarCruce() }} disabled={iniciando}>{textoBotonDuelo}</button>}
          </aside>
          {mensajeAccion && <p className="mensaje mensaje--error" role="alert">{mensajeAccion}</p>}
        </div>
      )}
    </MarcoTorneo>
  )
}
