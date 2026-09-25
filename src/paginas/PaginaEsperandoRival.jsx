import { useEffect as usarEfecto, useRef as usarReferencia, useState as usarEstado } from 'react'
import { Link as Enlace, NavLink as EnlaceNavegacion, useNavigate as usarNavegacion } from 'react-router-dom'
import Boton from '../componentes/Boton.jsx'
import BotonCerrarSesion from '../componentes/BotonCerrarSesion.jsx'
import ComponenteCargandoDuelo from '../componentes/ComponenteCargandoDuelo.jsx'
import { buscarRivalDuelo, cancelarBusquedaDuelo, consultarEstadoDuelo } from '../servicios/servicioDuelos.js'
import { obtenerPerfil } from '../servicios/servicioPerfil.js'
import '../estilos/estilosHome.css'
import '../estilos/estilosEsperandoRival.css'

const enlaces = [
  { destino: '/home', titulo: 'Inicio', simbolo: '⌂' },
  { destino: '/jugar', titulo: 'Jugar', simbolo: '▶' },
  { destino: '/torneos', titulo: 'Torneos', simbolo: '◆' },
  { destino: '/ranking', titulo: 'Ranking', simbolo: '★' },
  { destino: '/perfil', titulo: 'Perfil', simbolo: '●' },
]

const perfilLocalBase = {
  nombre: 'Jugador',
  alias: 'Jugador',
  nivel: 'Jugador',
  avatar: 'J',
  puntuacion: 0,
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
  const [jugadorLocal, setJugadorLocal] = usarEstado(perfilLocalBase)

  usarEfecto(() => {
    let activo = true

    obtenerPerfil()
      .then((perfil) => {
        if (!activo) return
        const nombre = perfil?.nombre ?? 'Jugador'
        const alias = perfil?.nombre ? nombre.split(' ')[0] : 'Jugador'
        setJugadorLocal({
          nombre,
          alias,
          nivel: perfil?.rol ?? 'Jugador',
          avatar: perfil?.iniciales ?? (alias ? alias.slice(0, 2).toUpperCase() : 'J'),
          puntuacion: perfil?.puntajeTotal ?? 0,
        })
      })
      .catch(() => {})

    return () => {
      activo = false
    }
  }, [])

  usarEfecto(() => {
    const temporizador = window.setInterval(() => {
      setTiempoEspera((anterior) => anterior + 1)
    }, 1000)

    return () => window.clearInterval(temporizador)
  }, [])

  usarEfecto(() => {
    let activo = true
    let intervaloId = null
    let intento = 0
    const MAX_INTENTOS = 3 // número máximo de intentos de búsqueda
    const TIEMPO_MAXIMO = 20000 // 20 s antes de intentar nuevo emparejamiento

    const iniciarEmparejamiento = async () => {
      try {
        setEstadoBusqueda('buscando')
        const duelo = await buscarRivalDuelo(); console.log('[MATCH] duel created', duelo);
        if (!activo || canceladoRef.current) return

        if (!duelo || !duelo.id) {
          setEstadoBusqueda('error')
          return
        }

        // Si el backend ya nos emparejó inmediatamente con un rival en cola
        if ((duelo.estado === 'EN_CURSO' || duelo.estado === 'FINALIZADO') && duelo.rival) {
          setRival(duelo.rival)
          setEstadoBusqueda('encontrado')
          window.setTimeout(() => {
            if (activo && !canceladoRef.current) {
              navegar('/duelo/partida')
            }
          }, 1400)
          return
        }

        // Si quedamos esperando rival (PENDIENTE_RIVAL), consultamos periódicamente el estado de este duelo
        intervaloId = window.setInterval(async () => {
          try {
            const estadoActual = await consultarEstadoDuelo(duelo.id)
            if (!activo || canceladoRef.current) return

            if (
              estadoActual &&
              (estadoActual.estado === 'EN_CURSO' || estadoActual.estado === 'FINALIZADO') &&
              estadoActual.rival
            ) {
              if (intervaloId) {
                window.clearInterval(intervaloId)
                intervaloId = null
              }

              const guardado = JSON.parse(window.sessionStorage.getItem('dueloActual') || '{}')
              window.sessionStorage.setItem(
                'dueloActual',
                JSON.stringify({
                  ...guardado,
                  ...estadoActual,
                  preguntas: guardado.preguntas?.length ? guardado.preguntas : duelo.preguntas,
                })
              )

              setRival(estadoActual.rival)
              setEstadoBusqueda('encontrado')
              window.setTimeout(() => {
                if (activo && !canceladoRef.current) {
                  navegar('/duelo/partida')
                }
              }, 1400)
            }
          } catch {
            // Continúa reintentando en la siguiente iteración
          }
        }, 2500)

        // Reintento después de tiempo máximo si aún sin rival
        const temporizadorReintento = window.setTimeout(() => {
          if (activo && !canceladoRef.current && intento < MAX_INTENTOS) {
            // Cancelamos la búsqueda actual y reintentamos
            if (intervaloId) {
              window.clearInterval(intervaloId)
              intervaloId = null
            }
            cancelarBusquedaDuelo()
            intento++
            iniciarEmparejamiento()
          }
        }, TIEMPO_MAXIMO)

        // Limpiar temporizador de reintento al desmontar o al encontrar rival
        return () => {
          window.clearTimeout(temporizadorReintento)
        }
      } catch {
        if (activo && !canceladoRef.current) {
          setEstadoBusqueda('error')
        }
      }
    }

    iniciarEmparejamiento()

    return () => {
      activo = false
      if (intervaloId) {
        window.clearInterval(intervaloId)
      }
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
          <span>{jugadorLocal.alias} · {jugadorLocal.puntuacion} pts</span>
        </div>
      </aside>

      <header className="inicio__cabecera pagina-esperando-rival__cabecera">
        <span className="inicio__escudo" aria-label="FutbolQuiz Arena">FQ</span>
        <div className="inicio__saludo-movil">
          <strong>Hola, {jugadorLocal.alias}</strong>
          <span>Cuenta de jugador</span>
        </div>
        <Enlace className="inicio__avatar" to="/perfil" aria-label="Ver mi perfil">{jugadorLocal.avatar}</Enlace>
        <BotonCerrarSesion />
      </header>

      <main className="pagina-esperando-rival__contenido" aria-live="polite">
        <header className="pagina-esperando-rival__encabezado">
          <div>
            <p className="sobretitulo pagina-esperando-rival__etiqueta">DUELO 1V1</p>
            <h1>{estadoBusqueda === 'encontrado' ? '¡Rival encontrado!' : 'Buscando rival...'}</h1>
          </div>
          <Enlace className="pagina-esperando-rival__volver" to="/jugar">Volver al menú</Enlace>
        <h1 className="pagina-esperando-rival__titulo">Duelo</h1>
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
                <p>{rival ? `${rival.alias ?? rival.nombre} · ${rival.puntuacion ?? 0} pts` : 'Se conectará cuando haya un oponente disponible'}</p>
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
