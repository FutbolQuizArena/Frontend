import { useEffect as usarEfecto, useMemo as usarMemo, useState as usarEstado } from 'react'
import { Link as Enlace, NavLink as EnlaceNavegacion, useNavigate as usarNavegacion, useParams as usarParametros } from 'react-router-dom'
import BotonCerrarSesion from '../componentes/BotonCerrarSesion.jsx'
import Boton from '../componentes/Boton.jsx'
import TarjetaComparativaDuelo from '../componentes/TarjetaComparativaDuelo.jsx'
import { obtenerResultadoDuelo, solicitarRevanchaDuelo } from '../servicios/servicioDuelos.js'
import { obtenerPerfil } from '../servicios/servicioPerfil.js'
import '../estilos/estilosResultadoDuelo.css'

const enlaces = [
  { destino: '/home', titulo: 'Inicio', simbolo: '⌂' },
  { destino: '/jugar', titulo: 'Jugar', simbolo: '▶' },
  { destino: '/torneos', titulo: 'Torneos', simbolo: '◆' },
  { destino: '/ranking', titulo: 'Ranking', simbolo: '★' },
  { destino: '/perfil', titulo: 'Perfil', simbolo: '●' },
]

const obtenerEstadoResultado = (resultado) => {
  const ganador = resultado?.ganador ?? 'pendiente'

  if (ganador === 'local') {
    return { texto: '¡VICTORIA!', clase: 'resultado-duelo__banner--victoria' }
  }

  if (ganador === 'rival') {
    return { texto: 'DERROTA', clase: 'resultado-duelo__banner--derrota' }
  }

  if (ganador === 'empate') {
    return { texto: 'EMPATE', clase: 'resultado-duelo__banner--empate' }
  }

  return { texto: 'Esperando al rival...', clase: 'resultado-duelo__banner--pendiente' }
}

export default function PaginaResultadoDuelo() {
  const navegar = usarNavegacion()
  const { idDuelo } = usarParametros()
  const [resultado, setResultado] = usarEstado(null)
  const [cargando, setCargando] = usarEstado(true)
  const [perfilUsuario, setPerfilUsuario] = usarEstado(null)

  usarEfecto(() => {
    let activo = true
    let intervaloPolling = null

    const cargarResultado = async () => {
      try {
        const perfil = await obtenerPerfil().catch(() => null)
        if (activo) setPerfilUsuario(perfil)

        const resultadoGuardado = sessionStorage.getItem('resultadoDuelo')
        let datosLocales = null

        if (resultadoGuardado) {
          try {
            datosLocales = JSON.parse(resultadoGuardado)
            if (activo) {
              setResultado(datosLocales)
              setCargando(false)
            }
          } catch {
            datosLocales = null
          }
        }

        const dueloId = idDuelo || datosLocales?.idPartida
        if (!dueloId) {
          if (activo && !datosLocales) {
            setResultado(null)
            setCargando(false)
          }
          return
        }

        // Consultar resultado en backend para verificar si el rival ya terminó
        const datosBackend = await obtenerResultadoDuelo(dueloId, perfil)
        if (!activo) return

        if (datosBackend) {
          if (datosBackend.estado === 'FINALIZADA' || datosBackend.estado === 'FINALIZADO') {
            setResultado(datosBackend)
            setCargando(false)
            return
          }

          // Si el duelo sigue EN_CURSO (rival aún jugando), mostramos puntaje local y esperamos
          if (datosLocales) {
            setResultado({
              ...datosLocales,
              estado: datosBackend.estado,
              oponente: datosBackend.oponente || datosLocales.oponente,
            })
          } else {
            setResultado(datosBackend)
          }
          setCargando(false)

          // Polling cada 2 segundos hasta que el rival termine
          intervaloPolling = window.setInterval(async () => {
            try {
              const resActualizado = await obtenerResultadoDuelo(dueloId, perfil)
              if (!activo) return
              if (resActualizado && (resActualizado.estado === 'FINALIZADA' || resActualizado.estado === 'FINALIZADO')) {
                setResultado(resActualizado)
                if (intervaloPolling) {
                  window.clearInterval(intervaloPolling)
                  intervaloPolling = null
                }
              }
            } catch {
              // reintentar
            }
          }, 2000)
        }
      } catch (error) {
        if (activo && !resultado) {
          setResultado(null)
          setCargando(false)
        }
      }
    }

    cargarResultado()

    return () => {
      activo = false
      if (intervaloPolling) {
        window.clearInterval(intervaloPolling)
      }
    }
  }, [idDuelo])

  const estadoResultado = usarMemo(() => obtenerEstadoResultado(resultado), [resultado])

  const manejarRevancha = async () => {
    try {
      await solicitarRevanchaDuelo(resultado?.idPartida ?? idDuelo ?? 'demo-duelo')
    } catch (error) {
      // Se permite continuar con la espera del duelo aunque el backend aún no esté conectado.
    }

    navegar('/duelo/esperando')
  }

  const manejarInicio = () => navegar('/home')

  if (cargando) {
    return (
      <div className="inicio resultado-duelo__pagina">
        <aside className="inicio__lateral">
          <Enlace className="marca inicio__marca" to="/home" aria-label="FutbolQuiz Arena">
            FUTBOLQUIZ<span className="marca__arena">ARENA</span>
          </Enlace>
          <nav className="inicio__navegacion" aria-label="Navegación principal">
            {enlaces.map(({ destino, titulo, simbolo }) => (
              <EnlaceNavegacion
                key={destino}
                to={destino}
                className={({ isActive: activo }) => `inicio__enlace${activo ? ' inicio__enlace--activo' : ''}`}
              >
                <span aria-hidden="true">{simbolo}</span>
                {titulo}
              </EnlaceNavegacion>
            ))}
          </nav>
        </aside>

        <main className="resultado-duelo__contenido resultado-duelo__contenido--cargando">
          <p>Cargando resultado...</p>
        </main>
      </div>
    )
  }

  if (!resultado) {
    return (
      <div className="inicio resultado-duelo__pagina">
        <aside className="inicio__lateral">
          <Enlace className="marca inicio__marca" to="/home" aria-label="FutbolQuiz Arena">
            FUTBOLQUIZ<span className="marca__arena">ARENA</span>
          </Enlace>
          <nav className="inicio__navegacion" aria-label="Navegación principal">
            {enlaces.map(({ destino, titulo, simbolo }) => (
              <EnlaceNavegacion
                key={destino}
                to={destino}
                className={({ isActive: activo }) => `inicio__enlace${activo ? ' inicio__enlace--activo' : ''}`}
              >
                <span aria-hidden="true">{simbolo}</span>
                {titulo}
              </EnlaceNavegacion>
            ))}
          </nav>
        </aside>

        <main className="resultado-duelo__contenido">
          <section className="resultado-duelo__panel resultado-duelo__panel--estado-vacio">
            <div className={`resultado-duelo__banner ${estadoResultado.clase}`}>
              <span>{estadoResultado.texto}</span>
            </div>
            <h2 className="resultado-duelo__titulo">Sin datos del duelo</h2>
            <p className="resultado-duelo__descripcion">No se recibió información del enfrentamiento.</p>
            <div className="resultado-duelo__acciones">
              <Boton alHacerClic={() => navegar('/duelo/esperando')}>Pedir Revancha</Boton>
              <button type="button" className="boton boton--secundario" onClick={manejarInicio}>Volver al inicio</button>
            </div>
          </section>
        </main>
      </div>
    )
  }

  const jugadorLocal = resultado.jugadorLocal ?? {
    nombre: perfilUsuario?.nombre ?? 'Tú',
    alias: perfilUsuario?.nombre?.split(' ')[0] ?? 'Tú',
    avatar: perfilUsuario?.iniciales ?? 'JQ',
    puntaje: 0,
    aciertos: 0,
    totalPreguntas: 10,
    tiempoPromedio: 0,
  }

  const oponente = resultado.oponente ?? {
    nombre: 'Rival',
    alias: 'Oponente',
    avatar: 'RV',
    puntaje: 0,
    aciertos: 0,
    totalPreguntas: 10,
    tiempoPromedio: 0,
  }

  const localEsGanador = resultado.ganador === 'local'
  const rivalEsGanador = resultado.ganador === 'rival'
  const empate = resultado.ganador === 'empate'
  const enEspera = resultado.ganador === 'pendiente'

  return (
    <div className="inicio resultado-duelo__pagina">
      <aside className="inicio__lateral">
        <Enlace className="marca inicio__marca" to="/home" aria-label="FutbolQuiz Arena">
          FUTBOLQUIZ<span className="marca__arena">ARENA</span>
        </Enlace>

        <nav className="inicio__navegacion" aria-label="Navegación principal">
          {enlaces.map(({ destino, titulo, simbolo }) => (
            <EnlaceNavegacion
              key={destino}
              to={destino}
              className={({ isActive: activo }) => `inicio__enlace${activo ? ' inicio__enlace--activo' : ''}`}
            >
              <span aria-hidden="true">{simbolo}</span>
              {titulo}
            </EnlaceNavegacion>
          ))}
        </nav>

        <div className="inicio__acumulado">
          <p>PUNTAJE ACUMULADO</p>
          <span>{jugadorLocal.alias} · {jugadorLocal.puntaje} pts</span>
        </div>
      </aside>

      <header className="inicio__cabecera resultado-duelo__cabecera">
        <span className="inicio__escudo" aria-label="FutbolQuiz Arena">FQ</span>
        <div className="inicio__saludo-movil">
          <strong>Hola, {jugadorLocal.alias}</strong>
          <span>Cuenta de jugador</span>
        </div>
        <Enlace className="inicio__avatar" to="/perfil" aria-label="Ver mi perfil">{jugadorLocal.avatar}</Enlace>
        <BotonCerrarSesion />
      </header>

      <main className="resultado-duelo__contenido" aria-live="polite">
        <section className="resultado-duelo__panel">
          <div className={`resultado-duelo__banner ${estadoResultado.clase}`}>
            <span>{estadoResultado.texto}</span>
          </div>

          <header className="resultado-duelo__resumen">
            <div>
              <p className="sobretitulo">RESULTADO DEL DUELO</p>
              <h1>Comparativa final</h1>
            </div>
            <strong className="resultado-duelo__subtitulo">
              {enEspera
                ? 'El rival aún está respondiendo. La pantalla se actualizará automáticamente.'
                : localEsGanador
                ? 'Has ganado el enfrentamiento'
                : rivalEsGanador
                ? 'Has perdido el enfrentamiento'
                : 'Empate perfecto'}
            </strong>
          </header>

          <div className="resultado-duelo__comparativa">
            <TarjetaComparativaDuelo
              jugador={jugadorLocal}
              esLocal
              esGanador={localEsGanador}
              esEmpate={empate}
            />

            <div className="resultado-duelo__versus" aria-label="Enfrentamiento entre jugadores">VS</div>

            <TarjetaComparativaDuelo
              jugador={oponente}
              esGanador={rivalEsGanador}
              esEmpate={empate}
            />
          </div>

          <div className="resultado-duelo__acciones">
            <Boton alHacerClic={manejarRevancha}>Pedir Revancha</Boton>
            <button type="button" className="boton boton--secundario" onClick={manejarInicio}>Volver al inicio</button>
          </div>
        </section>
      </main>
    </div>
  )
}
