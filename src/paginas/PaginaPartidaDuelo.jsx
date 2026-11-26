import { useEffect as usarEfecto, useRef as usarReferencia, useState as usarEstado } from 'react'
import { Link as Enlace, useNavigate as usarNavegacion } from 'react-router-dom'
import NavegacionInicio from '../componentes/NavegacionInicio.jsx'
import BotonCerrarSesion from '../componentes/BotonCerrarSesion.jsx'
import MarcadorDuelo from '../componentes/MarcadorDuelo.jsx'
import TarjetaJugadorDuelo from '../componentes/TarjetaJugadorDuelo.jsx'
import { recuperarJuegoDuelo, registrarRespuestaDuelo } from '../servicios/servicioDuelos.js'
import usarPresenciaDuelo from '../ganchos/usarPresenciaDuelo.js'
import { obtenerPerfil } from '../servicios/servicioPerfil.js'
import { navegarConManejo } from '../utilidades/navegacionConManejo.js'
import '../estilos/estilosPartidaDuelo.css'



const obtenerTiempoBase = () => 15

// Recupera de esta pestaña el ID del duelo, sus jugadores y la categoría.
function restaurarDueloGuardado(setPartidaId, setJugadorLocal, setRival, setCategoriaDuelo) {
  if (typeof window === 'undefined') return null
  const guardado = window.sessionStorage.getItem('dueloActual')
  if (!guardado) return null

  try {
    const duelo = JSON.parse(guardado)
    if (duelo.id) setPartidaId(duelo.id)
    if (duelo.jugadorLocal) setJugadorLocal(duelo.jugadorLocal)
    if (duelo.rival) setRival(duelo.rival)
    if (duelo.categoriaNombre || duelo.categoria_nombre) {
      setCategoriaDuelo(duelo.categoriaNombre || duelo.categoria_nombre)
    }
    return duelo
  } catch {
    // Si los datos guardados no son válidos, se conservan los valores iniciales.
    return null
  }
}

// Conserva una copia local del progreso confirmado por el servidor.
function guardarPreguntaRespondida(idPregunta) {
  const guardado = window.sessionStorage.getItem('dueloActual')
  if (!guardado) return
  try {
    const duelo = JSON.parse(guardado)
    duelo.preguntas = duelo.preguntas.map((pregunta) =>
      String(pregunta.id) === String(idPregunta) ? { ...pregunta, estaRespondida: true } : pregunta
    )
    window.sessionStorage.setItem('dueloActual', JSON.stringify(duelo))
  } catch {
    // El servidor conserva las respuestas; al volver al cuadro se recupera el estado real.
  }
}

// Busca la próxima pregunta que todavía no figura como respondida.
function siguientePreguntaPendiente(preguntas, indiceActual) {
  const siguiente = preguntas.findIndex((pregunta, indice) => indice > indiceActual && !pregunta.estaRespondida)
  return siguiente === -1 ? preguntas.length : siguiente
}

function avanzarPreguntaDuelo({ siguienteIndice, preguntas, partidaId, navegar, setIndicePregunta, setRespuestaSeleccionada, setEstadoFeedback, setBloqueado, setTiempoRestante, setEstadoRival }) {
  if (siguienteIndice >= preguntas.length) {
    // Abre la pantalla que consulta el resultado del duelo al servidor.
    navegarConManejo(navegar, `/duelo/${partidaId}/resultado`)
    return
  }

  setIndicePregunta(siguienteIndice)
  setRespuestaSeleccionada(null)
  setEstadoFeedback(null)
  setBloqueado(false)
  setTiempoRestante(obtenerTiempoBase())
  setEstadoRival('Respondiendo...')
}

// Envía la respuesta y actualiza los puntos solo después de recibir la confirmación del servidor.
async function procesarRespuestaDuelo({ opcionSeleccionada, tiempoAgotado, preguntaActual, bloqueado, tiempoRestante, partidaId, recuperarProgreso, setBloqueado, setRespuestaSeleccionada, setEstadoFeedback, setEstadoRival, setMensajeError, setTiempoRestante, puntajeLocalRef, aciertosLocalRef, setPuntajeLocal, setAciertosLocal }) {
  if (!preguntaActual || bloqueado) return

  setBloqueado(true)
  setRespuestaSeleccionada(opcionSeleccionada)
  setMensajeError('')
  const tiempoUsado = tiempoAgotado ? obtenerTiempoBase() : Math.max(1, obtenerTiempoBase() - tiempoRestante)
  let resultadoApi
  try {
    resultadoApi = await registrarRespuestaDuelo(partidaId, preguntaActual.id, opcionSeleccionada, tiempoUsado)
  } catch (error) {
    if (error.codigo === 'PREGUNTA_YA_RESPONDIDA' || error.codigo === 'PARTIDA_YA_FINALIZADA') {
      recuperarProgreso()
      return
    }
    setMensajeError(error.message || 'No pudimos guardar la respuesta. Intentá de nuevo.')
    setRespuestaSeleccionada(null)
    setTiempoRestante(obtenerTiempoBase())
    setBloqueado(false)
    return
  }
  guardarPreguntaRespondida(preguntaActual.id)
  const acerto = Boolean(resultadoApi?.esCorrecta)
  const puntosGanados = Number(resultadoApi?.puntajeObtenido ?? 0)

  setEstadoFeedback(acerto ? 'correcta' : 'incorrecta')

  if (acerto) {
    puntajeLocalRef.current += puntosGanados
    aciertosLocalRef.current += 1
    setPuntajeLocal(puntajeLocalRef.current)
    setAciertosLocal(aciertosLocalRef.current)
  }

  setEstadoRival('Respondiendo...')
  // El efecto del feedback controla el avance y limpia el temporizador al salir.
}

/** Recupera el duelo activo, envía respuestas y controla el avance hasta su resultado. */
export default function PaginaPartidaDuelo() {
  const navegar = usarNavegacion()
  const [partidaId, setPartidaId] = usarEstado(() => (window.crypto?.randomUUID ? window.crypto.randomUUID() : `duelo-${Date.now()}`))
  const [jugadorLocal, setJugadorLocal] = usarEstado({
    nombre: 'Jugador',
    alias: 'Tú',
    avatar: 'JQ',
  })
  const [rival, setRival] = usarEstado({
    nombre: 'Rival',
    alias: 'Oponente',
    avatar: 'RV',
  })
  const [preguntas, setPreguntas] = usarEstado([])
  const [indicePregunta, setIndicePregunta] = usarEstado(0)
  const [respuestaSeleccionada, setRespuestaSeleccionada] = usarEstado(null)
  const [estadoFeedback, setEstadoFeedback] = usarEstado(null)
  const [bloqueado, setBloqueado] = usarEstado(false)
  const [tiempoRestante, setTiempoRestante] = usarEstado(obtenerTiempoBase())
  const [puntajeLocal, setPuntajeLocal] = usarEstado(0)
  const [puntajeRival, setPuntajeRival] = usarEstado(0)
  const [aciertosLocal, setAciertosLocal] = usarEstado(0)
  const [aciertosRival, setAciertosRival] = usarEstado(0)
  const [estadoRival, setEstadoRival] = usarEstado('Respondiendo...')
  const [categoriaDuelo, setCategoriaDuelo] = usarEstado('Fútbol')
  const [esTorneo, setEsTorneo] = usarEstado(false)
  const [mensajeError, setMensajeError] = usarEstado('')
  const [cargando, setCargando] = usarEstado(true)
  const [intentoCarga, setIntentoCarga] = usarEstado(0)
  const [usuarioId, setUsuarioId] = usarEstado(null)
  const { estado: presencia, errorConexion } = usarPresenciaDuelo(partidaId)

  const puntajeLocalRef = usarReferencia(0)
  const aciertosLocalRef = usarReferencia(0)
  const preguntaActual = preguntas[indicePregunta] ?? null
  const totalPreguntas = preguntas.length || 1
  const categoriaActual = (preguntaActual?.categoria && preguntaActual.categoria !== 'Aleatoria')
    ? preguntaActual.categoria
    : categoriaDuelo

  usarEfecto(() => {
    let activo = true
    setCargando(true)
    setPreguntas([])
    setEstadoFeedback(null)
    setBloqueado(false)
    setTiempoRestante(obtenerTiempoBase())
    setMensajeError('')

    const dueloGuardado = restaurarDueloGuardado(setPartidaId, setJugadorLocal, setRival, setCategoriaDuelo)
    setEsTorneo(Boolean(dueloGuardado?.torneoId))

    // Cargar perfil real si faltan datos del usuario local
    obtenerPerfil()
      .then(async (perfil) => {
        if (!activo) return
        if (!dueloGuardado?.id) throw new Error('No se pudo identificar el duelo.')
        setUsuarioId(perfil.id)
        const juego = await recuperarJuegoDuelo(dueloGuardado.id, perfil)
        if (!activo) return
        if (juego.estado === 'FINALIZADA') {
          navegarConManejo(navegar, `/duelo/${juego.id}/resultado`)
          return
        }
        const primeraPendiente = juego.preguntas.findIndex((pregunta) => !pregunta.estaRespondida)
        if (primeraPendiente === -1) {
          navegarConManejo(navegar, `/duelo/${juego.id}/resultado`)
          return
        }
        setPreguntas(juego.preguntas)
        setIndicePregunta(primeraPendiente)
        puntajeLocalRef.current = juego.puntajePropio || 0
        aciertosLocalRef.current = juego.aciertosPropios || 0
        setPuntajeLocal(puntajeLocalRef.current)
        setAciertosLocal(aciertosLocalRef.current)
        setRival(juego.rival || dueloGuardado.rival)
        sessionStorage.setItem('dueloActual', JSON.stringify({ ...dueloGuardado, ...juego }))
        setCargando(false)
        const alias = perfil.nombre ? perfil.nombre.split(' ')[0] : 'Tú'
        setJugadorLocal((prev) => ({
          ...prev,
          nombre: perfil.nombre || prev.nombre,
          alias: alias || prev.alias,
          avatar: perfil.iniciales || prev.avatar,
        }))
      })
      .catch((error) => {
        if (activo) {
          setMensajeError(error.message || 'No se pudo recuperar el duelo.')
          setCargando(false)
        }
      })

    return () => {
      activo = false
    }
  }, [intentoCarga])

  usarEfecto(() => {
    if (!presencia || !usuarioId) return
    if (presencia.estado === 'FINALIZADA') {
      navegarConManejo(navegar, `/duelo/${partidaId}/resultado`)
      return
    }
    const numero = Number(presencia.jugador1_id) === Number(usuarioId) ? 1 : 2
    const numeroRival = numero === 1 ? 2 : 1
    setEstadoRival(presencia[`jugador${numeroRival}_completo`] ? 'Terminó sus preguntas'
      : presencia[`jugador${numeroRival}_ausente`] ? 'Sin conexión. Esperando reconexión…' : 'Respondiendo...')
    setPuntajeRival(presencia[`puntaje_jugador${numeroRival}`] || 0)
    setAciertosRival(presencia[`aciertos_jugador${numeroRival}`] || 0)
  }, [presencia, usuarioId, partidaId, navegar])

  usarEfecto(() => {
    if (!preguntaActual || bloqueado || estadoFeedback) {
      return undefined
    }

    if (tiempoRestante <= 0) {
      void manejarRespuesta(null, true)
      return undefined
    }

    const temporizador = window.setInterval(() => {
      setTiempoRestante((valorActual) => {
        if (valorActual <= 1) {
          window.clearInterval(temporizador)
          return 0
        }

        return valorActual - 1
      })
    }, 1000)

    return () => window.clearInterval(temporizador)
  }, [bloqueado, estadoFeedback, preguntaActual, tiempoRestante])

  const avanzarPregunta = () => avanzarPreguntaDuelo({
    siguienteIndice: siguientePreguntaPendiente(preguntas, indicePregunta),
    preguntas,
    partidaId,
    navegar,
    setIndicePregunta,
    setRespuestaSeleccionada,
    setEstadoFeedback,
    setBloqueado,
    setTiempoRestante,
    setEstadoRival,
  })

  usarEfecto(() => {
    if (!estadoFeedback) return
    const temporizador = window.setTimeout(avanzarPregunta, 1200)
    return () => window.clearTimeout(temporizador)
  }, [estadoFeedback, indicePregunta])

  const manejarRespuesta = (opcionSeleccionada, tiempoAgotado = false) => procesarRespuestaDuelo({
    opcionSeleccionada,
    tiempoAgotado,
    preguntaActual,
    bloqueado,
    tiempoRestante,
    partidaId,
    recuperarProgreso: () => setIntentoCarga((n) => n + 1),
    setBloqueado,
    setRespuestaSeleccionada,
    setEstadoFeedback,
    setEstadoRival,
    setMensajeError,
    setTiempoRestante,
    puntajeLocalRef,
    aciertosLocalRef,
    setPuntajeLocal,
    setAciertosLocal,
  })

  if (cargando) return <main className="partida-duelo__loading">Recuperando duelo…</main>
  if (!preguntaActual) {
    return <main className="partida-duelo__loading"><p role="alert">{mensajeError || 'No hay preguntas reales disponibles para este duelo.'}</p><button onClick={() => { setCargando(true); setIntentoCarga((n) => n + 1) }}>Reintentar</button><Enlace to="/jugar">Volver a jugar</Enlace></main>
  }

  return (
    <div className="inicio partida-duelo__pagina">
      <aside className="inicio__lateral">
        <Enlace className="marca inicio__marca" to="/home" aria-label="FutbolQuiz Arena">
          FUTBOLQUIZ<span className="marca__arena">ARENA</span>
        </Enlace>

        <NavegacionInicio destinoJugar="/duelo/partida" />

        <div className="inicio__acumulado">
          <p>PUNTAJE ACUMULADO</p>
          <span>{jugadorLocal.alias} · {puntajeLocal} pts</span>
        </div>
      </aside>

      <header className="inicio__cabecera">
        <span className="inicio__escudo" aria-label="FutbolQuiz Arena">FQ</span>
        <div className="inicio__saludo-movil">
          <strong>Hola, {jugadorLocal.alias}</strong>
          <span>Cuenta de jugador</span>
        </div>
        <Enlace className="inicio__avatar" to="/perfil" aria-label="Ver mi perfil">{jugadorLocal.avatar}</Enlace>
        <BotonCerrarSesion />
      </header>

      <main className="partida-duelo__contenido">
        <header className="partida-duelo__cabecera">
          <p className="sobretitulo">PARTIDA DE DUELO</p>
          <h1>{esTorneo ? 'Duelo de torneo' : 'Partida 1v1'}</h1>
        </header>

        <section className="partida-duelo__marcadores" aria-label="Marcadores del duelo">
          <TarjetaJugadorDuelo
            nombre={jugadorLocal.nombre}
            alias={jugadorLocal.alias}
            avatar={jugadorLocal.avatar}
            puntaje={puntajeLocal}
            aciertos={aciertosLocal}
            estado={bloqueado ? 'Respuesta enviada' : 'Respondiendo...'}
            local
          />

          <MarcadorDuelo
            categoriaActual={categoriaActual}
            tiempoRestante={tiempoRestante}
            tiempoTotal={obtenerTiempoBase()}
          />

          <TarjetaJugadorDuelo
            nombre={rival.nombre}
            alias={rival.alias}
            avatar={rival.avatar}
            puntaje={puntajeRival}
            aciertos={aciertosRival}
            estado={estadoRival}
          />
        </section>

        <section className="partida-duelo__tarjeta" aria-live="polite">
          <div className="partida-duelo__encabezado-pregunta">
            <span>Pregunta {indicePregunta + 1}</span>
            <strong>{totalPreguntas} preguntas</strong>
          </div>

          <h2 className="partida-duelo__pregunta">{preguntaActual.enunciado}</h2>

          <div className="partida-duelo__lista-opciones">
            {preguntaActual.opciones.map((opcion) => {
              const opcionSeleccionada = respuestaSeleccionada === opcion.id
              const showCorrect = Boolean(estadoFeedback && opcionSeleccionada && estadoFeedback === 'correcta')
              const showIncorrect = Boolean(estadoFeedback && opcionSeleccionada && estadoFeedback === 'incorrecta')

              return (
                <button
                  key={opcion.id}
                  type="button"
                  className={[
                    'partida-duelo__opcion',
                    showCorrect ? 'partida-duelo__opcion--correcta' : '',
                    showIncorrect ? 'partida-duelo__opcion--incorrecta' : '',
                  ].filter(Boolean).join(' ')}
                  data-testid="opcion-duelo"
                  disabled={bloqueado || Boolean(estadoFeedback)}
                  onClick={() => {
                    void manejarRespuesta(opcion.id, false)
                  }}
                >
                  {opcion.texto}
                </button>
              )
            })}
          </div>

          {estadoFeedback && (
            <div className="partida-duelo__feedback">
              <strong>{estadoFeedback === 'correcta' ? 'Respuesta correcta' : 'Respuesta incorrecta'}</strong>
              {' '}El rival también está resolviendo la pregunta.
              {' '}La siguiente pregunta aparecerá automáticamente.
            </div>
          )}
          {mensajeError && <p className="partida-duelo__feedback" role="alert">{mensajeError}</p>}
          {errorConexion && <p role="status">Se perdió la conexión. Intentando reconectar…</p>}
        </section>
      </main>
    </div>
  )
}
