import { useEffect, useMemo, useState } from 'react'
import { Link as Enlace, useNavigate as usarNavegacion } from 'react-router-dom'
import NavegacionInicio from '../componentes/NavegacionInicio.jsx'
import Boton from '../componentes/Boton.jsx'
import BotonCerrarSesion from '../componentes/BotonCerrarSesion.jsx'
import { obtenerPerfil } from '../servicios/servicioPerfil.js'
import '../estilos/estilosResultadoIndividual.css'



// Estas etiquetas describen el puntaje de la partida; no representan la posición en el ranking.
function obtenerPosicion(puntaje) {
  if (puntaje >= 1400) return 'Elite'
  if (puntaje >= 900) return 'Pro'
  return 'Rookie'
}

function obtenerNivelLogro(puntaje) {
  if (puntaje >= 1200) return 'Excelente'
  if (puntaje >= 700) return 'Muy bien'
  return 'Buen intento'
}

export default function PaginaResultadoIndividual() {
  const navegar = usarNavegacion()
  // Lee una vez el resultado que se guardó después de la confirmación del servidor.
  const resultadoGuardado = useMemo(() => {
    const valor = sessionStorage.getItem('resultadoPartidaIndividual')
    return valor ? JSON.parse(valor) : null
  }, [])
  const [perfil, setPerfil] = useState(null)

  useEffect(() => {
    let vigente = true
    obtenerPerfil().then((datos) => {
      if (vigente) setPerfil(datos)
    }).catch((error_) => {
      console.error('No se pudo cargar el perfil para el resultado.', error_)
    })
    return () => { vigente = false }
  }, [])

  // El endpoint de resultado finaliza la partida: la pantalla usa la confirmación ya guardada.
  if (!resultadoGuardado?.finalizada) {
    return <main className="resultado-individual__contenido"><p role="alert">No hay un resultado confirmado para mostrar.</p><Enlace to="/jugar">Volver a jugar</Enlace></main>
  }

  const puntaje = Number(resultadoGuardado.puntaje_final)
  const respuestasCorrectas = Number(resultadoGuardado.respuestasCorrectas ?? 0)
  const totalRespuestas = Number(resultadoGuardado.totalRespuestas ?? 0)
  // La precisión es la proporción de respuestas correctas sobre las preguntas respondidas.
  const porcentaje = totalRespuestas ? Math.round((respuestasCorrectas / totalRespuestas) * 100) : 0
  const posicion = obtenerPosicion(puntaje)
  const nivelLogro = obtenerNivelLogro(puntaje)

  return (
    <div className="inicio resultado-individual__pagina">
      <aside className="inicio__lateral">
        <Enlace className="marca inicio__marca" to="/home" aria-label="FutbolQuiz Arena">
          FUTBOLQUIZ<span className="marca__arena">ARENA</span>
        </Enlace>

        <NavegacionInicio destinoJugar="/jugar" />

        <div className="inicio__acumulado">
          <p>PUNTAJE ACUMULADO</p>
          <span>{perfil ? `${perfil.nombre} · ${perfil.puntajeTotal} pts` : 'Cargando perfil...'}</span>
        </div>
      </aside>

      <header className="inicio__cabecera resultado-individual__cabecera">
        <span className="inicio__escudo" aria-label="FutbolQuiz Arena">FQ</span>
        <div className="inicio__saludo-movil">
          <strong>Hola, {perfil?.nombre || 'Jugador'}</strong>
          <span>Cuenta de jugador</span>
        </div>
        <Enlace className="inicio__avatar" to="/perfil" aria-label="Ver mi perfil">{perfil?.iniciales || 'JQ'}</Enlace>
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
              <span>Preguntas respondidas</span>
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
