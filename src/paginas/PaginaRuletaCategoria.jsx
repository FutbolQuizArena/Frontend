import { useRef, useState } from 'react'
import { Link as Enlace, NavLink as EnlaceNavegacion, useNavigate as usarNavegacion } from 'react-router-dom'
import Boton from '../componentes/Boton.jsx'
import BotonCerrarSesion from '../componentes/BotonCerrarSesion.jsx'
import ComponenteRuleta from '../componentes/ComponenteRuleta.jsx'
import { obtenerCategoriaAleatoria } from '../servicios/servicioPartidas.js'
import '../estilos/estilosRuleta.css'

const enlaces = [
  { destino: '/home', titulo: 'Inicio', simbolo: '⌂' },
  { destino: '/partida/ruleta', titulo: 'Jugar', simbolo: '▶' },
  { destino: '/torneos', titulo: 'Torneos', simbolo: '◆' },
  { destino: '/ranking', titulo: 'Ranking', simbolo: '★' },
  { destino: '/perfil', titulo: 'Perfil', simbolo: '●' },
]

const categoriasBase = [
  { nombre: 'Historia' },
  { nombre: 'Mundiales' },
  { nombre: 'Clubes' },
  { nombre: 'Jugadores' },
  { nombre: 'Reglas' },
  { nombre: 'Tácticas' },
]

export default function PaginaRuletaCategoria() {
  const navegar = usarNavegacion()
  const ruletaReferencial = useRef(null)
  const [categoriaElegida, setCategoriaElegida] = useState(null)
  const [categoriaSiguiente, setCategoriaSiguiente] = useState(null)
  const [giroActivo, setGiroActivo] = useState(false)

  const manejarGiro = () => {
    const siguienteCategoria = obtenerCategoriaAleatoria(categoriasBase)
    setCategoriaElegida(null)
    setCategoriaSiguiente(siguienteCategoria)
    setGiroActivo(true)

    if (ruletaReferencial.current) {
      ruletaReferencial.current.girarRuleta(siguienteCategoria)
    }
  }

  const manejarFinalGiro = (categoriaSeleccionada) => {
    setCategoriaElegida(categoriaSeleccionada)
    setGiroActivo(false)
    if (categoriaSeleccionada?.nombre) {
      sessionStorage.setItem('categoriaPartidaSeleccionada', categoriaSeleccionada.nombre)
    }
  }

  return (
    <div className="inicio ruleta-categoria__pagina">
      <a className="enlace-salto" href="#contenido-ruleta">Ir al contenido</a>

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

      <header className="inicio__cabecera">
        <span className="inicio__escudo" aria-label="FutbolQuiz Arena">FQ</span>
        <div className="inicio__saludo-movil"><strong>Hola, Lucas</strong><span>Cuenta de jugador</span></div>
        <Enlace className="inicio__avatar" to="/perfil" aria-label="Ver mi perfil">LM</Enlace>
        <BotonCerrarSesion />
      </header>

      <main className="inicio__contenido ruleta-categoria__contenido-principal" id="contenido-ruleta">
        <section className="ruleta-categoria__panel" aria-labelledby="titulo-ruleta">
          <header className="ruleta-categoria__encabezado">
            <p className="sobretitulo">MÓDULO 2</p>
            <h1 id="titulo-ruleta">Ruleta de categorías</h1>
            <p className="ruleta-categoria__descripcion">Prepará la partida en un solo giro. La categoría elegida define el tipo de preguntas del desafío.</p>
          </header>

          <div className="ruleta-categoria__contenido">
            <ComponenteRuleta
              ref={ruletaReferencial}
              categorias={categoriasBase}
              resultadoSeleccionado={categoriaSiguiente}
              alFinalizarGiro={manejarFinalGiro}
              deshabilitado={giroActivo}
            />

            <div className="ruleta-categoria__acciones">
              <Boton alHacerClic={manejarGiro} deshabilitado={giroActivo}>
                Girar Ruleta
              </Boton>

              {categoriaElegida && (
                <div className="ruleta-categoria__resultado" role="dialog" aria-modal="true" aria-labelledby="categoria-resultante">
                  <p className="ruleta-categoria__etiqueta">Categoría seleccionada:</p>
                  <h2 id="categoria-resultante">{categoriaElegida.nombre}</h2>
                  <Boton alHacerClic={() => {
                    sessionStorage.setItem('categoriaPartidaSeleccionada', categoriaElegida.nombre)
                    navegar('/partida/juegan')
                  }}>
                    Continuar a la Partida
                  </Boton>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
