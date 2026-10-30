import { useEffect as usarEfecto, useState as usarEstado } from 'react'
import { Link as Enlace, useNavigate as usarNavegacion, useParams as usarParametros } from 'react-router-dom'
import ListaParticipantesTorneo from '../componentes/ListaParticipantesTorneo.jsx'
import MarcoTorneo from '../componentes/MarcoTorneo.jsx'
import { obtenerPerfil } from '../servicios/servicioPerfil.js'
import { obtenerSalaTorneo, salirDelTorneo } from '../servicios/servicioTorneos.js'
import '../estilos/estilosSalaDetalleTorneo.css'
import { navegarConManejo } from '../utilidades/navegacionConManejo.js'

/** Obtiene la sala y distingue errores de carga y de acciones. */
function usarCargaSalaTorneo(idTorneo, intentoCarga, establecerSala, establecerCargando, establecerMensajeError, establecerCodigoError) {
  usarEfecto(() => {
    let vigente = true
    establecerCargando(true)
    establecerMensajeError('')
    establecerCodigoError('')

    obtenerSalaTorneo(idTorneo)
      .then((resultado) => { if (vigente) establecerSala(resultado) })
      .catch((error) => {
        if (vigente) {
          establecerSala(null)
          establecerCodigoError(error.codigo || 'ERROR_CARGA')
          establecerMensajeError(error.message || 'No pudimos cargar la sala del torneo.')
        }
      })
      .finally(() => { if (vigente) establecerCargando(false) })

    return () => { vigente = false }
  }, [idTorneo, intentoCarga, establecerSala, establecerCargando, establecerMensajeError, establecerCodigoError])
}

/** Actualiza periódicamente la sala mientras espera participantes. */
function usarActualizacionSalaTorneo(idTorneo, estadoSala, establecerSala) {
  usarEfecto(() => {
    if (estadoSala !== 'ESPERANDO JUGADORES') return undefined
    let vigente = true
    const intervalo = window.setInterval(() => {
      obtenerSalaTorneo(idTorneo).then((resultado) => {
        if (vigente) establecerSala(resultado)
      }).catch((error) => {
        console.error('No se pudo actualizar la sala; se volverá a intentar en el próximo intervalo.', error)
      })
    }, 15000)
    return () => { vigente = false; window.clearInterval(intervalo) }
  }, [idTorneo, estadoSala, establecerSala])
}

async function copiarCodigoSala(sala, establecerMensajeAccion) {
  establecerMensajeAccion('')
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Portapapeles no disponible')
    await navigator.clipboard.writeText(sala.codigo)
    establecerMensajeAccion('Código copiado al portapapeles.')
  } catch {
    establecerMensajeAccion('No pudimos copiar el código. Copialo manualmente.')
  }
}

async function salirDeSalaTorneo({ idTorneo, sala, navegar, establecerMensajeError, establecerSaliendo }) {
  establecerMensajeError('')
  establecerSaliendo(true)
  try {
    const usuario = await obtenerPerfil()
    if (usuario.id === sala.creadorId && !window.confirm('Sos el creador: salir cancelará el torneo para todos los participantes. ¿Querés continuar?')) return
    await salirDelTorneo(idTorneo)
    navegarConManejo(navegar, '/torneos', { replace: true })
  } catch (error) {
    establecerMensajeError(error.message || 'No pudimos salir del torneo.')
  } finally {
    establecerSaliendo(false)
  }
}

function EstadoInicialSalaTorneo({ cargando, mensajeError, codigoError, sala, idTorneo, reintentar }) {
  if (cargando) {
    return <MarcoTorneo tituloMovil="Sala del torneo" subtituloMovil={`Torneo #${idTorneo}`}><section className="estado-pantalla-torneo" aria-live="polite"><span className="estado-pantalla-torneo__carga" /><p>Cargando sala…</p></section></MarcoTorneo>
  }

  if (!mensajeError || sala) return null

  const noEncontrado = ['TORNEO_NO_DISPONIBLE', 'TORNEO_NO_ENCONTRADO', 'RECURSO_NO_ENCONTRADO'].includes(codigoError)
  return (
    <MarcoTorneo tituloMovil="Sala del torneo" subtituloMovil={`Torneo #${idTorneo}`}>
      <section className="estado-pantalla-torneo" role="alert">
        <strong>{noEncontrado ? 'Torneo inexistente' : 'No pudimos cargar la sala'}</strong>
        <p>{mensajeError}</p>
        {noEncontrado ? <Enlace to="/torneos">Volver a Torneos</Enlace> : <button type="button" onClick={reintentar}>Reintentar</button>}
      </section>
    </MarcoTorneo>
  )
}

/** Muestra participantes y código de la sala mientras el torneo espera jugadores. */
export default function PaginaSalaTorneo() {
  const { idTorneo } = usarParametros()
  const navegar = usarNavegacion()
  const [sala, establecerSala] = usarEstado(null)
  const [cargando, establecerCargando] = usarEstado(true)
  const [mensajeError, establecerMensajeError] = usarEstado('')
  const [codigoError, establecerCodigoError] = usarEstado('')
  const [mensajeAccion, establecerMensajeAccion] = usarEstado('')
  const [intentoCarga, establecerIntentoCarga] = usarEstado(0)
  const [saliendo, establecerSaliendo] = usarEstado(false)

  usarCargaSalaTorneo(idTorneo, intentoCarga, establecerSala, establecerCargando, establecerMensajeError, establecerCodigoError)
  usarActualizacionSalaTorneo(idTorneo, sala?.estado, establecerSala)

  const copiarCodigo = () => copiarCodigoSala(sala, establecerMensajeAccion)
  const manejarSalida = () => salirDeSalaTorneo({ idTorneo, sala, navegar, establecerMensajeError, establecerSaliendo })
  const mostrarEstadoInicial = cargando || Boolean(mensajeError && !sala)

  if (mostrarEstadoInicial) {
    return <EstadoInicialSalaTorneo
      cargando={cargando}
      mensajeError={mensajeError}
      codigoError={codigoError}
      sala={sala}
      idTorneo={idTorneo}
      reintentar={() => establecerIntentoCarga((intento) => intento + 1)}
    />
  }

  // Con el cupo completo se pueden mostrar los cruces generados.
  const participantesCompletos = sala.participantes.length === sala.capacidad
  const crucesGenerados = sala.estado !== 'ESPERANDO JUGADORES'
  const lugaresFaltantes = sala.capacidad - sala.participantes.length

  return (
    <MarcoTorneo tituloMovil="Sala del torneo" subtituloMovil={`Código ${sala.codigo}`}>
      <div className="sala-torneo">
        <header className="sala-torneo__introduccion"><h1>Sala del torneo</h1><p>{participantesCompletos ? 'Todo está listo para generar los cruces.' : 'Esperando jugadores para generar los cruces.'}</p></header>

        <section className="sala-torneo__resumen" aria-labelledby="nombre-sala-torneo">
          <div><span className={`sala-torneo__estado${participantesCompletos ? ' sala-torneo__estado--listo' : ''}`}>{sala.estado}</span><h2 id="nombre-sala-torneo">{sala.nombre}</h2><p>Creado por {sala.organizador} · {sala.capacidad} participantes</p></div>
          <div className="sala-torneo__codigo"><small>CÓDIGO</small><strong>{sala.codigo}</strong><button type="button" onClick={() => { void copiarCodigo() }}>Copiar código</button></div>
        </section>

        <section className="sala-torneo__progreso-movil" aria-label={`${sala.participantes.length} de ${sala.capacidad} jugadores listos`}>
          <span className={`sala-torneo__estado${participantesCompletos ? ' sala-torneo__estado--listo' : ''}`}>{sala.estado}</span>
          <h1>{sala.nombre}</h1><p>{sala.participantes.length} de {sala.capacidad} jugadores listos</p><progress value={sala.participantes.length} max={sala.capacidad} />
        </section>

        <div className="sala-torneo__columnas">
          <ListaParticipantesTorneo participantes={sala.participantes} capacidad={sala.capacidad} />
          <aside className="sala-torneo__pasos">
            <h2>¿Qué sigue?</h2>
            <ol><li className="completado">Compartí el código</li><li className="completado">Completá los {sala.capacidad} lugares</li><li className={crucesGenerados ? 'completado' : ''}>Se generan los cruces</li><li className={crucesGenerados ? 'completado' : ''}>Comienza el torneo</li></ol>
            <p className="sala-torneo__aviso-participante">{crucesGenerados ? 'Los cruces se generaron automáticamente.' : 'Los cruces se generarán automáticamente al completar el cupo.'}</p>
            {crucesGenerados && <Enlace className="sala-torneo__ver-cuadro" to={`/torneos/${idTorneo}/cuadro`}>Ver cuadro</Enlace>}
            {sala.estado === 'ESPERANDO JUGADORES' && <button className="sala-torneo__salir" type="button" onClick={() => { void manejarSalida() }} disabled={saliendo}>{saliendo ? 'Saliendo…' : 'Salir del torneo'}</button>}
          </aside>
        </div>

        <section className="sala-torneo__compartir-movil"><small>Compartir código</small><button type="button" onClick={() => { void copiarCodigo() }}><strong>{sala.codigo}</strong><span aria-hidden="true">▣</span></button></section>
        <div className="sala-torneo__accion-movil">
          {crucesGenerados ? <Enlace to={`/torneos/${idTorneo}/cuadro`}>Ver cuadro</Enlace> : <p>{participantesCompletos ? 'Preparando los cruces' : `Esperando ${lugaresFaltantes} jugadores`}</p>}
          <small>{crucesGenerados ? 'Los cruces se generaron automáticamente.' : 'Los cruces se generan al completar el cupo.'}</small>
          {sala.estado === 'ESPERANDO JUGADORES' && <button className="sala-torneo__salir" type="button" onClick={() => { void manejarSalida() }} disabled={saliendo}>{saliendo ? 'Saliendo…' : 'Salir del torneo'}</button>}
        </div>
        {mensajeError && <p className="mensaje mensaje--error sala-torneo__mensaje" role="alert">{mensajeError}</p>}
        {mensajeAccion && <p className="mensaje mensaje--exito sala-torneo__mensaje"><output>{mensajeAccion}</output></p>}
      </div>
    </MarcoTorneo>
  )
}
