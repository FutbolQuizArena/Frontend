import { Link as Enlace, NavLink as EnlaceNavegacion } from 'react-router-dom'
import BotonCerrarSesion from '../componentes/BotonCerrarSesion.jsx'
import TarjetaModoJuego from '../componentes/TarjetaModoJuego.jsx'
import '../estilos/estilosHome.css'
import '../estilos/estilosSeleccionModo.css'

const enlaces = [
  { destino: '/home', titulo: 'Inicio', simbolo: '⌂' },
  { destino: '/jugar', titulo: 'Jugar', simbolo: '▶' },
  { destino: '/torneos', titulo: 'Torneos', simbolo: '◆' },
  { destino: '/ranking', titulo: 'Ranking', simbolo: '★' },
  { destino: '/perfil', titulo: 'Perfil', simbolo: '●' },
]

const modosDisponibles = [
  {
    titulo: 'Partida Individual',
    descripcion: 'Jugá una partida rápida con categorías y respuestas de alto nivel.',
    destino: '/partida/ruleta',
    icono: '⚽',
    etiqueta: 'Partida rápida',
  },
  {
    titulo: 'Duelo 1v1',
    descripcion: 'Desafiá a otro jugador y comprobá quién domina el campo.',
    destino: '/duelo/esperando',
    icono: '⚔️',
    etiqueta: 'Competencia',
  },
]

export default function PaginaSeleccionModo() {
  return (
    <div className="seleccion-modo">
      <a className="enlace-salto" href="#contenido-seleccion-modo">Ir al contenido</a>

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

      <header className="inicio__cabecera seleccion-modo__cabecera">
        <span className="inicio__escudo" aria-label="FutbolQuiz Arena">FQ</span>
        <div className="inicio__saludo-movil">
          <strong>Hola, Lucas</strong>
          <span>Cuenta de jugador</span>
        </div>
        <Enlace className="inicio__avatar" to="/perfil" aria-label="Ver mi perfil">LM</Enlace>
        <BotonCerrarSesion />
      </header>

      <main className="seleccion-modo__contenido" id="contenido-seleccion-modo">
        <header className="seleccion-modo__encabezado">
          <div>
            <p className="sobretitulo seleccion-modo__etiqueta">MODO DE JUEGO</p>
            <h1>Selecciona un Modo de Juego</h1>
          </div>
          <Enlace className="seleccion-modo__volver" to="/home">Volver al inicio</Enlace>
        </header>

        <section className="seleccion-modo__grid" aria-label="Modos de juego disponibles">
          {modosDisponibles.map(({ titulo, descripcion, destino, icono, etiqueta }) => (
            <TarjetaModoJuego
              key={titulo}
              titulo={titulo}
              descripcion={descripcion}
              destino={destino}
              icono={icono}
              etiqueta={etiqueta}
            />
          ))}
        </section>
      </main>
    </div>
  )
}
