import { useEffect as usarEfecto, useState as usarEstado } from 'react'
import { Link as Enlace } from 'react-router-dom'
import MarcoTorneo from '../componentes/MarcoTorneo.jsx'
import TarjetaPodio from '../componentes/TarjetaPodio.jsx'
import TablaRanking from '../componentes/TablaRanking.jsx'
import { obtenerRankingGeneral } from '../servicios/servicioRanking.js'
import '../estilos/estilosSalaDetalleTorneo.css'
import '../estilos/estilosRankingGeneral.css'

export default function PaginaRankingGeneral() {
  const [datosRanking, establecerDatosRanking] = usarEstado(null)
  const [error, establecerError] = usarEstado('')

  usarEfecto(() => {
    let activa = true
    // La vista solo conoce el contrato del servicio; toda la comunicación HTTP queda fuera de React.
    obtenerRankingGeneral().then((datos) => {
      if (activa) establecerDatosRanking(datos)
    }).catch((fallo) => {
      if (activa) establecerError(fallo?.message || 'No pudimos cargar el ranking.')
    })
    return () => { activa = false }
  }, [])

  const listaClasificacion = datosRanking?.listaClasificacion ?? []
  const podio = listaClasificacion.slice(0, 3)
  // El orden visual del podio es segundo, primero y tercero, con el ganador en el centro.
  const usuariosPodio = [podio[1], podio[0], podio[2]].filter(Boolean)

  return (
    <MarcoTorneo tituloMovil="Ranking general" subtituloMovil="Clasificación por puntos acumulados" claseAdicional="marco-torneo--ranking" inicialesUsuario={datosRanking?.usuarioActual?.avatar}>
      <div className="ranking-general">
        <header className="ranking-general__encabezado">
          <div>
            <h1>Ranking general</h1>
            <p>Clasificación por puntos acumulados</p>
          </div>
          <Enlace className="ranking-general__volver" to="/home">Volver al inicio</Enlace>
        </header>

        {error && <p className="ranking-general__estado" role="alert">{error}</p>}
        {!error && !datosRanking && <p className="ranking-general__estado" role="status">Cargando ranking…</p>}

        {datosRanking && (
          <>
            <section className="ranking-podio" aria-label="Podio de los tres primeros puestos">
              {usuariosPodio.map((usuario) => (
                <TarjetaPodio key={usuario.id} usuario={usuario} puesto={usuario.posicion} destacada={usuario.posicion === 1} />
              ))}
            </section>
            <TablaRanking usuarios={listaClasificacion} usuarioActual={datosRanking.usuarioActual} />
          </>
        )}
      </div>
    </MarcoTorneo>
  )
}
