import { useEffect as usarEfecto, useState as usarEstado } from 'react'
import { Link as Enlace, NavLink as EnlaceNavegacion, useNavigate as usarNavegacion } from 'react-router-dom'
import Boton from '../componentes/Boton.jsx'
import BotonCerrarSesion from '../componentes/BotonCerrarSesion.jsx'
import TarjetaModo from '../componentes/TarjetaModo.jsx'
import { obtenerPerfil } from '../servicios/servicioPerfil.js'
import fondoPelota from '../recursos/fondoPelotaHome.svg'
import '../estilos/estilosHome.css'

// TODO: reemplazar las estadísticas que GET /api/usuarios/me aún no publica.
const usuarioInicial = { nombre: 'Jugador', iniciales: 'FQ', rol: 'JUGADOR', puntajeTotal: 0, posicion: '—', partidas: '—', victorias: '—', torneos: '—' }
const rankingTemporal = [
  { nombre: 'Mati10', posicion: 1, puntajeTotal: 8920 },
  { nombre: 'SofiGol', posicion: 2, puntajeTotal: 8460 },
  { nombre: 'Fede_9', posicion: 3, puntajeTotal: 7980 },
]
const enlaces = [
  { destino: '/home', titulo: 'Inicio', simbolo: '⌂' },
  { destino: '/partida-individual', titulo: 'Jugar', simbolo: '▶' },
  { destino: '/torneos', titulo: 'Torneos', simbolo: '◆' },
  { destino: '/ranking', titulo: 'Ranking', simbolo: '★' },
  { destino: '/perfil', titulo: 'Perfil', simbolo: '●' },
]
const formatearPuntaje = (puntaje) => puntaje.toLocaleString('es-AR')

export default function PaginaHome() {
  const navegar = usarNavegacion()
  const [usuario, establecerUsuario] = usarEstado(usuarioInicial)
  const [mensajeError, establecerMensajeError] = usarEstado('')

  usarEfecto(() => {
    let vigente = true
    obtenerPerfil().then((perfil) => {
      if (vigente) establecerUsuario((anterior) => ({ ...anterior, ...perfil }))
    }).catch((error) => {
      if (vigente) establecerMensajeError(error.message || 'No pudimos cargar tus datos.')
    })
    return () => { vigente = false }
  }, [])
  const esAdministrador = usuario.rol === 'ADMINISTRADOR'

  return (
    <div className="inicio">
      <a className="enlace-salto" href="#contenido-inicio">Ir al contenido</a>
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
        <div className="inicio__acumulado"><p>PUNTAJE ACUMULADO</p><span>{esAdministrador ? 'Administrador' : 'Jugador'} · {formatearPuntaje(usuario.puntajeTotal)} pts</span></div>
      </aside>
      <header className="inicio__cabecera">
        <span className="inicio__escudo" aria-label="FutbolQuiz Arena">FQ</span>
        <div className="inicio__saludo-movil"><strong>Hola, {usuario.nombre}</strong><span>Cuenta de {esAdministrador ? 'administrador' : 'jugador'}</span></div>
        <Enlace className="inicio__avatar" to="/perfil" aria-label="Ver mi perfil">{usuario.iniciales}</Enlace>
        <BotonCerrarSesion />
      </header>
      <main className="inicio__contenido" id="contenido-inicio">
        {mensajeError && <p className="mensaje mensaje--error" role="alert">{mensajeError}</p>}
        <div className="inicio__bienvenida">
          <p className="inicio__solo-movil sobretitulo">HOY ES DÍA DE PARTIDO</p>
          <h1><span className="inicio__solo-escritorio">Buenas, {usuario.nombre} 👋</span><span className="inicio__solo-movil">¿Listo para jugar?</span></h1>
          <p className="inicio__solo-escritorio">Seguí sumando puntos y escalá posiciones.</p>
        </div>
        <section className="inicio__rendimiento" aria-label="Tu rendimiento">
          <h2 className="inicio__solo-movil">TU RENDIMIENTO</h2>
          <dl className="inicio__metricas">
            <div><dt>PUNTOS</dt><dd>{formatearPuntaje(usuario.puntajeTotal)}</dd></div>
            <div><dt><span className="inicio__solo-escritorio">RANKING</span><span className="inicio__solo-movil">VICTORIAS</span></dt><dd><span className="inicio__solo-escritorio">#{usuario.posicion}</span><span className="inicio__solo-movil">{usuario.victorias}</span></dd></div>
            <div><dt><span className="inicio__solo-escritorio">PARTIDAS</span><span className="inicio__solo-movil">TORNEOS</span></dt><dd><span className="inicio__solo-escritorio">{usuario.partidas}</span><span className="inicio__solo-movil">{usuario.torneos}</span></dd></div>
          </dl>
        </section>
        <section className="inicio__desafio" aria-labelledby="titulo-desafio">
          <p className="inicio__etiqueta"><span className="inicio__solo-escritorio">DESAFÍO RÁPIDO</span><span className="inicio__solo-movil">PARTIDA RÁPIDA</span></p>
          <h2 id="titulo-desafio"><span className="inicio__solo-escritorio">¿Cuánto sabés<br />de fútbol?</span><span className="inicio__solo-movil">Demostrá lo que sabés</span></h2>
          <p className="inicio__descripcion"><span className="inicio__solo-escritorio">10 preguntas · 15 segundos cada una</span><span className="inicio__solo-movil">Girás la ruleta, respondés y<br />sumás puntos al instante.</span></p>
          <Boton alHacerClic={() => navegar('/partida-individual')}><span className="inicio__solo-escritorio">Empezar partida</span><span className="inicio__solo-movil">Jugar ahora →</span></Boton>
          <div className="inicio__pelota" aria-hidden="true"><img className="inicio__fondo-pelota" src={fondoPelota} alt="" /><span className="inicio__imagen-pelota">⚽</span></div>
        </section>
        <section className="inicio__ranking" aria-labelledby="titulo-ranking">
          <h2 id="titulo-ranking">Ranking general</h2>
          <ol>
            {[...rankingTemporal, usuario].map((jugador, indice) => (
              <li key={indice} className={indice === 3 ? 'inicio__jugador-actual' : ''} value={typeof jugador.posicion === 'number' ? jugador.posicion : undefined}>
                <span>{jugador.posicion}</span><span className="inicio__avatar-ranking" aria-hidden="true" /><strong>{jugador.nombre}</strong><span>{formatearPuntaje(jugador.puntajeTotal)}</span>
              </li>
            ))}
          </ol>
          <Enlace to="/ranking">Ver ranking completo</Enlace>
        </section>
        <section className="inicio__torneo" aria-labelledby="titulo-torneos">
          <h2 id="titulo-torneos"><span className="inicio__solo-escritorio">Próximos torneos</span><span className="inicio__solo-movil">TORNEO DESTACADO</span></h2>
          <div className="inicio__tarjeta-torneo">
            <div>
              <p className="inicio__etiqueta-torneo"><span className="inicio__solo-escritorio">COPA LEYENDAS</span><span className="inicio__solo-movil">DISPONIBLE</span></p>
              <h3><span className="inicio__solo-escritorio">Sábado · 21:00</span><span className="inicio__solo-movil">Copa Libertadores</span></h3>
              <p><span className="inicio__solo-escritorio">16 jugadores · Eliminación directa</span><span className="inicio__solo-movil">Octavos · 12/16 jugadores</span></p>
            </div>
            <progress className="inicio__solo-movil" value="12" max="16" aria-label="Cupos ocupados en el torneo">12 de 16</progress>
            <Enlace to="/torneos">Ver torneo</Enlace>
          </div>
        </section>
        <p className="inicio__nota inicio__solo-movil">10 preguntas por partida · 4 opciones</p>
        <div className="inicio__otros-modos">
          <TarjetaModo titulo="Duelo" descripcion="Desafiá a otro jugador y poné a prueba tus conocimientos." destino="/duelo" textoEnlace="Ir a Duelo" />
          {esAdministrador && <TarjetaModo titulo="Administración" descripcion="Accedé al panel de administración." destino="/admin" textoEnlace="Ir al panel de Admin" />}
        </div>
      </main>
    </div>
  )
}
