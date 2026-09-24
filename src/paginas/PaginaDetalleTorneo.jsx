import { useEffect as usarEfecto, useState as usarEstado } from 'react'
import { Link as Enlace, useParams as usarParametros } from 'react-router-dom'
import MarcoTorneo from '../componentes/MarcoTorneo.jsx'
import { obtenerDetalleTorneo } from '../servicios/servicioTorneos.js'
import '../estilos/estilosSalaDetalleTorneo.css'

export default function PaginaDetalleTorneo() {
  const { idTorneo } = usarParametros()
  const [torneo, establecerTorneo] = usarEstado(null)
  const [cargando, establecerCargando] = usarEstado(true)
  const [mensajeError, establecerMensajeError] = usarEstado('')
  const [codigoError, establecerCodigoError] = usarEstado('')
  const [intentoCarga, establecerIntentoCarga] = usarEstado(0)

  usarEfecto(() => {
    let vigente = true
    establecerCargando(true)
    establecerMensajeError('')
    establecerCodigoError('')
    obtenerDetalleTorneo(idTorneo)
      .then((resultado) => { if (vigente) establecerTorneo(resultado) })
      .catch((error) => {
        if (vigente) {
          establecerTorneo(null)
          establecerCodigoError(error.codigo || 'ERROR_CARGA')
          establecerMensajeError(error.message || 'No pudimos cargar el detalle del torneo.')
        }
      })
      .finally(() => { if (vigente) establecerCargando(false) })
    return () => { vigente = false }
  }, [idTorneo, intentoCarga])

  if (cargando) {
    return <MarcoTorneo tituloMovil="Torneos" subtituloMovil="Competí y llegá a la final"><section className="estado-pantalla-torneo" aria-live="polite"><span className="estado-pantalla-torneo__carga" /><p>Cargando detalle…</p></section></MarcoTorneo>
  }

  if (mensajeError) {
    const noEncontrado = codigoError === 'TORNEO_NO_ENCONTRADO'
    return (
      <MarcoTorneo tituloMovil="Torneos" subtituloMovil="Competí y llegá a la final">
        <section className="estado-pantalla-torneo" role="alert">
          <strong>{noEncontrado ? 'Torneo inexistente' : 'No pudimos cargar el detalle'}</strong><p>{mensajeError}</p>
          {noEncontrado ? <Enlace to="/torneos">Volver a Torneos</Enlace> : <button type="button" onClick={() => establecerIntentoCarga((intento) => intento + 1)}>Reintentar</button>}
        </section>
      </MarcoTorneo>
    )
  }

  const vaALaSala = ['ESPERANDO', 'LISTO'].includes(torneo.estado)
  const destinoAccion = vaALaSala ? `/torneos/${idTorneo}/sala` : `/torneos/${idTorneo}/cuadro`

  return (
    <MarcoTorneo tituloMovil="Torneos" subtituloMovil="Competí y llegá a la final">
      <div className="detalle-torneo">
        <div className="detalle-torneo__fondo" aria-hidden="true">
          <div><h1>Torneos</h1><p>Competí contra otros jugadores y llegá a la final.</p></div><span>Crear torneo</span>
          <div className="detalle-torneo__pestanas">Mis torneos　 Disponibles　 Finalizados</div>
          <article><small>EN CURSO</small><h2>Copa de Campeones</h2><p>Semifinal · Próximo partido hoy 21:00</p></article>
          <article><small>ESPERANDO</small><h2>Liga de Campeones</h2><p>6/8 jugadores · Código LIGA24</p></article>
        </div>
        <div className="detalle-torneo__velo" />
        <section className="detalle-torneo__panel" role="dialog" aria-modal="true" aria-labelledby="titulo-detalle-torneo">
          <span className="detalle-torneo__asa" aria-hidden="true" />
          <h1 id="titulo-detalle-torneo">{torneo.nombre}</h1>
          <p className="detalle-torneo__subtitulo">{torneo.estado === 'FINALIZADO' ? 'Resultado final del torneo.' : 'Tu información dentro del torneo.'}</p>
          <dl>
            <div><dt>Estado</dt><dd className={`detalle-torneo__estado detalle-torneo__estado--${torneo.estado.toLocaleLowerCase('es-AR').replace(/\s+/g, '-')}`}>{torneo.estado}</dd></div>
            <div><dt>Formato</dt><dd>{torneo.formato}</dd></div>
            <div><dt>Jugadores</dt><dd>{torneo.participantes} {torneo.participantes === 1 ? 'participante' : 'participantes'}</dd></div>
            <div><dt>{torneo.estado === 'FINALIZADO' ? 'Resultado' : 'Próxima ronda'}</dt><dd>{torneo.resultado || torneo.proximaRonda}</dd></div>
            <div><dt>Código</dt><dd className="detalle-torneo__codigo">{torneo.codigo}</dd></div>
          </dl>
          <div className="detalle-torneo__acciones"><Enlace to="/torneos">Volver</Enlace><Enlace className="detalle-torneo__continuar" to={destinoAccion}>{torneo.accion}</Enlace></div>
        </section>
      </div>
    </MarcoTorneo>
  )
}
