import { useEffect as usarEfecto, useState as usarEstado } from 'react'
import { Link as Enlace, useParams as usarParametros } from 'react-router-dom'
import ListaParticipantesTorneo from '../componentes/ListaParticipantesTorneo.jsx'
import MarcoTorneo from '../componentes/MarcoTorneo.jsx'
import { obtenerSalaTorneo } from '../servicios/servicioTorneos.js'
import '../estilos/estilosSalaDetalleTorneo.css'

export default function PaginaSalaTorneo() {
  const { idTorneo } = usarParametros()
  const [sala, establecerSala] = usarEstado(null)
  const [cargando, establecerCargando] = usarEstado(true)
  const [mensajeError, establecerMensajeError] = usarEstado('')
  const [codigoError, establecerCodigoError] = usarEstado('')
  const [mensajeAccion, establecerMensajeAccion] = usarEstado('')
  const [intentoCarga, establecerIntentoCarga] = usarEstado(0)

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
  }, [idTorneo, intentoCarga])

  async function copiarCodigo() {
    establecerMensajeAccion('')
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Portapapeles no disponible')
      await navigator.clipboard.writeText(sala.codigo)
      establecerMensajeAccion('Código copiado al portapapeles.')
    } catch {
      establecerMensajeAccion('No pudimos copiar el código. Copialo manualmente.')
    }
  }

  if (cargando) {
    return <MarcoTorneo tituloMovil="Sala del torneo" subtituloMovil={`Torneo #${idTorneo}`}><section className="estado-pantalla-torneo" aria-live="polite"><span className="estado-pantalla-torneo__carga" /><p>Cargando sala…</p></section></MarcoTorneo>
  }

  if (mensajeError && !sala) {
    const noEncontrado = codigoError === 'TORNEO_NO_ENCONTRADO'
    return (
      <MarcoTorneo tituloMovil="Sala del torneo" subtituloMovil={`Torneo #${idTorneo}`}>
        <section className="estado-pantalla-torneo" role="alert">
          <strong>{noEncontrado ? 'Torneo inexistente' : 'No pudimos cargar la sala'}</strong>
          <p>{mensajeError}</p>
          {noEncontrado ? <Enlace to="/torneos">Volver a Torneos</Enlace> : <button type="button" onClick={() => establecerIntentoCarga((intento) => intento + 1)}>Reintentar</button>}
        </section>
      </MarcoTorneo>
    )
  }

  const participantesCompletos = sala.participantes.length === sala.capacidad
  const lugaresFaltantes = sala.capacidad - sala.participantes.length

  return (
    <MarcoTorneo tituloMovil="Sala del torneo" subtituloMovil={`Código ${sala.codigo}`}>
      <div className="sala-torneo">
        <header className="sala-torneo__introduccion"><h1>Sala del torneo</h1><p>{participantesCompletos ? 'Todo está listo para generar los cruces.' : 'Esperando jugadores para generar los cruces.'}</p></header>

        <section className="sala-torneo__resumen" aria-labelledby="nombre-sala-torneo">
          <div><span className={`sala-torneo__estado${participantesCompletos ? ' sala-torneo__estado--listo' : ''}`}>{sala.estado}</span><h2 id="nombre-sala-torneo">{sala.nombre}</h2><p>Creado por {sala.organizador} · {sala.capacidad} participantes</p></div>
          <div className="sala-torneo__codigo"><small>CÓDIGO</small><strong>{sala.codigo}</strong><button type="button" onClick={copiarCodigo}>Copiar código</button></div>
        </section>

        <section className="sala-torneo__progreso-movil" aria-label={`${sala.participantes.length} de ${sala.capacidad} jugadores listos`}>
          <span className={`sala-torneo__estado${participantesCompletos ? ' sala-torneo__estado--listo' : ''}`}>{sala.estado}</span>
          <h1>{sala.nombre}</h1><p>{sala.participantes.length} de {sala.capacidad} jugadores listos</p><progress value={sala.participantes.length} max={sala.capacidad} />
        </section>

        <div className="sala-torneo__columnas">
          <ListaParticipantesTorneo participantes={sala.participantes} capacidad={sala.capacidad} nombreOrganizador={sala.organizador} />
          <aside className="sala-torneo__pasos">
            <h2>¿Qué sigue?</h2>
            <ol><li className="completado">Compartí el código</li><li className={participantesCompletos ? 'completado' : ''}>Completá los {sala.capacidad} lugares</li><li className={participantesCompletos ? 'completado' : ''}>Se generan los cruces</li><li>Comienza el torneo</li></ol>
            <p className="sala-torneo__aviso-participante">{participantesCompletos ? 'Los cruces se generaron automáticamente.' : 'Los cruces se generarán automáticamente al completar el cupo.'}</p>
            {participantesCompletos && <Enlace className="sala-torneo__ver-cuadro" to={`/torneos/${idTorneo}/cuadro`}>Ver cuadro</Enlace>}
            <Enlace className="sala-torneo__salir" to="/torneos">Volver a Torneos</Enlace>
          </aside>
        </div>

        <section className="sala-torneo__compartir-movil"><small>Compartir código</small><button type="button" onClick={copiarCodigo}><strong>{sala.codigo}</strong><span aria-hidden="true">▣</span></button></section>
        <div className="sala-torneo__accion-movil">
          {participantesCompletos ? <Enlace to={`/torneos/${idTorneo}/cuadro`}>Ver cuadro</Enlace> : <p>Esperando {lugaresFaltantes} jugadores</p>}
          <small>{participantesCompletos ? 'Los cruces se generaron automáticamente.' : 'Los cruces se generan al completar el cupo.'}</small>
        </div>
        {mensajeError && <p className="mensaje mensaje--error sala-torneo__mensaje" role="alert">{mensajeError}</p>}
        {mensajeAccion && <p className="mensaje mensaje--exito sala-torneo__mensaje" role="status">{mensajeAccion}</p>}
      </div>
    </MarcoTorneo>
  )
}
