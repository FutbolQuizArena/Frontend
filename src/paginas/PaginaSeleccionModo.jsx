import { useEffect, useState } from 'react'
import { Link as Enlace, NavLink as EnlaceNavegacion } from 'react-router-dom'
import BotonCerrarSesion from '../componentes/BotonCerrarSesion.jsx'
import TarjetaModoJuego from '../componentes/TarjetaModoJuego.jsx'
import { modosJuegoBase, obtenerModosJuego } from '../servicios/servicioModosJuego.js'
import '../estilos/estilosHome.css'
import '../estilos/estilosSeleccionModo.css'

const enlaces = [
  { destino: '/home', titulo: 'Inicio', simbolo: '⌂' },
  { destino: '/jugar', titulo: 'Jugar', simbolo: '▶' },
  { destino: '/torneos', titulo: 'Torneos', simbolo: '◆' },
  { destino: '/ranking', titulo: 'Ranking', simbolo: '★' },
  { destino: '/perfil', titulo: 'Perfil', simbolo: '●' },
]

export default function PaginaSeleccionModo() {
  const [modosDisponibles, setModosDisponibles] = useState(modosJuegoBase)
  const [cargandoModos, setCargandoModos] = useState(true)

  useEffect(() => {
    let activo = true

    async function cargarModos() {
      try {
        const modos = await obtenerModosJuego()
        if (activo) {
          setModosDisponibles(modos)
        }
      } catch {
        if (activo) {
          setModosDisponibles(modosJuegoBase)
        }
      } finally {
        if (activo) {
          setCargandoModos(false)
        }
      }
    }

    cargarModos()

    return () => {
      activo = false
    }
  }, [])

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

        {cargandoModos && (
          <p className="seleccion-modo__estado" aria-live="polite">Cargando modos de juego…</p>
        )}

        <section className="seleccion-modo__grid" aria-label="Modos de juego disponibles">
          {modosDisponibles.map(({ id, titulo, descripcion, destino, icono, etiqueta }) => (
            <TarjetaModoJuego
              key={id ?? titulo}
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
