import { useEffect as usarEfecto, useMemo as usarMemo, useState as usarEstado } from 'react'
import { Link as Enlace, useNavigate as usarNavegacion, useParams as usarParametros } from 'react-router-dom'
import NavegacionInicio from '../componentes/NavegacionInicio.jsx'
import BotonCerrarSesion from '../componentes/BotonCerrarSesion.jsx'
import Boton from '../componentes/Boton.jsx'
import { navegarConManejo } from '../utilidades/navegacionConManejo.js'
import TarjetaComparativaDuelo from '../componentes/TarjetaComparativaDuelo.jsx'
import { obtenerResultadoDuelo, solicitarRevanchaDuelo } from '../servicios/servicioDuelos.js'
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

function leerResultadoGuardado() {
  const resultadoGuardado = sessionStorage.getItem('resultadoDuelo')
  if (!resultadoGuardado) return null

  try {
    return JSON.parse(resultadoGuardado)
  } catch {
    return null
  }
}

function crearResultadoEnEspera(datosBackend, datosLocales) {
  return {
    ...datosBackend,
    ganador: 'pendiente',
    resultadoTexto: 'Esperando al rival...',
    jugadorLocal: datosLocales?.jugadorLocal || datosBackend.jugadorLocal,
    oponente: {
      ...(datosBackend.oponente || datosLocales?.oponente),
      puntaje: 0,
      aciertos: 0,
    },
  }
}

function iniciarPollingResultado(dueloId, perfil, estaActivo, setResultado, esTorneo) {
  let intervalo
  intervalo = window.setInterval(async () => {
    try {
      const resultadoActualizado = await obtenerResultadoDuelo(dueloId, perfil, esTorneo)
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

  usarEfecto(() => {
    let activo = true
    let intervaloPolling = null

    const cargarResultado = async () => {
      try {
        const perfil = await obtenerPerfil().catch(() => null)
        if (activo) setPerfilUsuario(perfil)

        const datosLocales = leerResultadoGuardado()
        if (datosLocales && activo) {
          setResultado(datosLocales)
          setCargando(false)
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
        const datosBackend = await obtenerResultadoDuelo(dueloId, perfil, esTorneo)
        if (!activo) return

        if (datosBackend) {
          if (estaFinalizado(datosBackend.estado)) {
            setResultado(datosBackend)
            setCargando(false)
            return
          }

          // Si el duelo sigue EN_CURSO (rival aún jugando), el ganador debe ser 'pendiente'
          setResultado(crearResultadoEnEspera(datosBackend, esTorneo ? null : datosLocales))
          setCargando(false)

          // Polling cada 2 segundos hasta que el rival termine
          intervaloPolling = iniciarPollingResultado(dueloId, perfil, () => activo, setResultado, esTorneo)
        }
      } catch (error) {
        console.error('No se pudo consultar el resultado del duelo.', error)
        // Si falla la consulta, conservamos el resultado local o mostramos el estado sin resultado.
        if (activo && !resultado) {
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
  }, [idDuelo])

  const estadoResultado = usarMemo(() => obtenerEstadoResultado(resultado), [resultado])

  const manejarRevancha = async () => {
    try {
      await solicitarRevanchaDuelo(resultado?.idPartida ?? idDuelo ?? 'demo-duelo')
    } catch (error) {
      // Se permite continuar con la espera del duelo aunque el backend aún no esté conectado.
      console.error('No se pudo solicitar la revancha; se continuará con la búsqueda.', error)
    }

    navegarConManejo(navegar, '/duelo/esperando')
  }

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
            <p className="resultado-duelo__descripcion">No se recibió información del enfrentamiento.</p>
            <div className="resultado-duelo__acciones">
              {destinoCuadro ? <Enlace className="boton" to={destinoCuadro}>Volver al cuadro</Enlace> : <Boton alHacerClic={() => navegar('/duelo/esperando')}>Pedir Revancha</Boton>}
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
            {destinoCuadro ? <Enlace className="boton" to={destinoCuadro}>Volver al cuadro</Enlace> : <Boton alHacerClic={() => { void manejarRevancha() }} deshabilitado={enEspera}>Pedir Revancha</Boton>}
            <button type="button" className="boton boton--secundario" onClick={manejarInicio}>Volver al inicio</button>
          </div>
        </section>
      </main>
    </div>
  )
}
