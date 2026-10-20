import { Link as Enlace } from 'react-router-dom'

function textoParticipantes(torneo) {
  return `${torneo.participantes} / ${torneo.capacidad}`
}

function obtenerTextoDetalleFinalizado(torneo) {
  if (torneo.victorias === null) {
    return 'Abrí el detalle para consultar el resultado'
  }

  const textoPosicion = torneo.resultado === 'Campeón' ? '1.er puesto' : torneo.resultado
  return `${textoPosicion} · ${torneo.victorias} victorias`
}

export default function TarjetaTorneo({ torneo, tipo }) {
  const esFinalizado = tipo === 'finalizados'
  const esDisponible = tipo === 'disponibles'
  let destino
  let textoAccion
  if (esFinalizado) {
    destino = `/torneos/${torneo.id}`
    textoAccion = 'Ver detalle'
  } else if (esDisponible) {
    destino = '/torneos/unirse'
    textoAccion = 'Unirme'
  } else {
    destino = `/torneos/${torneo.id}/sala`
    textoAccion = 'Ir a la sala'
  }
  const valorProgreso = esFinalizado ? Math.max(torneo.victorias || 0, 1) : torneo.progreso || 0

  return (
    <article className={`tarjeta-torneo tarjeta-torneo--${tipo} tarjeta-torneo--${torneo.tono || 'verde'}`}>
      <span className="tarjeta-torneo__estado">{esFinalizado ? 'FINALIZADO' : torneo.estado}</span>
      <h3>{torneo.nombre}</h3>

      {esFinalizado ? (
        <>
          <p className="tarjeta-torneo__fecha">{torneo.fecha}</p>
          <p className="tarjeta-torneo__campeon">{torneo.campeon}</p>
          <span className="tarjeta-torneo__resultado">{torneo.resultado}</span>
          <p className="tarjeta-torneo__detalle-movil">{obtenerTextoDetalleFinalizado(torneo)}</p>
        </>
      ) : (
        <>
          <p className="tarjeta-torneo__formato">{torneo.formato}</p>
          <p className="tarjeta-torneo__inicio">{torneo.inicio}</p>
          <p className="tarjeta-torneo__participantes">{textoParticipantes(torneo)}</p>
          {esDisponible && <><p className="tarjeta-torneo__acceso">{torneo.requiereContrasena ? 'Con contraseña' : 'Sin contraseña'}</p><p className="tarjeta-torneo__detalle-movil">{textoParticipantes(torneo)} jugadores · {torneo.requiereContrasena ? 'Con contraseña' : 'Sin costo'}</p></>}
          {!esDisponible && <p className="tarjeta-torneo__detalle-movil">{torneo.detalle}</p>}
        </>
      )}

      <progress value={valorProgreso} max={esFinalizado ? 4 : 100} aria-label={`Progreso de ${torneo.nombre}`} />
      <Enlace className="tarjeta-torneo__accion" to={destino}>{textoAccion}<span aria-hidden="true"> ›</span></Enlace>
    </article>
  )
}
