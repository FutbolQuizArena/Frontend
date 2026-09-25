import { useEffect, useMemo, useState } from 'react'
import { Link as Enlace, NavLink as EnlaceNavegacion, useNavigate as usarNavegacion } from 'react-router-dom'
import Boton from '../componentes/Boton.jsx'
import BotonCerrarSesion from '../componentes/BotonCerrarSesion.jsx'
import { obtenerResultadoPartida } from '../servicios/servicioPartidas.js'
import '../estilos/estilosResultadoIndividual.css'

const enlaces = [
  { destino: '/home', titulo: 'Inicio', simbolo: '⌂' },
  { destino: '/jugar', titulo: 'Jugar', simbolo: '▶' },
  { destino: '/torneos', titulo: 'Torneos', simbolo: '◆' },
  { destino: '/ranking', titulo: 'Ranking', simbolo: '★' },
  { destino: '/perfil', titulo: 'Perfil', simbolo: '●' },
]

export default function PaginaResultadoIndividual() {
  const navegar = usarNavegacion()
  const resultadoGuardado = useMemo(() => {
    const valor = sessionStorage.getItem('resultadoPartidaIndividual')
    return valor ? JSON.parse(valor) : null
  }, [])
  const [resultado, setResultado] = useState(resultadoGuardado)

  useEffect(() => {
    const partidaId = Number(resultadoGuardado?.partidaId ?? resultadoGuardado?.partida_id ?? 0)
    if (!partidaId) {
      return undefined
    }

    let cancelado = false

    obtenerResultadoPartida(partidaId)
      .then((resultadoApi) => {
        if (cancelado) {
          return
        }

        const siguienteResultado = {
          ...resultadoGuardado,
          partidaId: resultadoApi.partidaId,
          puntaje: Number(resultadoApi.puntajeFinal ?? resultadoGuardado?.puntaje ?? 0),
          puntaje_final: Number(resultadoApi.puntajeFinal ?? resultadoGuardado?.puntaje_final ?? resultadoGuardado?.puntaje ?? 0),
          totalRespuestas: Number(resultadoGuardado?.totalRespuestas ?? 10),
          respuestasCorrectas: Number(resultadoGuardado?.respuestasCorrectas ?? 0),
          finalizada: true,
          fecha_fin: resultadoApi.fechaFin,
        }

        sessionStorage.setItem('resultadoPartidaIndividual', JSON.stringify(siguienteResultado))
        setResultado(siguienteResultado)
      })
      .catch(() => {
        if (!cancelado) {
          setResultado(resultadoGuardado)
        }
      })

    return () => {
      cancelado = true
    }
  }, [resultadoGuardado])

  const puntaje = Number(resultado?.puntaje_final ?? resultado?.puntaje ?? 0)
  const respuestasCorrectas = Number(resultado?.respuestasCorrectas ?? 0)
  const totalRespuestas = Number(resultado?.totalRespuestas ?? 10)
  const porcentaje = totalRespuestas ? Math.round((respuestasCorrectas / totalRespuestas) * 100) : 0
  const posicion = puntaje >= 1400 ? 'Elite' : puntaje >= 900 ? 'Pro' : 'Rookie'
  const nivelLogro = puntaje >= 1200 ? 'Excelente' : puntaje >= 700 ? 'Muy bien' : 'Buen intento'

  return (
    <div className="inicio resultado-individual__pagina">
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

      <header className="inicio__cabecera resultado-individual__cabecera">
        <span className="inicio__escudo" aria-label="FutbolQuiz Arena">FQ</span>
        <div className="inicio__saludo-movil">
          <strong>Hola, Lucas</strong>
          <span>Cuenta de jugador</span>
        </div>
        <Enlace className="inicio__avatar" to="/perfil" aria-label="Ver mi perfil">LM</Enlace>
        <BotonCerrarSesion />
      </header>

      <main className="resultado-individual__contenido" aria-live="polite">
        <section className="resultado-individual__panel">
          <div className="resultado-individual__intro">
            <p className="sobretitulo">PARTIDA FINALIZADA</p>
            <h1>Resultado de la partida</h1>
          </div>

          <div className="resultado-individual__resumen">
            <div className="resultado-individual__trofeo" aria-hidden="true">🏆</div>
            <div className="resultado-individual__totales">
              <span className="resultado-individual__etiqueta">Puntaje final</span>
              <strong>{puntaje}</strong>
              <small>{nivelLogro} · {posicion}</small>
            </div>
          </div>

          <div className="resultado-individual__estadisticas">
            <div className="resultado-individual__tarjeta-estadistica">
              <span>Respuestas correctas</span>
              <strong>{respuestasCorrectas}</strong>
            </div>
            <div className="resultado-individual__tarjeta-estadistica">
              <span>Precisión</span>
              <strong>{porcentaje}%</strong>
            </div>
            <div className="resultado-individual__tarjeta-estadistica">
              <span>Partidas</span>
              <strong>{totalRespuestas}</strong>
            </div>
          </div>

          <div className="resultado-individual__progreso">
            <div className="resultado-individual__progreso-meta">
              <span>Rendimiento</span>
              <strong>{porcentaje}%</strong>
            </div>
            <div className="resultado-individual__progreso-barra" aria-label="Porcentaje de aciertos">
              <div style={{ width: `${porcentaje}%` }} />
            </div>
          </div>

          <div className="resultado-individual__acciones">
            <Boton alHacerClic={() => navegar('/partida/ruleta')}>Jugar otra vez</Boton>
            <Enlace className="boton boton--secundario resultado-individual__boton-secundario" to="/home">Volver al inicio</Enlace>
          </div>
        </section>

        <aside className="resultado-individual__barra-derecha" aria-label="Resumen del resultado">
          <div className="resultado-individual__estado-partida">Resultado</div>

          <div className="resultado-individual__resumen-card">
            <span>Rendimiento</span>
            <strong>{porcentaje}%</strong>
          </div>

          <div className="resultado-individual__resumen-card">
            <span>Respuesta</span>
            <strong>{respuestasCorrectas}/{totalRespuestas}</strong>
          </div>

          <div className="resultado-individual__resumen-card">
            <span>Ranking</span>
            <strong>#{Math.max(1, 8 - Math.floor(puntaje / 300))}</strong>
          </div>

          <div className="resultado-individual__resumen-card">
            <span>Logro</span>
            <strong>{nivelLogro}</strong>
          </div>
        </aside>
      </main>
    </div>
  )
}
