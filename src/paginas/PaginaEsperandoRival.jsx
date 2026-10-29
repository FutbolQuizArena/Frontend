import { useEffect as usarEfecto, useRef as usarReferencia, useState as usarEstado } from 'react'
import { Link as Enlace, useNavigate as usarNavegacion } from 'react-router-dom'
import NavegacionInicio from '../componentes/NavegacionInicio.jsx'
import Boton from '../componentes/Boton.jsx'
import BotonCerrarSesion from '../componentes/BotonCerrarSesion.jsx'
import ComponenteCargandoDuelo from '../componentes/ComponenteCargandoDuelo.jsx'
import { buscarRivalDuelo, cancelarBusquedaDuelo, consultarEstadoDuelo } from '../servicios/servicioDuelos.js'
import { obtenerPerfil } from '../servicios/servicioPerfil.js'
import { navegarConManejo } from '../utilidades/navegacionConManejo.js'
import '../estilos/estilosHome.css'
import '../estilos/estilosEsperandoRival.css'



function formatearTiempo(segundos) {
  const minutos = Math.floor(segundos / 60)
  const segundosRestantes = segundos % 60
  return `${String(minutos).padStart(2, '0')}:${String(segundosRestantes).padStart(2, '0')}`
}

function obtenerTituloBusqueda(estadoBusqueda) {
  if (estadoBusqueda === 'encontrado') return '¡Rival encontrado!'
  if (estadoBusqueda === 'sin-rival') return 'No encontramos rival'
  if (estadoBusqueda === 'error') return 'Error al buscar rival'
  return 'Buscando rival...'
}

function obtenerSubtituloBusqueda(estadoBusqueda) {
  if (estadoBusqueda === 'encontrado') return 'Preparando la partida'
  if (estadoBusqueda === 'sin-rival') return 'La búsqueda terminó. Podés iniciar otra desde el menú.'
  if (estadoBusqueda === 'error') return 'No se pudo conectar con el servidor de emparejamiento'
  return 'Emparejando con otro jugador'
}

function programarEntradaALaPartida(montadoRef, canceladoRef, navegar) {
  return window.setTimeout(() => {
    if (montadoRef.current && !canceladoRef.current) {
      navegarConManejo(navegar, '/duelo/partida')
    }
  }, 1400)
}

export default function PaginaEsperandoRival() {
  const navegar = usarNavegacion()
  const canceladoRef = usarReferencia(false)
  const montadoRef = usarReferencia(true)
  const busquedaPromesaRef = usarReferencia(null)
  const intervaloPollingRef = usarReferencia(null)
  const emparejadoRef = usarReferencia(false)
  const [tiempoEspera, setTiempoEspera] = usarEstado(null)
  const [busquedaExpiraEn, setBusquedaExpiraEn] = usarEstado(null)
  const [estadoBusqueda, setEstadoBusqueda] = usarEstado('buscando')
  const [cancelando, setCancelando] = usarEstado(false)
  const [mensajeError, setMensajeError] = usarEstado('')
  const [intentoConsulta, setIntentoConsulta] = usarEstado(0)
  const [rival, setRival] = usarEstado(null)
  const perfilRef = usarReferencia(null)
  const [jugadorLocal, setJugadorLocal] = usarEstado({
    nombre: 'Jugador',
    alias: 'Tú',
    nivel: 'Jugador',
    avatar: 'JQ',
    puntuacion: 0,
  })

  // Cargar perfil real del usuario conectado
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
      .catch((error) => {
        console.error('No se pudo cargar el perfil; se mantienen los datos predeterminados.', error)
      })

    return () => {
      activo = false
    }
  }, [])

  // La cuenta regresiva usa la fecha UTC del servidor, incluso si la pestaña queda en segundo plano.
  usarEfecto(() => {
    if (!busquedaExpiraEn) return undefined
    const actualizarTiempo = () => {
      const milisegundos = Date.parse(busquedaExpiraEn) - Date.now()
      setTiempoEspera(Number.isFinite(milisegundos) ? Math.max(0, Math.ceil(milisegundos / 1000)) : null)
    }
    actualizarTiempo()
    const temporizador = window.setInterval(actualizarTiempo, 1000)
    return () => window.clearInterval(temporizador)
  }, [busquedaExpiraEn])

  // Conserva la partida confirmada y abre sus preguntas solo cuando existe jugador 2.
  const continuarConRival = (duelo) => {
    emparejadoRef.current = true
    if (intervaloPollingRef.current) {
      window.clearInterval(intervaloPollingRef.current)
      intervaloPollingRef.current = null
    }
    const guardado = JSON.parse(window.sessionStorage.getItem('dueloActual') || '{}')
    const rivalEncontrado = duelo.rival || { id: duelo.jugador2Id, nombre: 'Rival', alias: 'Rival', avatar: 'RV', nivel: 'Online', puntuacion: 0 }
    window.sessionStorage.setItem('dueloActual', JSON.stringify({
      ...guardado,
      ...duelo,
      categoriaNombre: duelo.categoriaNombre || guardado.categoriaNombre || 'Fútbol',
      jugadorLocal: duelo.jugadorLocal || guardado.jugadorLocal,
      rival: rivalEncontrado,
    }))
    setRival(rivalEncontrado)
    setEstadoBusqueda('encontrado')
    programarEntradaALaPartida(montadoRef, canceladoRef, navegar)
  }

  // Una búsqueda finalizada sin jugador 2 deja de consultar y no se trata como empate.
  const mostrarBusquedaSinRival = () => {
    if (intervaloPollingRef.current) {
      window.clearInterval(intervaloPollingRef.current)
      intervaloPollingRef.current = null
    }
    window.sessionStorage.removeItem('dueloActual')
    setBusquedaExpiraEn(null)
    setEstadoBusqueda('sin-rival')
    setTiempoEspera(0)
  }

  // Inicia una sola búsqueda y consulta su estado sin crear duelos adicionales.
  usarEfecto(() => {
    montadoRef.current = true

    const iniciarBusqueda = async () => {
      try {
        setEstadoBusqueda('buscando')

        // En desarrollo (React StrictMode), el efecto se ejecuta dos veces al montar.
        // La promesa incluye el perfil para que Cancelar pueda esperarla desde el primer clic.
        if (!busquedaPromesaRef.current) {
          busquedaPromesaRef.current = (async () => {
            const perfilActual = perfilRef.current || await obtenerPerfil().catch(() => null)
            if (perfilActual) perfilRef.current = perfilActual
            return buscarRivalDuelo(perfilActual)
          })()
        }
        const duelo = await busquedaPromesaRef.current
        const perfilActual = perfilRef.current

        if (!montadoRef.current || canceladoRef.current || emparejadoRef.current) return
        if (!duelo?.id) {
          setEstadoBusqueda('error')
          return
        }
        setBusquedaExpiraEn(duelo.busquedaExpiraEn)
        if (duelo.estado === 'FINALIZADA' && duelo.jugador2Id == null) {
          mostrarBusquedaSinRival()
          return
        }
        if (duelo.jugador2Id != null && ['EN_CURSO', 'FINALIZADA', 'FINALIZADO'].includes(duelo.estado)) {
          continuarConRival(duelo)
          return
        }

        // Consultar el mismo duelo permite detectar un rival o el vencimiento sin abrir otra búsqueda.
        if (!intervaloPollingRef.current && !emparejadoRef.current) {
          let consultando = false
          intervaloPollingRef.current = window.setInterval(() => {
            if (consultando) return
            consultando = true
            void (async () => {
              try {
                const estadoActual = await consultarEstadoDuelo(duelo.id, perfilActual)
                if (!montadoRef.current || canceladoRef.current || emparejadoRef.current || !estadoActual) return
                if (estadoActual.busquedaExpiraEn) setBusquedaExpiraEn(estadoActual.busquedaExpiraEn)
                if (estadoActual.estado === 'FINALIZADA' && estadoActual.jugador2Id == null) {
                  mostrarBusquedaSinRival()
                } else if (estadoActual.jugador2Id != null && ['EN_CURSO', 'FINALIZADA', 'FINALIZADO'].includes(estadoActual.estado)) {
                  continuarConRival(estadoActual)
                }
              } catch {
                // Un fallo temporal de red permite volver a consultar en el siguiente intervalo.
              } finally {
                consultando = false
              }
            })()
          }, 1500)
        }
      } catch {
        if (montadoRef.current && !canceladoRef.current) {
          setEstadoBusqueda('error')
        }
      }
    }

    void iniciarBusqueda()

    return () => {
      montadoRef.current = false
      if (intervaloPollingRef.current) {
        window.clearInterval(intervaloPollingRef.current)
        intervaloPollingRef.current = null
      }
    }
  }, [navegar, intentoConsulta])

  // Espera el ID de la búsqueda inicial y confirma su cancelación en el servidor antes de salir.
  const manejarCancelarBusqueda = async () => {
    if (cancelando) return
    if (estadoBusqueda === 'sin-rival' || estadoBusqueda === 'error') {
      navegarConManejo(navegar, '/jugar')
      return
    }
    canceladoRef.current = true
    setCancelando(true)
    setMensajeError('')
    if (intervaloPollingRef.current) {
      window.clearInterval(intervaloPollingRef.current)
      intervaloPollingRef.current = null
    }
    try {
      const duelo = await busquedaPromesaRef.current
      if (!duelo?.id) throw new Error('No se recibió el identificador de la búsqueda.')
      await cancelarBusquedaDuelo(duelo.id)
      navegarConManejo(navegar, '/jugar')
    } catch (error) {
      if (error.codigo === 'BUSQUEDA_YA_EMPAREJADA' || error.detalle?.code === 'BUSQUEDA_YA_EMPAREJADA') {
        // Un 409 indica que ya hay rival: consultamos el duelo antes de decidir la navegación.
        const duelo = await busquedaPromesaRef.current
        const estadoActual = await consultarEstadoDuelo(duelo.id, perfilRef.current)
        if (estadoActual?.jugador2Id != null) {
          canceladoRef.current = false
          continuarConRival(estadoActual)
          return
        }
        if (estadoActual?.estado === 'FINALIZADA' && estadoActual.jugador2Id == null) {
          mostrarBusquedaSinRival()
          return
        }
      }
      canceladoRef.current = false
      setMensajeError('No se pudo cancelar la búsqueda. Intentá de nuevo.')
      setIntentoConsulta((anterior) => anterior + 1)
    } finally {
      setCancelando(false)
    }
  }

  return (
    <div className="pagina-esperando-rival">
      <aside className="inicio__lateral">
        <Enlace className="marca inicio__marca" to="/home" aria-label="FutbolQuiz Arena">
          FUTBOLQUIZ<span className="marca__arena">ARENA</span>
        </Enlace>

        <NavegacionInicio destinoJugar="/jugar" />

        <div className="inicio__acumulado">
          <p>PUNTAJE ACUMULADO</p>
          <span>{jugadorLocal?.alias ?? 'Jugador'} · {jugadorLocal?.puntuacion ?? 0} pts</span>
        </div>
      </aside>

      <header className="inicio__cabecera pagina-esperando-rival__cabecera">
        <span className="inicio__escudo" aria-label="FutbolQuiz Arena">FQ</span>
        <div className="inicio__saludo-movil">
          <strong>Hola, {jugadorLocal?.nombre ?? jugadorLocal?.alias ?? 'Jugador'}</strong>
          <span>Cuenta de jugador</span>
        </div>
        <Enlace className="inicio__avatar" to="/perfil" aria-label="Ver mi perfil">
          {jugadorLocal?.avatar ?? 'JQ'}
        </Enlace>
        <BotonCerrarSesion />
      </header>

      <main className="pagina-esperando-rival__contenido" aria-live="polite">
        <header className="pagina-esperando-rival__encabezado">
          <div>
            <p className="sobretitulo pagina-esperando-rival__etiqueta">DUELO 1V1</p>
            <h1>{obtenerTituloBusqueda(estadoBusqueda)}</h1>
          </div>
          <button className="pagina-esperando-rival__volver" type="button" onClick={manejarCancelarBusqueda} disabled={cancelando || estadoBusqueda === 'encontrado'}>Volver al menú</button>
        </header>

        <section className="pagina-esperando-rival__panel">
          <div className="pagina-esperando-rival__estado">
            <ComponenteCargandoDuelo />

            <div className="pagina-esperando-rival__texto">
              <p className="pagina-esperando-rival__subtitulo">
                {obtenerSubtituloBusqueda(estadoBusqueda)}
              </p>
              <strong className="pagina-esperando-rival__tiempo">{tiempoEspera == null ? '--:--' : formatearTiempo(tiempoEspera)}</strong>
              {mensajeError && <p role="alert">{mensajeError}</p>}
            </div>
          </div>

          <div className="pagina-esperando-rival__tarjetas">
            {jugadorLocal && (
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
            )}

            <article className="pagina-esperando-rival__jugador pagina-esperando-rival__jugador--rival">
              <div className="pagina-esperando-rival__avatar pagina-esperando-rival__avatar--rival" aria-label={rival ? `Rival ${rival.nombre}` : 'Rival pendiente'}>
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
            <Boton alHacerClic={manejarCancelarBusqueda} cargando={cancelando} textoCargando="Cancelando..." deshabilitado={estadoBusqueda === 'encontrado'}>
              {estadoBusqueda === 'sin-rival' || estadoBusqueda === 'error' ? 'Volver al menú' : 'Cancelar búsqueda'}
            </Boton>
          </div>
        </section>
      </main>
    </div>
  )
}
