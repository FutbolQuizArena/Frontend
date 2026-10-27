import { useEffect as usarEfecto, useState as usarEstado } from 'react'
import { Link as Enlace } from 'react-router-dom'
import MarcoTorneo from '../componentes/MarcoTorneo.jsx'
import TarjetaPartidaHistorial from '../componentes/TarjetaPartidaHistorial.jsx'
import { obtenerHistorialPersonal } from '../servicios/servicioHistorial.js'
import '../estilos/estilosHistorialPersonal.css'

const mensajeErrorPredeterminado = 'No pudimos cargar tu historial. Intentá de nuevo.'

function usarHistorialPersonal() {
  const [historial, establecerHistorial] = usarEstado(null)
  const [cargando, establecerCargando] = usarEstado(true)
  const [error, establecerError] = usarEstado('')
  const [intento, establecerIntento] = usarEstado(0)

  usarEfecto(() => {
    let componenteActivo = true
    establecerCargando(true)
    establecerError('')

    obtenerHistorialPersonal()
      .then((datos) => {
        if (componenteActivo) establecerHistorial(datos)
      })
      .catch((errorApi) => {
        if (componenteActivo) establecerError(errorApi.message || mensajeErrorPredeterminado)
      })
      .finally(() => {
        if (componenteActivo) establecerCargando(false)
      })

    return () => { componenteActivo = false }
  }, [intento])

  return { historial, cargando, error, reintentar: () => establecerIntento((valor) => valor + 1) }
}

function PestanasHistorial({ pestanaActiva, alCambiarPestana }) {
  return (
    <div className="historial__pestanas" role="tablist" aria-label="Tipo de historial">
      <button type="button" role="tab" aria-selected={pestanaActiva === 'partidas'} className={pestanaActiva === 'partidas' ? 'historial__pestana historial__pestana--activa' : 'historial__pestana'} onClick={() => alCambiarPestana('partidas')}>Partidas individuales</button>
      <button type="button" role="tab" aria-selected={pestanaActiva === 'torneos'} className={pestanaActiva === 'torneos' ? 'historial__pestana historial__pestana--activa' : 'historial__pestana'} onClick={() => alCambiarPestana('torneos')}>Torneos</button>
    </div>
  )
}

function TablaHistorial({ partidas, alVerDetalle }) {
  return (
    <div className="historial__tabla-contenedor">
      <table className="historial__tabla">
        <thead><tr><th scope="col">Fecha</th><th scope="col">Categoría</th><th scope="col">Modo</th><th scope="col">Resultado</th><th scope="col">Puntaje</th><th scope="col"><span className="historial__solo-lector">Acciones</span></th></tr></thead>
        <tbody>{partidas.map((partida, indice) => <TarjetaPartidaHistorial key={partida.id ?? `${partida.fecha}-${indice}`} partida={partida} alVerDetalle={alVerDetalle} />)}</tbody>
      </table>
    </div>
  )
}

function EstadoVacioHistorial({ pestanaActiva }) {
  const mensaje = pestanaActiva === 'partidas' ? 'Todavía no jugaste partidas' : 'Todavía no participaste en torneos'

  return (
    <div className="historial__vacio">
      <strong>{mensaje}</strong>
      <span>Cuando completes una actividad, vas a encontrarla acá.</span>
      <Enlace to="/jugar">Ir a jugar</Enlace>
    </div>
  )
}

function ContenidoHistorial({ cargando, error, partidas, pestanaActiva, alReintentar, alVerDetalle }) {
  if (cargando) return <output className="historial__estado" aria-live="polite">Cargando historial…</output>
  if (error) return <div className="historial__estado historial__estado--error" role="alert"><p>{error}</p><button type="button" onClick={alReintentar}>Reintentar</button></div>
  if (!partidas?.length) return <EstadoVacioHistorial pestanaActiva={pestanaActiva} />
  return <TablaHistorial partidas={partidas} alVerDetalle={alVerDetalle} />
}

function formatearFechaDetalle(fecha) {
  if (!fecha) return 'No disponible'
  const fechaConvertida = new Date(fecha)
  return Number.isNaN(fechaConvertida.getTime()) ? 'No disponible' : fechaConvertida.toLocaleString('es-AR')
}

function obtenerFilasDetalle(partida) {
  const filas = [
    { etiqueta: 'Fecha', valor: formatearFechaDetalle(partida.fecha) },
    { etiqueta: 'Modo', valor: partida.modo },
    { etiqueta: 'Resultado', valor: partida.resultado },
    { etiqueta: 'Puntaje', valor: `${partida.puntaje.toLocaleString('es-AR')} pts` },
  ]
  if (partida.oponente) filas.push({ etiqueta: 'Oponente', valor: partida.oponente })
  if (partida.detalle) filas.push({ etiqueta: 'Resumen', valor: partida.detalle })
  return filas
}

function DialogoDetalleHistorial({ partida, alCerrar }) {
  if (!partida) return null

  return (
    <div className="historial__velo" role="presentation" onMouseDown={(evento) => cerrarAlPresionarFondo(evento, alCerrar)}>
      <section className="historial__dialogo" role="dialog" aria-modal="true" aria-labelledby="historial-detalle-titulo">
        <button className="historial__cerrar" type="button" aria-label="Cerrar detalle" onClick={alCerrar}>×</button>
        <p className="historial__dialogo-sobretitulo">DETALLE DE ACTIVIDAD</p>
        <h2 id="historial-detalle-titulo">{partida.categoria}</h2>
        <dl>{obtenerFilasDetalle(partida).map(({ etiqueta, valor }) => <div key={etiqueta}><dt>{etiqueta}</dt><dd>{valor}</dd></div>)}</dl>
        <button className="historial__cerrar-accion" type="button" onClick={alCerrar}>Cerrar</button>
      </section>
    </div>
  )
}

function cerrarAlPresionarFondo(evento, cerrar) {
  if (evento.target === evento.currentTarget) cerrar()
}

export default function PaginaHistorialPersonal() {
  const { historial, cargando, error, reintentar } = usarHistorialPersonal()
  const [pestanaActiva, establecerPestana] = usarEstado('partidas')
  const [partidaSeleccionada, establecerPartidaSeleccionada] = usarEstado(null)
  const partidasVisibles = pestanaActiva === 'partidas' ? historial?.partidasHistorial : historial?.torneosHistorial
  const tituloLista = pestanaActiva === 'partidas' ? 'Partidas anteriores' : 'Torneos anteriores'

  return (
    <MarcoTorneo tituloMovil="Mi historial" subtituloMovil="Tus partidas y torneos">
      <section className="historial" aria-labelledby="historial-titulo">
        <header className="historial__introduccion">
          <h1 id="historial-titulo">Mi historial</h1>
          <p>Partidas individuales y torneos en los que participaste.</p>
        </header>
        <PestanasHistorial pestanaActiva={pestanaActiva} alCambiarPestana={establecerPestana} />
        <section className="historial__panel" aria-label={tituloLista}>
          <ContenidoHistorial cargando={cargando} error={error} partidas={partidasVisibles} pestanaActiva={pestanaActiva} alReintentar={reintentar} alVerDetalle={establecerPartidaSeleccionada} />
        </section>
        <DialogoDetalleHistorial partida={partidaSeleccionada} alCerrar={() => establecerPartidaSeleccionada(null)} />
      </section>
    </MarcoTorneo>
  )
}
