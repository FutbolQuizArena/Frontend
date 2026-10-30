import { useEffect as usarEfecto, useMemo as usarMemo, useState as usarEstado } from 'react'
import { Link as Enlace, useNavigate as usarNavegacion, useParams as usarParametros } from 'react-router-dom'
import NavegacionInicio from '../componentes/NavegacionInicio.jsx'
import BotonCerrarSesion from '../componentes/BotonCerrarSesion.jsx'
import Boton from '../componentes/Boton.jsx'
import { navegarConManejo } from '../utilidades/navegacionConManejo.js'
import TarjetaComparativaDuelo from '../componentes/TarjetaComparativaDuelo.jsx'
import { obtenerResultadoDuelo } from '../servicios/servicioDuelos.js'
import { obtenerPerfil } from '../servicios/servicioPerfil.js'
import '../estilos/estilosResultadoDuelo.css'



const obtenerEstadoResultado = (resultado) => {
  const estaFinalizado = resultado?.estado === 'FINALIZADA' || resultado?.estado === 'FINALIZADO'
  if (!estaFinalizado) {
    return { texto: 'Esperando al rival...', clase: 'resultado-duelo__banner--pendiente' }
  }

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

function obtenerSubtituloComparativa(enEspera, localEsGanador, rivalEsGanador) {
  if (enEspera) return 'El rival aún está respondiendo. La pantalla se actualizará automáticamente.'
  if (localEsGanador) return 'Has ganado el enfrentamiento'
  if (rivalEsGanador) return 'Has perdido el enfrentamiento'
  return 'Empate perfecto'
}

function estaFinalizado(estado) {
  return estado === 'FINALIZADA' || estado === 'FINALIZADO'
}

/** Conserva el marcador conocido mientras falta que termine el rival. */
function crearResultadoEnEspera(datosBackend) {
  return {
    ...datosBackend,
    ganador: 'pendiente',
    resultadoTexto: 'Esperando al rival...',
  }
}

// Consulta el resultado cada dos segundos y detiene las consultas cuando finaliza el duelo.
/** Reconsulta hasta que el servidor dé el duelo por terminado. */
function iniciarPollingResultado(dueloId, perfil, estaActivo, setResultado) {
  let intervalo
  intervalo = window.setInterval(async () => {
    try {
      const resultadoActualizado = await obtenerResultadoDuelo(dueloId, perfil)
      if (!estaActivo()) return
      if (resultadoActualizado && estaFinalizado(resultadoActualizado.estado)) {
        setResultado(resultadoActualizado)
        window.clearInterval(intervalo)
      }
    } catch {
      // Se reintenta en el próximo intervalo.
    }
  }, 2000)

  return intervalo
}

// Muestra el resultado recibido o mantiene la espera mientras el rival termina de responder.
async function consultarResultadoBackend(dueloId, perfil, estaActivo, setResultado, setCargando) {
  const datosBackend = await obtenerResultadoDuelo(dueloId, perfil)
  if (!estaActivo() || !datosBackend) return null

  if (estaFinalizado(datosBackend.estado)) {
    setResultado(datosBackend)
    setCargando(false)
    return null
  }

  setResultado(crearResultadoEnEspera(datosBackend))
  setCargando(false)
  return iniciarPollingResultado(dueloId, perfil, estaActivo, setResultado)
}

function NavegacionResultadoDuelo({ jugadorLocal }) {
  return <aside className="inicio__lateral">
    <Enlace className="marca inicio__marca" to="/home" aria-label="FutbolQuiz Arena">
      FUTBOLQUIZ<span className="marca__arena">ARENA</span>
    </Enlace>
    <NavegacionInicio destinoJugar="/jugar" />
    {jugadorLocal && <div className="inicio__acumulado">
      <p>PUNTAJE ACUMULADO</p>
      <span>{jugadorLocal.alias} · {jugadorLocal.puntaje} pts</span>
    </div>}
  </aside>
}

/** Consulta el cierre del duelo y mantiene la espera si el rival todavía no terminó. */
export default function PaginaResultadoDuelo() {
  const navegar = usarNavegacion()
  const { idDuelo } = usarParametros()
  const dueloGuardado = (() => {
    try { return JSON.parse(sessionStorage.getItem('dueloActual') || 'null') } catch { return null }
  })()
  const esTorneo = Boolean(dueloGuardado?.torneoId && Number(dueloGuardado.id) === Number(idDuelo))
  const destinoCuadro = esTorneo ? `/torneos/${dueloGuardado.torneoId}/cuadro` : null
  const [resultado, setResultado] = usarEstado(null)
  const [cargando, setCargando] = usarEstado(true)
  const [perfilUsuario, setPerfilUsuario] = usarEstado(null)
  const [errorResultado, setErrorResultado] = usarEstado('')
  const [intentoConsulta, setIntentoConsulta] = usarEstado(0)

  usarEfecto(() => {
    let activo = true
    let intervaloPolling = null

    const cargarResultado = async () => {
      try {
        setErrorResultado('')
        const perfil = await obtenerPerfil().catch(() => null)
        if (activo) setPerfilUsuario(perfil)
        if (!idDuelo) throw new Error('No se recibió el ID del duelo.')

        // Consultar el resultado y esperar a que el rival termine si sigue en curso.
        intervaloPolling = await consultarResultadoBackend(
          idDuelo, perfil, () => activo, setResultado, setCargando
        )
      } catch (error) {
        console.error('No se pudo consultar el resultado del duelo.', error)
        if (activo) {
          setErrorResultado('No se pudo consultar el resultado del duelo. Intentá de nuevo.')
          setResultado(null)
          setCargando(false)
        }
      }
    }

    void cargarResultado()

    return () => {
      activo = false
      if (intervaloPolling) {
        window.clearInterval(intervaloPolling)
      }
    }
  }, [idDuelo, intentoConsulta])

  const estadoResultado = usarMemo(() => obtenerEstadoResultado(resultado), [resultado])

  // La pantalla de espera hace el único POST de emparejamiento para esta revancha.
  const manejarRevancha = () => navegarConManejo(navegar, '/duelo/esperando')

  const manejarInicio = () => navegar('/home')

  if (cargando) {
    return (
      <div className="inicio resultado-duelo__pagina">
        <NavegacionResultadoDuelo />

        <main className="resultado-duelo__contenido resultado-duelo__contenido--cargando">
          <p>Cargando resultado...</p>
        </main>
      </div>
    )
  }

  if (!resultado) {
    return (
      <div className="inicio resultado-duelo__pagina">
        <NavegacionResultadoDuelo />

        <main className="resultado-duelo__contenido">
          <section className="resultado-duelo__panel resultado-duelo__panel--estado-vacio">
            <div className={`resultado-duelo__banner ${estadoResultado.clase}`}>
              <span>{estadoResultado.texto}</span>
            </div>
            <h2 className="resultado-duelo__titulo">Sin datos del duelo</h2>
            <p className="resultado-duelo__descripcion" role="alert">{errorResultado || 'No se recibió información del enfrentamiento.'}</p>
            <div className="resultado-duelo__acciones">
              <Boton alHacerClic={() => { setCargando(true); setIntentoConsulta((actual) => actual + 1) }}>Reintentar</Boton>
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

  const resultadoFinalizado = resultado?.estado === 'FINALIZADA' || resultado?.estado === 'FINALIZADO'
  const localEsGanador = resultadoFinalizado && resultado.ganador === 'local'
  const rivalEsGanador = resultadoFinalizado && resultado.ganador === 'rival'
  const empate = resultadoFinalizado && resultado.ganador === 'empate'
  const enEspera = !resultadoFinalizado || resultado.ganador === 'pendiente'

  return (
    <div className="inicio resultado-duelo__pagina">
      <NavegacionResultadoDuelo jugadorLocal={jugadorLocal} />

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
            <strong className="resultado-duelo__subtitulo">{obtenerSubtituloComparativa(enEspera, localEsGanador, rivalEsGanador)}</strong>
          </header>

          <div className="resultado-duelo__comparativa">
            <TarjetaComparativaDuelo
              jugador={jugadorLocal}
              esLocal
              esGanador={localEsGanador}
              esEmpate={empate}
              enEspera={enEspera}
            />

            <div className="resultado-duelo__versus" aria-label="Enfrentamiento entre jugadores">VS</div>

            <TarjetaComparativaDuelo
              jugador={oponente}
              esGanador={rivalEsGanador}
              esEmpate={empate}
              enEspera={enEspera}
            />
          </div>

          <div className="resultado-duelo__acciones">
            {destinoCuadro ? <Enlace className="boton" to={destinoCuadro}>Volver al cuadro</Enlace> : <Boton alHacerClic={manejarRevancha} deshabilitado={enEspera}>Pedir Revancha</Boton>}
            <button type="button" className="boton boton--secundario" onClick={manejarInicio}>Volver al inicio</button>
          </div>
        </section>
      </main>
    </div>
  )
}
