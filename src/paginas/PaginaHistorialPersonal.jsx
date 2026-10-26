import { useEffect as usarEfecto, useState as usarEstado } from 'react'
import { Link as Enlace } from 'react-router-dom'
import MarcoTorneo from '../componentes/MarcoTorneo.jsx'
import TarjetaPartidaHistorial from '../componentes/TarjetaPartidaHistorial.jsx'
import { obtenerHistorialPersonal } from '../servicios/servicioHistorial.js'
import '../estilos/estilosHistorialPersonal.css'

export default function PaginaHistorialPersonal() {
  const [historial, establecerHistorial] = usarEstado(null)
  const [cargando, establecerCargando] = usarEstado(true)
  const [error, establecerError] = usarEstado('')
  const [pestanaActiva, establecerPestana] = usarEstado('partidas')
  const [partidaSeleccionada, establecerPartidaSeleccionada] = usarEstado(null)
  const partidasVisibles = pestanaActiva === 'partidas' ? historial?.partidasHistorial : historial?.torneosHistorial

  async function cargarHistorial() {
    establecerCargando(true)
    establecerError('')
    try {
      establecerHistorial(await obtenerHistorialPersonal())
    } catch (errorApi) {
      establecerError(errorApi.message || 'No pudimos cargar tu historial. Intentá de nuevo.')
    } finally {
      establecerCargando(false)
    }
  }

  usarEfecto(() => {
    let componenteActivo = true
    obtenerHistorialPersonal()
      .then((datos) => { if (componenteActivo) establecerHistorial(datos) })
      .catch((errorApi) => { if (componenteActivo) establecerError(errorApi.message || 'No pudimos cargar tu historial. Intentá de nuevo.') })
      .finally(() => { if (componenteActivo) establecerCargando(false) })
    return () => { componenteActivo = false }
  }, [])

  return (
    <MarcoTorneo tituloMovil="Mi historial" subtituloMovil="Tus partidas y torneos">
      <section className="historial" aria-labelledby="historial-titulo">
        <header className="historial__introduccion">
          <h1 id="historial-titulo">Mi historial</h1>
          <p>Partidas individuales y torneos en los que participaste.</p>
        </header>

        <div className="historial__pestanas" role="tablist" aria-label="Tipo de historial">
          <button type="button" role="tab" aria-selected={pestanaActiva === 'partidas'} className={pestanaActiva === 'partidas' ? 'historial__pestana historial__pestana--activa' : 'historial__pestana'} onClick={() => establecerPestana('partidas')}>Partidas individuales</button>
          <button type="button" role="tab" aria-selected={pestanaActiva === 'torneos'} className={pestanaActiva === 'torneos' ? 'historial__pestana historial__pestana--activa' : 'historial__pestana'} onClick={() => establecerPestana('torneos')}>Torneos</button>
        </div>

        <section className="historial__panel" aria-label={pestanaActiva === 'partidas' ? 'Partidas anteriores' : 'Torneos anteriores'}>
          {cargando ? <p className="historial__estado" role="status">Cargando historial…</p> : null}
          {!cargando && error ? <div className="historial__estado historial__estado--error" role="alert"><p>{error}</p><button type="button" onClick={cargarHistorial}>Reintentar</button></div> : null}
          {!cargando && !error && partidasVisibles?.length > 0 ? (
            <div className="historial__tabla-contenedor">
              <table className="historial__tabla">
                <thead><tr><th scope="col">Fecha</th><th scope="col">Categoría</th><th scope="col">Modo</th><th scope="col">Resultado</th><th scope="col">Puntaje</th><th scope="col"><span className="historial__solo-lector">Acciones</span></th></tr></thead>
                <tbody>{partidasVisibles.map((partida, indice) => <TarjetaPartidaHistorial key={partida.id ?? `${partida.fecha}-${indice}`} partida={partida} alVerDetalle={establecerPartidaSeleccionada} />)}</tbody>
              </table>
            </div>
          ) : null}
          {!cargando && !error && !partidasVisibles?.length ? <div className="historial__vacio"><strong>{pestanaActiva === 'partidas' ? 'Todavía no jugaste partidas' : 'Todavía no participaste en torneos'}</strong><span>Cuando completes una actividad, vas a encontrarla acá.</span><Enlace to="/jugar">Ir a jugar</Enlace></div> : null}
        </section>

        {partidaSeleccionada ? <div className="historial__velo" role="presentation" onMouseDown={(evento) => { if (evento.target === evento.currentTarget) establecerPartidaSeleccionada(null) }}><section className="historial__dialogo" role="dialog" aria-modal="true" aria-labelledby="historial-detalle-titulo"><button className="historial__cerrar" type="button" aria-label="Cerrar detalle" onClick={() => establecerPartidaSeleccionada(null)}>×</button><p className="historial__dialogo-sobretitulo">DETALLE DE ACTIVIDAD</p><h2 id="historial-detalle-titulo">{partidaSeleccionada.categoria}</h2><dl><div><dt>Fecha</dt><dd>{partidaSeleccionada.fecha ? new Date(partidaSeleccionada.fecha).toLocaleString('es-AR') : 'No disponible'}</dd></div><div><dt>Modo</dt><dd>{partidaSeleccionada.modo}</dd></div><div><dt>Resultado</dt><dd>{partidaSeleccionada.resultado}</dd></div><div><dt>Puntaje</dt><dd>{partidaSeleccionada.puntaje.toLocaleString('es-AR')} pts</dd></div>{partidaSeleccionada.oponente ? <div><dt>Oponente</dt><dd>{partidaSeleccionada.oponente}</dd></div> : null}{partidaSeleccionada.detalle ? <div><dt>Resumen</dt><dd>{partidaSeleccionada.detalle}</dd></div> : null}</dl><button className="historial__cerrar-accion" type="button" onClick={() => establecerPartidaSeleccionada(null)}>Cerrar</button></section></div> : null}
      </section>
    </MarcoTorneo>
  )
}
