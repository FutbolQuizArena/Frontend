import { useEffect as usarEfecto, useState as usarEstado } from 'react'
import { Link as Enlace, NavLink as EnlaceNavegacion, useNavigate as usarNavegacion } from 'react-router-dom'
import BotonCerrarSesion from '../componentes/BotonCerrarSesion.jsx'
import MarcadorDuelo from '../componentes/MarcadorDuelo.jsx'
import TarjetaJugadorDuelo from '../componentes/TarjetaJugadorDuelo.jsx'
import { obtenerPreguntasDuelo, registrarRespuestaDuelo, simularRespuestaRival } from '../servicios/servicioDuelos.js'
import '../estilos/estilosPartidaDuelo.css'

const enlaces = [
  { destino: '/home', titulo: 'Inicio', simbolo: '⌂' },
  { destino: '/duelo/partida', titulo: 'Jugar', simbolo: '▶' },
  { destino: '/torneos', titulo: 'Torneos', simbolo: '◆' },
  { destino: '/ranking', titulo: 'Ranking', simbolo: '★' },
  { destino: '/perfil', titulo: 'Perfil', simbolo: '●' },
]

const jugadorLocalBase = {
  nombre: 'Lucas',
  alias: 'Luki',
  avatar: 'LM',
}

const rivalBase = {
  nombre: 'Rival',
  alias: 'Oponente',
  avatar: 'RV',
}

const obtenerTiempoBase = () => 15

export default function PaginaPartidaDuelo() {
  const navegar = usarNavegacion()
  const [partidaId] = usarEstado(() => (window.crypto?.randomUUID ? window.crypto.randomUUID() : `duelo-${Date.now()}`))
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
  const [estadoRival, setEstadoRival] = usarEstado('Esperando respuesta')

  const preguntaActual = preguntas[indicePregunta] ?? null
  const totalPreguntas = preguntas.length || 1

  const categoriaActual = preguntaActual?.categoria ?? 'Historia'

  usarEfecto(() => {
    const preguntasCargadas = obtenerPreguntasDuelo('duelo-demo')
    setPreguntas(preguntasCargadas)
  }, [])

  usarEfecto(() => {
    if (!preguntaActual || bloqueado || mostrarFeedback) {
      return undefined
    }

    if (tiempoRestante <= 0) {
      manejarRespuesta(null, false, true)
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
  }, [bloqueado, mostrarFeedback, preguntaActual, tiempoRestante])

  const avanzarPregunta = () => {
    const siguienteIndice = indicePregunta + 1

    if (siguienteIndice >= preguntas.length) {
      const resultado = {
        idPartida: partidaId,
        puntajeLocal,
        puntajeRival,
        aciertosLocal,
        aciertosRival,
        finalizada: true,
      }
      sessionStorage.setItem('resultadoDuelo', JSON.stringify(resultado))
      navegar('/duelo/resultado')
      return
    }

    setIndicePregunta(siguienteIndice)
    setRespuestaSeleccionada(null)
    setEstadoFeedback(null)
    setMostrarFeedback(false)
    setBloqueado(false)
    setTiempoRestante(obtenerTiempoBase())
    setEstadoRival('Respondiendo...')
  }

  const manejarRespuesta = (opcionSeleccionada, esCorrecta, tiempoAgotado = false) => {
    if (!preguntaActual || bloqueado) {
      return
    }

    const tiempoUsado = tiempoAgotado ? obtenerTiempoBase() : Math.max(1, obtenerTiempoBase() - tiempoRestante)
    registrarRespuestaDuelo(partidaId, preguntaActual.id, opcionSeleccionada, tiempoUsado)

    const respuestaRival = simularRespuestaRival(preguntaActual.id)
    const rivalAcerto = Boolean(respuestaRival?.correcta)

    setRespuestaSeleccionada(opcionSeleccionada)
    setBloqueado(true)
    setMostrarFeedback(true)
    setEstadoFeedback(esCorrecta ? 'correcta' : 'incorrecta')
    setEstadoRival(rivalAcerto ? 'Respondió correctamente' : 'Respondió incorrectamente')

    if (esCorrecta) {
      const puntos = 100 + (tiempoRestante * 5)
      setPuntajeLocal((valorActual) => valorActual + puntos)
      setAciertosLocal((valorActual) => valorActual + 1)
    }

    if (rivalAcerto) {
      const puntosRival = 100 + Math.max(0, (obtenerTiempoBase() - 1) * 4)
      setPuntajeRival((valorActual) => valorActual + puntosRival)
      setAciertosRival((valorActual) => valorActual + 1)
    }

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
          <span>Jugador · {puntajeLocal} pts</span>
        </div>
      </aside>

      <header className="inicio__cabecera">
        <span className="inicio__escudo" aria-label="FutbolQuiz Arena">FQ</span>
        <div className="inicio__saludo-movil">
          <strong>Hola</strong>
          <span>Cuenta de jugador</span>
        </div>
        <Enlace className="inicio__avatar" to="/perfil" aria-label="Ver mi perfil">LM</Enlace>
        <BotonCerrarSesion />
      </header>

      <main className="partida-duelo__contenido">
        <header className="partida-duelo__cabecera">
          <p className="sobretitulo">PARTIDA DE DUELO</p>
          <h1>Partida 1v1</h1>
        </header>

        <section className="partida-duelo__marcadores" aria-label="Marcadores del duelo">
          <TarjetaJugadorDuelo
            nombre={jugadorLocalBase.nombre}
            alias={jugadorLocalBase.alias}
            avatar={jugadorLocalBase.avatar}
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
            nombre={rivalBase.nombre}
            alias={rivalBase.alias}
            avatar={rivalBase.avatar}
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
              const opcionEsCorrecta = opcion.id === preguntaActual.opcionCorrectaId
              const opcionSeleccionada = respuestaSeleccionada === opcion.id
              const showCorrect = mostrarFeedback && opcionEsCorrecta
              const showIncorrect = mostrarFeedback && opcionSeleccionada && !opcionEsCorrecta

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
                  disabled={bloqueado || mostrarFeedback}
                  onClick={() => {
                    const seleccion = opcion.id
                    manejarRespuesta(seleccion, seleccion === preguntaActual.opcionCorrectaId, false)
                  }}
                >
                  {opcion.texto}
                </button>
              )
            })}
          </div>

          {mostrarFeedback && (
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
