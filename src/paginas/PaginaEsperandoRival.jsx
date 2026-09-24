import { useEffect as usarEfecto, useRef as usarReferencia, useState as usarEstado } from 'react'
import { Link as Enlace, NavLink as EnlaceNavegacion, useNavigate as usarNavegacion } from 'react-router-dom'
import Boton from '../componentes/Boton.jsx'
import BotonCerrarSesion from '../componentes/BotonCerrarSesion.jsx'
import ComponenteCargandoDuelo from '../componentes/ComponenteCargandoDuelo.jsx'
import { buscarRivalDuelo, cancelarBusquedaDuelo } from '../servicios/servicioDuelos.js'
import '../estilos/estilosHome.css'
import '../estilos/estilosEsperandoRival.css'

const enlaces = [
  { destino: '/home', titulo: 'Inicio', simbolo: '⌂' },
  { destino: '/jugar', titulo: 'Jugar', simbolo: '▶' },
  { destino: '/torneos', titulo: 'Torneos', simbolo: '◆' },
  { destino: '/ranking', titulo: 'Ranking', simbolo: '★' },
  { destino: '/perfil', titulo: 'Perfil', simbolo: '●' },
]

const jugadorLocal = {
  nombre: 'Lucas',
  alias: 'Luki',
  nivel: 'Rookie',
  avatar: 'LM',
}

function formatearTiempo(segundos) {
  const minutos = Math.floor(segundos / 60)
  const segundosRestantes = segundos % 60
  return `${String(minutos).padStart(2, '0')}:${String(segundosRestantes).padStart(2, '0')}`
}

export default function PaginaEsperandoRival() {
  const navegar = usarNavegacion()
  const canceladoRef = usarReferencia(false)
  const [tiempoEspera, setTiempoEspera] = usarEstado(0)
  const [estadoBusqueda, setEstadoBusqueda] = usarEstado('buscando')
  const [rival, setRival] = usarEstado(null)

  usarEfecto(() => {
    const temporizador = window.setInterval(() => {
      setTiempoEspera((anterior) => anterior + 1)
    }, 1000)

    return () => window.clearInterval(temporizador)
  }, [])

  usarEfecto(() => {
    let activo = true

    buscarRivalDuelo()
      .then((rivalEncontrado) => {
        if (!activo || canceladoRef.current || !rivalEncontrado) {
          return
        }

        setRival(rivalEncontrado)
        setEstadoBusqueda('encontrado')

        window.setTimeout(() => {
          navegar('/duelo/partida')
        }, 1400)
      })
      .catch(() => {
        if (!activo || canceladoRef.current) {
          return
        }

        setEstadoBusqueda('error')
      })

    return () => {
      activo = false
    }
  }, [navegar])

  const manejarCancelarBusqueda = () => {
    canceladoRef.current = true
    cancelarBusquedaDuelo()
    navegar('/jugar')
  }

  return (
    <div className="pagina-esperando-rival">
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

      <header className="inicio__cabecera pagina-esperando-rival__cabecera">
        <span className="inicio__escudo" aria-label="FutbolQuiz Arena">FQ</span>
        <div className="inicio__saludo-movil">
          <strong>Hola, Lucas</strong>
          <span>Cuenta de jugador</span>
        </div>
        <Enlace className="inicio__avatar" to="/perfil" aria-label="Ver mi perfil">LM</Enlace>
        <BotonCerrarSesion />
      </header>

      <main className="pagina-esperando-rival__contenido" aria-live="polite">
        <header className="pagina-esperando-rival__encabezado">
          <div>
            <p className="sobretitulo pagina-esperando-rival__etiqueta">DUELO 1V1</p>
            <h1>{estadoBusqueda === 'encontrado' ? '¡Rival encontrado!' : 'Buscando rival...'}</h1>
          </div>
          <Enlace className="pagina-esperando-rival__volver" to="/jugar">Volver al menú</Enlace>
        </header>

        <section className="pagina-esperando-rival__panel">
          <div className="pagina-esperando-rival__estado">
            <ComponenteCargandoDuelo />

            <div className="pagina-esperando-rival__texto">
              <p className="pagina-esperando-rival__subtitulo">
                {estadoBusqueda === 'encontrado' ? 'Preparando la partida' : 'Emparejando con otro jugador'}
              </p>
              <strong className="pagina-esperando-rival__tiempo">{formatearTiempo(tiempoEspera)}</strong>
            </div>
          </div>

          <div className="pagina-esperando-rival__tarjetas">
            <article className="pagina-esperando-rival__jugador pagina-esperando-rival__jugador--local">
              <div className="pagina-esperando-rival__avatar" aria-label={`Jugador local ${jugadorLocal.alias}`}>
                {jugadorLocal.avatar}
              </div>
              <div>
                <span className="pagina-esperando-rival__etiqueta">Tú</span>
                <h2>{jugadorLocal.alias}</h2>
                <p>{jugadorLocal.nivel}</p>
              </div>
            </article>

            <article className="pagina-esperando-rival__jugador pagina-esperando-rival__jugador--rival">
              <div className="pagina-esperando-rival__avatar pagina-esperando-rival__avatar--rival" aria-label="Rival pendiente">
                {rival ? rival.avatar : '…'}
              </div>
              <div>
                <span className="pagina-esperando-rival__etiqueta">Rival</span>
                <h2>{rival ? rival.nombre : 'Esperando rival...'}</h2>
                <p>{rival ? `${rival.nivel} · ${rival.puntuacion ?? 0} pts` : 'Se conectará cuando haya un oponente disponible'}</p>
              </div>
            </article>
          </div>

          <div className="pagina-esperando-rival__acciones">
            <Boton alHacerClic={manejarCancelarBusqueda}>Cancelar Búsqueda</Boton>
          </div>
        </section>
      </main>
    </div>
  )
}
