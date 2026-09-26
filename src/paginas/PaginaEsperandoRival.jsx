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

function formatearTiempo(segundos) {
  const minutos = Math.floor(segundos / 60)
  const segundosRestantes = segundos % 60
  return `${String(minutos).padStart(2, '0')}:${String(segundosRestantes).padStart(2, '0')}`
}

export default function PaginaEsperandoRival() {
  const navegar = usarNavegacion()
  const canceladoRef = usarReferencia(false)
  const perfilRef = usarReferencia(null)
  const [tiempoEspera, setTiempoEspera] = usarEstado(0)
  const [estadoBusqueda, setEstadoBusqueda] = usarEstado('buscando')
  const [rival, setRival] = usarEstado(null)
  const [jugadorLocal, setJugadorLocal] = usarEstado({
    nombre: 'Jugador',
    alias: 'Tú',
    nivel: 'Jugador',
    avatar: 'JQ',
    puntuacion: 0,
  })

  usarEfecto(() => {
    let activo = true
    obtenerPerfil()
      .then((perfil) => {
        if (!activo) return
        perfilRef.current = perfil
        const alias = perfil?.nombre ? perfil.nombre.split(' ')[0] : 'Tú'
        setJugadorLocal({
          id: perfil?.id,
          nombre: perfil?.nombre ?? 'Jugador',
          alias,
          nivel: perfil?.rol ?? 'Jugador',
          avatar: perfil?.iniciales ?? (alias ? alias.slice(0, 2).toUpperCase() : 'JQ'),
          puntuacion: perfil?.puntajeTotal ?? 0,
        })
      })
      .catch(() => {})

    return () => { activo = false }
  }, [])

  usarEfecto(() => {
    const temporizador = window.setInterval(() => setTiempoEspera((anterior) => anterior + 1), 1000)
    return () => window.clearInterval(temporizador)
  }, [])

  usarEfecto(() => {
    let activo = true
    let intervaloPolling = null
    let temporizadorReintento = null
    let temporizadorNavegacion = null
    let intento = 1
    const maxIntentos = 3
    const tiempoMaximoBusqueda = 20000

    const limpiarSeguimiento = () => {
      if (intervaloPolling) window.clearInterval(intervaloPolling)
      if (temporizadorReintento) window.clearTimeout(temporizadorReintento)
      intervaloPolling = null
      temporizadorReintento = null
    }

    const prepararPartida = (duelo, estadoActual = duelo) => {
      if (!activo || canceladoRef.current) return
      limpiarSeguimiento()

      const rivalFinal = estadoActual.rival || duelo.rival || {
        id: 'rival-online',
        nombre: 'Rival',
        alias: 'Rival',
        avatar: 'RV',
        nivel: 'Online',
        puntuacion: 0,
      }
      const guardado = JSON.parse(window.sessionStorage.getItem('dueloActual') || '{}')
      window.sessionStorage.setItem('dueloActual', JSON.stringify({
        ...guardado,
        id: estadoActual.id || duelo.id,
        estado: estadoActual.estado || duelo.estado,
        jugadorLocal: estadoActual.jugadorLocal || duelo.jugadorLocal || guardado.jugadorLocal,
        rival: rivalFinal,
      }))
      setRival(rivalFinal)
      setEstadoBusqueda('encontrado')
      temporizadorNavegacion = window.setTimeout(() => {
        if (activo && !canceladoRef.current) navegar('/duelo/partida')
      }, 1400)
    }

    const iniciarBusqueda = async () => {
      try {
        if (!activo || canceladoRef.current) return
        setEstadoBusqueda('buscando')
        const perfilActual = perfilRef.current || await obtenerPerfil().catch(() => null)
        const duelo = await buscarRivalDuelo(perfilActual)
        if (!activo || canceladoRef.current) return

        if (!duelo?.id) {
          setEstadoBusqueda('error')
          return
        }

        const estaEnCurso = ['EN_CURSO', 'FINALIZADA', 'FINALIZADO'].includes(duelo.estado)
        if (estaEnCurso) {
          prepararPartida(duelo)
          return
        }

        intervaloPolling = window.setInterval(async () => {
          try {
            const estadoActual = await consultarEstadoDuelo(duelo.id, perfilActual)
            if (!activo || canceladoRef.current) return
            if (estadoActual && ['EN_CURSO', 'FINALIZADA', 'FINALIZADO'].includes(estadoActual.estado)) {
              prepararPartida(duelo, estadoActual)
            }
          } catch {
            // Se reintenta en el siguiente ciclo de consulta.
          }
        }, 1500)

        temporizadorReintento = window.setTimeout(() => {
          if (!activo || canceladoRef.current) return
          limpiarSeguimiento()
          if (intento >= maxIntentos) {
            setEstadoBusqueda('error')
            return
          }
          cancelarBusquedaDuelo()
          intento += 1
          iniciarBusqueda()
        }, tiempoMaximoBusqueda)
      } catch {
        if (activo && !canceladoRef.current) setEstadoBusqueda('error')
      }
    }

    iniciarBusqueda()
    return () => {
      activo = false
      limpiarSeguimiento()
      if (temporizadorNavegacion) window.clearTimeout(temporizadorNavegacion)
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
            <EnlaceNavegacion key={destino} to={destino} className={({ isActive: activo }) => `inicio__enlace${activo ? ' inicio__enlace--activo' : ''}`}>
              <span aria-hidden="true">{simbolo}</span>{titulo}
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
        <div className="inicio__saludo-movil"><strong>Hola, {jugadorLocal.nombre}</strong><span>Cuenta de jugador</span></div>
        <Enlace className="inicio__avatar" to="/perfil" aria-label="Ver mi perfil">{jugadorLocal.avatar}</Enlace>
        <BotonCerrarSesion />
      </header>

      <main className="pagina-esperando-rival__contenido" aria-live="polite">
        <header className="pagina-esperando-rival__encabezado">
          <div>
            <p className="sobretitulo pagina-esperando-rival__etiqueta">DUELO 1V1</p>
            <h1>{estadoBusqueda === 'encontrado' ? '¡Rival encontrado!' : estadoBusqueda === 'error' ? 'Error al buscar rival' : 'Buscando rival...'}</h1>
          </div>
          <Enlace className="pagina-esperando-rival__volver" to="/jugar">Volver al menú</Enlace>
        </header>
        <section className="pagina-esperando-rival__panel">
          <div className="pagina-esperando-rival__estado">
            <ComponenteCargandoDuelo />
            <div className="pagina-esperando-rival__texto">
              <p className="pagina-esperando-rival__subtitulo">
                {estadoBusqueda === 'encontrado' ? 'Preparando la partida' : estadoBusqueda === 'error' ? 'No se pudo conectar con el servidor de emparejamiento' : 'Emparejando con otro jugador'}
              </p>
              <strong className="pagina-esperando-rival__tiempo">{formatearTiempo(tiempoEspera)}</strong>
            </div>
          </div>
          <div className="pagina-esperando-rival__tarjetas">
            <article className="pagina-esperando-rival__jugador pagina-esperando-rival__jugador--local">
              <div className="pagina-esperando-rival__avatar" aria-label={`Jugador local ${jugadorLocal.alias}`}>{jugadorLocal.avatar}</div>
              <div><span className="pagina-esperando-rival__etiqueta">Tú</span><h2>{jugadorLocal.alias}</h2><p>{jugadorLocal.nivel}</p></div>
            </article>
            <article className="pagina-esperando-rival__jugador pagina-esperando-rival__jugador--rival">
              <div className="pagina-esperando-rival__avatar pagina-esperando-rival__avatar--rival" aria-label={rival ? `Rival ${rival.nombre}` : 'Rival pendiente'}>{rival ? rival.avatar : '…'}</div>
              <div><span className="pagina-esperando-rival__etiqueta">Rival</span><h2>{rival ? rival.nombre : 'Esperando rival...'}</h2><p>{rival ? `${rival.alias ?? rival.nombre} · ${rival.puntuacion ?? 0} pts` : 'Se conectará cuando haya un oponente disponible'}</p></div>
            </article>
          </div>
          <div className="pagina-esperando-rival__acciones"><Boton alHacerClic={manejarCancelarBusqueda}>Cancelar búsqueda</Boton></div>
        </section>
      </main>
    </div>
  )
}
