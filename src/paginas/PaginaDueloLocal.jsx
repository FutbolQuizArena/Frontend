import { useMemo as usarMemo, useState as usarEstado } from 'react'
import { Link as Enlace, NavLink as EnlaceNavegacion, useNavigate as usarNavegacion } from 'react-router-dom'
import BotonCerrarSesion from '../componentes/BotonCerrarSesion.jsx'
import PantallaPreparacionDuelo from '../componentes/PantallaPreparacionDuelo.jsx'
import PantallaCambioTurno from '../componentes/PantallaCambioTurno.jsx'
import PantallaResultadoDueloLocal from '../componentes/PantallaResultadoDueloLocal.jsx'
import { guardarResultadoDueloLocal, iniciarDueloLocal, obtenerPreguntasDueloLocal, registrarRespuestaTurnoLocal } from '../servicios/servicioDuelosLocales.js'
import '../estilos/estilosDueloLocal.css'

const enlaces = [
  { destino: '/home', titulo: 'Inicio', simbolo: '⌂' },
  { destino: '/jugar', titulo: 'Jugar', simbolo: '▶' },
  { destino: '/torneos', titulo: 'Torneos', simbolo: '◆' },
  { destino: '/ranking', titulo: 'Ranking', simbolo: '★' },
  { destino: '/perfil', titulo: 'Perfil', simbolo: '●' },
]

export default function PaginaDueloLocal() {
  const navegar = usarNavegacion()
  const preguntas = usarMemo(() => obtenerPreguntasDueloLocal(), [])
  const [fase, setFase] = usarEstado('preparacion')
  const [nombres, setNombres] = usarEstado({ jugador1: 'Lucas', jugador2: 'Mati' })
  const [turnoActual, setTurnoActual] = usarEstado('jugador1')
  const [indicePregunta, setIndicePregunta] = usarEstado(0)
  const [proximoJugador, setProximoJugador] = usarEstado('jugador2')
  const [idDueloLocal, setIdDueloLocal] = usarEstado(null)
  const [puntajeJugador1, setPuntajeJugador1] = usarEstado(0)
  const [puntajeJugador2, setPuntajeJugador2] = usarEstado(0)
  const [aciertosJugador1, setAciertosJugador1] = usarEstado(0)
  const [aciertosJugador2, setAciertosJugador2] = usarEstado(0)
  const [ultimoResultado, setUltimoResultado] = usarEstado(null)

  const preguntaActual = preguntas[indicePregunta] ?? preguntas[0]
  const jugadorActualNombre = turnoActual === 'jugador1' ? (nombres.jugador1 || 'Jugador 1') : (nombres.jugador2 || 'Jugador 2')
  const jugadorCambioNombre = proximoJugador === 'jugador1' ? (nombres.jugador1 || 'Jugador 1') : (nombres.jugador2 || 'Jugador 2')

  const manejarCambioNombre = (clave, valor) => {
    setNombres((actual) => ({ ...actual, [clave]: valor }))
  }

  const manejarInicioDuelo = async () => {
    const nombreJugador1 = (nombres.jugador1 || 'Jugador 1').trim() || 'Jugador 1'
    const nombreJugador2 = (nombres.jugador2 || 'Jugador 2').trim() || 'Jugador 2'

    const duelo = await iniciarDueloLocal(nombreJugador1, nombreJugador2, 'general')
    setIdDueloLocal(duelo.idDueloLocal)
    setFase('turno')
    setTurnoActual('jugador1')
    setIndicePregunta(0)
    setPuntajeJugador1(0)
    setPuntajeJugador2(0)
    setAciertosJugador1(0)
    setAciertosJugador2(0)
    setUltimoResultado(null)
  }

  const manejarRespuesta = async (opcionSeleccionada) => {
    if (!preguntaActual || fase !== 'turno') {
      return
    }

    const opcionCorrecta = preguntaActual.opcionCorrectaId
    const correcta = opcionSeleccionada === opcionCorrecta
    const puntos = correcta ? 100 : 0

    await registrarRespuestaTurnoLocal(
      idDueloLocal,
      turnoActual,
      preguntaActual.id,
      opcionSeleccionada,
      10,
    )

    if (turnoActual === 'jugador1') {
      setPuntajeJugador1((actual) => actual + puntos)
      if (correcta) {
        setAciertosJugador1((actual) => actual + 1)
      }
    } else {
      setPuntajeJugador2((actual) => actual + puntos)
      if (correcta) {
        setAciertosJugador2((actual) => actual + 1)
      }
    }

    const siguienteJugador = turnoActual === 'jugador1' ? 'jugador2' : 'jugador1'
    setProximoJugador(siguienteJugador)
    setFase('cambioTurno')
  }

  const manejarListo = async () => {
    const siguienteIndice = indicePregunta + 1

    if (siguienteIndice >= preguntas.length) {
      const resultado = {
        ganador: puntajeJugador1 === puntajeJugador2 ? 'empate' : (puntajeJugador1 > puntajeJugador2 ? 'jugador1' : 'jugador2'),
        ganadorNombre: puntajeJugador1 === puntajeJugador2 ? 'Empate' : (puntajeJugador1 > puntajeJugador2 ? nombres.jugador1 : nombres.jugador2),
        puntajeJugador1,
        puntajeJugador2,
        aciertosJugador1,
        aciertosJugador2,
        jugador1Nombre: nombres.jugador1 || 'Jugador 1',
        jugador2Nombre: nombres.jugador2 || 'Jugador 2',
      }

      setUltimoResultado(resultado)
      await guardarResultadoDueloLocal(idDueloLocal ?? 'duelo-local-demo', resultado)
      setFase('resultado')
      return
    }

    setIndicePregunta(siguienteIndice)
    setTurnoActual(proximoJugador)
    setFase('turno')
  }

  const reiniciarDuelo = () => {
    setFase('preparacion')
    setTurnoActual('jugador1')
    setIndicePregunta(0)
    setProximoJugador('jugador2')
    setUltimoResultado(null)
    setPuntajeJugador1(0)
    setPuntajeJugador2(0)
    setAciertosJugador1(0)
    setAciertosJugador2(0)
  }

  return (
    <div className="inicio duelo-local__pagina">
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
          <span>Jugador · 2.450 pts</span>
        </div>
      </aside>

      <header className="inicio__cabecera duelo-local__cabecera">
        <span className="inicio__escudo" aria-label="FutbolQuiz Arena">FQ</span>
        <div className="inicio__saludo-movil">
          <strong>Hola, Lucas</strong>
          <span>Cuenta de jugador</span>
        </div>
        <Enlace className="inicio__avatar" to="/perfil" aria-label="Ver mi perfil">LM</Enlace>
        <BotonCerrarSesion />
      </header>

      <main className="duelo-local__contenido">
        {fase === 'preparacion' && (
          <PantallaPreparacionDuelo nombres={nombres} onChange={manejarCambioNombre} onIniciar={manejarInicioDuelo} />
        )}

        {fase === 'turno' && (
          <div className="duelo-local__panel duelo-local__panel--juego">
            <div className="duelo-local__cabecera-juego">
              <p className="sobretitulo">Duelo local</p>
              <span className="duelo-local__turno">Turno de {jugadorActualNombre}</span>
            </div>

            <h2 className="duelo-local__pregunta">{preguntaActual.enunciado}</h2>

            <div className="duelo-local__opciones">
              {preguntaActual.opciones.map((opcion) => (
                <button
                  key={opcion.id}
                  type="button"
                  className="duelo-local__opcion"
                  onClick={() => manejarRespuesta(opcion.id)}
                  aria-label={`Opción ${opcion.texto}`}
                >
                  {opcion.texto}
                </button>
              ))}
            </div>
          </div>
        )}

        {fase === 'cambioTurno' && (
          <PantallaCambioTurno jugador={jugadorCambioNombre} onListo={manejarListo} />
        )}

        {fase === 'resultado' && (
          <PantallaResultadoDueloLocal
            resultado={ultimoResultado}
            onRevancha={reiniciarDuelo}
            onVolver={() => navegar('/jugar')}
          />
        )}
      </main>
    </div>
  )
}
