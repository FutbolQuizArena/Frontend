import { useEffect, useMemo, useState } from 'react'
import { useNavigate as usarNavegacion } from 'react-router-dom'
import Boton from '../componentes/Boton.jsx'
import ComponenteTemporizador from '../componentes/ComponenteTemporizador.jsx'
import TarjetaPregunta from '../componentes/TarjetaPregunta.jsx'
import {
  finalizarPartidaIndividual,
  obtenerPreguntasPorCategoria,
  registrarRespuestaPartida,
} from '../servicios/servicioPartidas.js'
import '../estilos/estilosPartidaIndividual.css'

const obtenerCategoriaGuardada = () => {
  const categoriaGuardada = sessionStorage.getItem('categoriaPartidaSeleccionada')
  return categoriaGuardada || 'Historia'
}

const obtenerParametrosPartida = () => {
  if (typeof window === 'undefined') {
    return { segundosPorPregunta: 15, totalPreguntas: 10 }
  }

  const parametros = new URLSearchParams(window.location.search)
  return {
    segundosPorPregunta: Number(parametros.get('segundosPorPregunta')) || 15,
    totalPreguntas: Number(parametros.get('totalPreguntas')) || 10,
  }
}

export default function PaginaPartidaIndividual() {
  const navegar = usarNavegacion()
  const parametros = useMemo(() => obtenerParametrosPartida(), [])
  const [categoriaActual, setCategoriaActual] = useState(obtenerCategoriaGuardada())
  const [preguntas, setPreguntas] = useState([])
  const [indicePreguntaActual, setIndicePreguntaActual] = useState(0)
  const [respuestaSeleccionada, setRespuestaSeleccionada] = useState(null)
  const [respuestaCorrecta, setRespuestaCorrecta] = useState(null)
  const [mostrarFeedback, setMostrarFeedback] = useState(false)
  const [bloqueado, setBloqueado] = useState(false)
  const [tiempoRestante, setTiempoRestante] = useState(parametros.segundosPorPregunta)
  const [puntaje, setPuntaje] = useState(0)
  const [partidaId, setPartidaId] = useState(() => (crypto?.randomUUID ? crypto.randomUUID() : `partida-${Date.now()}`))
  const [respuestas, setRespuestas] = useState([])

  const preguntaActual = preguntas[indicePreguntaActual] ?? null
  const totalPreguntas = preguntas.length || parametros.totalPreguntas || 10

  useEffect(() => {
    const categoria = obtenerCategoriaGuardada()
    const preguntasCargadas = obtenerPreguntasPorCategoria(categoria, parametros.totalPreguntas || 10)
    setCategoriaActual(categoria)
    setPreguntas(preguntasCargadas)
    setIndicePreguntaActual(0)
    setTiempoRestante(parametros.segundosPorPregunta || 15)
    setRespuestaSeleccionada(null)
    setMostrarFeedback(false)
    setBloqueado(false)
    setPuntaje(0)
    setRespuestas([])
    setRespuestaCorrecta(null)
  }, [parametros.segundosPorPregunta, parametros.totalPreguntas])

  useEffect(() => {
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
    const siguienteIndice = indicePreguntaActual + 1

    if (siguienteIndice >= preguntas.length) {
      const respuestasFinales = [...respuestas]
      const resultado = finalizarPartidaIndividual(partidaId, respuestasFinales)
      sessionStorage.setItem('resultadoPartidaIndividual', JSON.stringify(resultado))
      navegar('/partida/resultado')
      return
    }

    setIndicePreguntaActual(siguienteIndice)
    setTiempoRestante(parametros.segundosPorPregunta || 15)
    setRespuestaSeleccionada(null)
    setMostrarFeedback(false)
    setBloqueado(false)
    setRespuestaCorrecta(null)
  }

  const manejarRespuesta = (opcionSeleccionada, esCorrecta, tiempoAgotado = false) => {
    if (!preguntaActual || bloqueado) {
      return
    }

    const tiempoUsado = tiempoAgotado ? parametros.segundosPorPregunta || 15 : Math.max(1, (parametros.segundosPorPregunta || 15) - tiempoRestante)
    const respuestaRegistrada = {
      idPartida: partidaId,
      idPregunta: preguntaActual.id,
      opcionSeleccionada: opcionSeleccionada ?? null,
      tiempoEmpleado: tiempoUsado,
      esCorrecta: Boolean(opcionSeleccionada) && esCorrecta,
      tiempoAgotado,
    }

    registrarRespuestaPartida(
      partidaId,
      preguntaActual.id,
      opcionSeleccionada,
      tiempoUsado,
    )

    const nuevasRespuestas = [...respuestas, respuestaRegistrada]
    setRespuestas(nuevasRespuestas)
    setRespuestaSeleccionada(opcionSeleccionada)
    setMostrarFeedback(true)
    setBloqueado(true)
    setRespuestaCorrecta(esCorrecta)

    if (esCorrecta) {
      const puntosGanados = 100 + (tiempoRestante * 5)
      setPuntaje((valorActual) => valorActual + puntosGanados)
    }

    window.setTimeout(() => {
      const siguienteIndice = indicePreguntaActual + 1
      if (siguienteIndice >= preguntas.length) {
        const resultado = finalizarPartidaIndividual(partidaId, nuevasRespuestas)
        sessionStorage.setItem('resultadoPartidaIndividual', JSON.stringify(resultado))
        navegar('/partida/resultado')
        return
      }

      setIndicePreguntaActual(siguienteIndice)
      setTiempoRestante(parametros.segundosPorPregunta || 15)
      setRespuestaSeleccionada(null)
      setMostrarFeedback(false)
      setBloqueado(false)
      setRespuestaCorrecta(null)
    }, 1200)
  }

  if (!preguntaActual) {
    return <main className="partida-individual partida-individual--carga">Cargando preguntas...</main>
  }

  const progreso = ((indicePreguntaActual + 1) / totalPreguntas) * 100

  return (
    <main className="partida-individual">
      <aside className="partida-individual__barra-lateral">
        <div className="partida-individual__marca">
          <span className="partida-individual__logo">FQ</span>
          <div>
            <p className="partida-individual__apodo">FUTBOLQUIZ</p>
            <strong>ARENA</strong>
          </div>
        </div>
        <div className="partida-individual__estadistica">
          <span>Puntaje</span>
          <strong>{puntaje}</strong>
        </div>
        <div className="partida-individual__estadistica">
          <span>Categoría</span>
          <strong>{categoriaActual}</strong>
        </div>
      </aside>

      <section className="partida-individual__panel">
        <header className="partida-individual__cabecera">
          <div>
            <p className="sobretitulo">PARTIDA INDIVIDUAL</p>
            <h1>Pregunta {indicePreguntaActual + 1} de {totalPreguntas}</h1>
          </div>
          <ComponenteTemporizador tiempoRestante={tiempoRestante} tiempoTotal={parametros.segundosPorPregunta || 15} enCurso={!bloqueado} />
        </header>

        <div className="partida-individual__progreso" aria-label="Progreso de la partida">
          <span>{categoriaActual}</span>
          <div className="partida-individual__progreso-barra">
            <div style={{ width: `${progreso}%` }} />
          </div>
        </div>

        <TarjetaPregunta
          pregunta={preguntaActual}
          indicePregunta={indicePreguntaActual}
          totalPreguntas={totalPreguntas}
          respuestaSeleccionada={respuestaSeleccionada}
          respuestaCorrecta={respuestaCorrecta}
          mostrarFeedback={mostrarFeedback}
          bloqueado={bloqueado}
          onSeleccionar={(opcionId) => {
            const opcionElegida = preguntaActual.opciones.find((opcion) => opcion.id === opcionId)
            const esCorrecta = opcionElegida?.id === preguntaActual.opcionCorrectaId
            manejarRespuesta(opcionElegida?.id ?? null, esCorrecta, false)
          }}
        />

        {mostrarFeedback && (
          <div className="partida-individual__acciones">
            <Boton alHacerClic={() => {
              const siguienteIndice = indicePreguntaActual + 1
              if (siguienteIndice >= preguntas.length) {
                const resultado = finalizarPartidaIndividual(partidaId, [...respuestas, {
                  idPartida: partidaId,
                  idPregunta: preguntaActual.id,
                  opcionSeleccionada: respuestaSeleccionada,
                  tiempoEmpleado: (parametros.segundosPorPregunta || 15) - tiempoRestante,
                  esCorrecta: respuestaCorrecta,
                  tiempoAgotado: false,
                }])
                sessionStorage.setItem('resultadoPartidaIndividual', JSON.stringify(resultado))
                navegar('/partida/resultado')
                return
              }

              setIndicePreguntaActual(siguienteIndice)
              setTiempoRestante(parametros.segundosPorPregunta || 15)
              setRespuestaSeleccionada(null)
              setMostrarFeedback(false)
              setBloqueado(false)
              setRespuestaCorrecta(null)
            }}>
              Siguiente
            </Boton>
          </div>
        )}
      </section>
    </main>
  )
}
