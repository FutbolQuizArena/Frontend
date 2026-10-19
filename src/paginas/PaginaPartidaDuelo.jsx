import { useEffect as usarEfecto, useRef as usarReferencia, useState as usarEstado } from 'react'
import { Link as Enlace, NavLink as EnlaceNavegacion, useNavigate as usarNavegacion } from 'react-router-dom'
import BotonCerrarSesion from '../componentes/BotonCerrarSesion.jsx'
import MarcadorDuelo from '../componentes/MarcadorDuelo.jsx'
import TarjetaJugadorDuelo from '../componentes/TarjetaJugadorDuelo.jsx'
import { generarAlias, generarAvatar, obtenerPreguntasDuelo, registrarRespuestaDuelo, simularRespuestaRival } from '../servicios/servicioDuelos.js'
import { obtenerPerfil } from '../servicios/servicioPerfil.js'
import '../estilos/estilosPartidaDuelo.css'

const enlaces = [
  { destino: '/home', titulo: 'Inicio', simbolo: '⌂' },
  { destino: '/duelo/partida', titulo: 'Jugar', simbolo: '▶' },
  { destino: '/torneos', titulo: 'Torneos', simbolo: '◆' },
  { destino: '/ranking', titulo: 'Ranking', simbolo: '★' },
  { destino: '/perfil', titulo: 'Perfil', simbolo: '●' },
]

const obtenerTiempoBase = () => 15

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
  const [mostrarFeedback, setMostrarFeedback] = usarEstado(false)
  const [bloqueado, setBloqueado] = usarEstado(false)
  const [tiempoRestante, setTiempoRestante] = usarEstado(obtenerTiempoBase())
  const [puntajeLocal, setPuntajeLocal] = usarEstado(0)
  const [puntajeRival, setPuntajeRival] = usarEstado(0)
  const [aciertosLocal, setAciertosLocal] = usarEstado(0)
  const [aciertosRival, setAciertosRival] = usarEstado(0)
  const [estadoRival, setEstadoRival] = usarEstado('Respondiendo...')
  const [categoriaDuelo, setCategoriaDuelo] = usarEstado('Fútbol')

  const puntajeLocalRef = usarReferencia(0)
  const aciertosLocalRef = usarReferencia(0)
  const puntajeRivalRef = usarReferencia(0)
  const aciertosRivalRef = usarReferencia(0)

  const preguntaActual = preguntas[indicePregunta] ?? null
  const totalPreguntas = preguntas.length || 1
  const categoriaActual = (preguntaActual?.categoria && preguntaActual.categoria !== 'Aleatoria')
    ? preguntaActual.categoria
    : categoriaDuelo

  usarEfecto(() => {
    let activo = true

    // Cargar información guardada del duelo actual
    if (typeof window !== 'undefined') {
      const guardado = window.sessionStorage.getItem('dueloActual')
      if (guardado) {
        try {
          const duelo = JSON.parse(guardado)
          if (duelo.id) setPartidaId(duelo.id)
          if (duelo.jugadorLocal) setJugadorLocal(duelo.jugadorLocal)
          if (duelo.rival) setRival(duelo.rival)
          if (duelo.categoriaNombre || duelo.categoria_nombre) {
            setCategoriaDuelo(duelo.categoriaNombre || duelo.categoria_nombre)
          }
        } catch {
          // fallback
        }
      }
    }

    // Cargar perfil real si faltan datos del usuario local
    obtenerPerfil()
      .then((perfil) => {
        if (!activo || !perfil) return
        const alias = perfil.nombre ? perfil.nombre.split(' ')[0] : 'Tú'
        setJugadorLocal((prev) => ({
          ...prev,
          nombre: perfil.nombre || prev.nombre,
          alias: alias || prev.alias,
          avatar: perfil.iniciales || prev.avatar,
        }))
      })
      .catch(() => {})

    const preguntasCargadas = obtenerPreguntasDuelo(partidaId)
    setPreguntas(preguntasCargadas)

    return () => {
      activo = false
    }
  }, [])

  usarEfecto(() => {
    if (!preguntaActual || bloqueado || estadoFeedback) {
      return undefined
    }

    if (tiempoRestante <= 0) {
      manejarRespuesta(null, true)
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

  const avanzarPregunta = () => {
    const siguienteIndice = indicePregunta + 1

    if (siguienteIndice >= preguntas.length) {
      const totalPuntajeLocal = puntajeLocalRef.current
      const totalAciertosLocal = aciertosLocalRef.current

      // Al terminar las preguntas propias, el resultado final queda pendiente hasta que el rival también termine
      const resultado = {
        idPartida: partidaId,
        estado: 'EN_CURSO',
        ganador: 'pendiente',
        resultadoTexto: 'Esperando al rival...',
        jugadorLocal: {
          nombre: jugadorLocal.nombre,
          alias: jugadorLocal.alias,
          avatar: jugadorLocal.avatar,
          puntaje: totalPuntajeLocal,
          aciertos: totalAciertosLocal,
          totalPreguntas: preguntas.length || 10,
          tiempoPromedio: 0,
        },
        oponente: {
          nombre: rival.nombre,
          alias: rival.alias,
          avatar: rival.avatar,
          puntaje: 0,
          aciertos: 0,
          totalPreguntas: preguntas.length || 10,
          tiempoPromedio: 0,
        },
        resumen: {
          diferencia: 0,
          porcentajeLocal: Math.round((totalAciertosLocal / (preguntas.length || 10)) * 100),
          porcentajeOponente: 0,
        },
        finalizada: false,
      }
      sessionStorage.setItem('resultadoDuelo', JSON.stringify(resultado))
      navegar(`/duelo/${partidaId}/resultado`)
      return
    }

    setIndicePregunta(siguienteIndice)
    setRespuestaSeleccionada(null)
    setEstadoFeedback(null)
    setBloqueado(false)
    setTiempoRestante(obtenerTiempoBase())
    setEstadoRival('Respondiendo...')
  }

  const manejarRespuesta = async (opcionSeleccionada, tiempoAgotado = false) => {
    if (!preguntaActual || bloqueado) {
      return
    }

    setBloqueado(true)
    setRespuestaSeleccionada(opcionSeleccionada)

    const tiempoUsado = tiempoAgotado ? obtenerTiempoBase() : Math.max(1, obtenerTiempoBase() - tiempoRestante)
    
    // Registrar respuesta real en el backend:
    const resultadoApi = await registrarRespuestaDuelo(partidaId, preguntaActual.id, opcionSeleccionada, tiempoUsado)
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

    window.setTimeout(() => {
      avanzarPregunta()
    }, 1200)
  }

  if (!preguntaActual) {
    return <main className="partida-duelo__loading">Cargando duelo...</main>
  }

  return (
    <div className="inicio partida-duelo__pagina">
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
          <h1>Partida 1v1</h1>
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
                    manejarRespuesta(opcion.id, false)
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
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
