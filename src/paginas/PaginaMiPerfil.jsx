import { useEffect as usarEfecto, useState as usarEstado } from 'react'
import { Link as Enlace } from 'react-router-dom'
import MarcoPerfil from '../componentes/MarcoPerfil.jsx'
import { obtenerHistorialPersonal } from '../servicios/servicioHistorial.js'
import { obtenerPerfil } from '../servicios/servicioPerfil.js'
import { obtenerPosicionUsuarioActual } from '../servicios/servicioRanking.js'
import '../estilos/estilosMiPerfil.css'

const accesos = [
  { destino: '/historial', simbolo: '◷', titulo: 'Historial de partidas', descripcion: 'Tus partidas y torneos anteriores' },
  { destino: '/perfil/editar', simbolo: '⌘', titulo: 'Editar perfil', descripcion: 'Actualizá tus datos y contraseña' },
  { destino: '/torneos', simbolo: '▦', titulo: 'Mis torneos', descripcion: 'Consultá tu participación y resultados' },
]

export default function PaginaMiPerfil() {
  const [perfil, establecerPerfil] = usarEstado(null)
  const [resumen, establecerResumen] = usarEstado(null)
  const [cargando, establecerCargando] = usarEstado(true)
  const [error, establecerError] = usarEstado('')

  usarEfecto(() => {
    let vigente = true
    obtenerPerfil()
      .then((datos) => { if (vigente) establecerPerfil(datos) })
      .catch((error_) => { if (vigente) establecerError(error_.message || 'No pudimos cargar tu perfil.') })
      .finally(() => { if (vigente) establecerCargando(false) })

    async function cargarResumen() {
      const [historial, ranking] = await Promise.allSettled([
        obtenerHistorialPersonal(),
        obtenerPosicionUsuarioActual(),
      ])
      if (!vigente) return

      const estadisticas = historial.status === 'fulfilled' ? historial.value.estadisticasGenerales : null
      establecerResumen({
        partidas: estadisticas?.partidasJugadas ?? null,
        victorias: estadisticas?.duelosGanados ?? null,
        torneos: estadisticas?.torneosDisputados ?? null,
        posicion: ranking.status === 'fulfilled' ? ranking.value : null,
      })
    }

    void cargarResumen()
    return () => { vigente = false }
  }, [])

  const puntaje = perfil?.puntajeTotal
  const mostrarCantidad = (cantidad) => cantidad == null ? '—' : cantidad.toLocaleString('es-AR')

  return (
    <MarcoPerfil tituloMovil="Mi perfil" subtituloMovil="Cuenta y estadísticas" perfil={perfil}>
      <main className="perfil__contenido mi-perfil__contenido" id="contenido-perfil" aria-busy={cargando}>
        <div className="mi-perfil__introduccion">
          <h1>Mi perfil</h1>
          <p>Administrá tus datos y consultá tu actividad.</p>
        </div>

        {error && <p className="mensaje mensaje--error" role="alert">{error}</p>}
        {cargando && <p className="mi-perfil__estado"><output>Cargando perfil…</output></p>}

        {!cargando && perfil && <>
          <section className="mi-perfil__identidad" aria-label="Datos de la cuenta">
            <span className="mi-perfil__iniciales" aria-hidden="true">{perfil.iniciales}</span>
            <div className="mi-perfil__datos">
              <h2>{perfil.nombre}</h2>
              <p>{perfil.correo}</p>
              <span className="mi-perfil__rol">{perfil.rol === 'ADMINISTRADOR' ? 'ADMINISTRADOR' : 'JUGADOR'}</span>
            </div>
            <div className="mi-perfil__puntaje">
              <span>{perfil.rol === 'ADMINISTRADOR' ? 'Administrador' : 'Jugador'}</span>
              <strong>{puntaje.toLocaleString('es-AR')} puntos</strong>
            </div>
          </section>

          <div className="mi-perfil__columnas">
            <section className="mi-perfil__actividad" aria-labelledby="titulo-actividad">
              <h2 id="titulo-actividad">Cuenta y actividad</h2>
              <div className="mi-perfil__accesos">
                {accesos.map(({ destino, simbolo, titulo, descripcion }) => (
                  <Enlace className="mi-perfil__acceso" key={destino} to={destino}>
                    <span className="mi-perfil__simbolo" aria-hidden="true">{simbolo}</span>
                    <span><strong>{titulo}</strong><small>{descripcion}</small></span>
                    <span className="mi-perfil__flecha" aria-hidden="true">›</span>
                  </Enlace>
                ))}
              </div>
            </section>

            <section className="mi-perfil__resumen" aria-labelledby="titulo-resumen">
              <h2 id="titulo-resumen">Resumen</h2>
              <dl>
                <div><dt>Partidas</dt><dd>{mostrarCantidad(resumen?.partidas)}</dd></div>
                <div><dt>Victorias en duelos</dt><dd>{mostrarCantidad(resumen?.victorias)}</dd></div>
                <div><dt>Torneos jugados</dt><dd>{mostrarCantidad(resumen?.torneos)}</dd></div>
                <div><dt>Ranking general</dt><dd>{resumen?.posicion == null ? '—' : `#${resumen.posicion}`}</dd></div>
              </dl>
              {resumen && Object.values(resumen).some((valor) => valor == null) &&
                <p className="mi-perfil__nota">Algunas estadísticas no están disponibles en este momento.</p>}
            </section>
          </div>
        </>}
      </main>
    </MarcoPerfil>
  )
}
