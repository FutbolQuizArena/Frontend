import { useEffect, useRef, useState } from 'react'
import { Link as Enlace, useNavigate as usarNavegacion } from 'react-router-dom'
import NavegacionInicio from '../componentes/NavegacionInicio.jsx'
import Boton from '../componentes/Boton.jsx'
import BotonCerrarSesion from '../componentes/BotonCerrarSesion.jsx'
import ComponenteRuleta from '../componentes/ComponenteRuleta.jsx'
import { obtenerCategoriaAleatoria, obtenerCategoriasDisponibles } from '../servicios/servicioPartidas.js'
import '../estilos/estilosRuleta.css'



export default function PaginaRuletaCategoria() {
  const navegar = usarNavegacion()
  const ruletaReferencial = useRef(null)
  const [categoriasDisponibles, setCategoriasDisponibles] = useState([])
  const [categoriaElegida, setCategoriaElegida] = useState(null)
  const [categoriaSiguiente, setCategoriaSiguiente] = useState(null)
  const [giroActivo, setGiroActivo] = useState(false)
  const [mensajeError, setMensajeError] = useState('')

  // Carga las categorías de la API; si falla, muestra el error y deja el giro deshabilitado.
  useEffect(() => {
    let cancelado = false

    obtenerCategoriasDisponibles()
      .then((categorias) => {
        if (!cancelado && Array.isArray(categorias) && categorias.length > 0) {
          setCategoriasDisponibles(categorias)
        }
      })
      .catch((error) => {
        if (!cancelado) {
          setMensajeError(error.message || 'No pudimos cargar las categorías. Recargá la página para reintentar.')
        }
      })

    return () => {
      cancelado = true
    }
  }, [])

  // Elige una categoría de la lista y le indica a la animación dónde debe detenerse.
  const manejarGiro = () => {
    if (categoriasDisponibles.length === 0) return
    const siguienteCategoria = obtenerCategoriaAleatoria(categoriasDisponibles)
    setCategoriaElegida(null)
    setCategoriaSiguiente(siguienteCategoria)
    setGiroActivo(true)

    if (ruletaReferencial.current) {
      ruletaReferencial.current.girarRuleta(siguienteCategoria)
    }
  }

  // Guarda el nombre elegido para mostrarlo al abrir la partida.
  // La categoría definitiva de las preguntas la asigna el backend al crear la partida.
  const manejarFinalGiro = (categoriaSeleccionada) => {
    setCategoriaElegida(categoriaSeleccionada)
    setGiroActivo(false)
    if (categoriaSeleccionada?.nombre) {
      sessionStorage.setItem('categoriaPartidaSeleccionada', categoriaSeleccionada.nombre)
    }
  }

  const manejarContinuar = () => {
    setMensajeError('')
    sessionStorage.setItem('categoriaPartidaSeleccionada', categoriaElegida.nombre)
    void Promise.resolve(navegar('/partida/juegan')).catch(() => {
      setMensajeError('No pudimos abrir la partida. Intentá de nuevo.')
    })
  }

  return (
    <div className="inicio ruleta-categoria__pagina">
      <a className="enlace-salto" href="#contenido-ruleta">Ir al contenido</a>

      <aside className="inicio__lateral">
        <Enlace className="marca inicio__marca" to="/home" aria-label="FutbolQuiz Arena">
          FUTBOLQUIZ<span className="marca__arena">ARENA</span>
        </Enlace>
        <NavegacionInicio destinoJugar="/partida/ruleta" />
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
              categorias={categoriasDisponibles}
              resultadoSeleccionado={categoriaSiguiente}
              alFinalizarGiro={manejarFinalGiro}
              deshabilitado={giroActivo || categoriasDisponibles.length === 0}
            />

            <div className="ruleta-categoria__acciones">
              <Boton alHacerClic={manejarGiro} deshabilitado={giroActivo || categoriasDisponibles.length === 0}>
                Girar Ruleta
              </Boton>
              {mensajeError && <p className="mensaje mensaje--error" role="alert">{mensajeError}</p>}

              {categoriaElegida && (
                <dialog open className="ruleta-categoria__resultado" aria-labelledby="categoria-resultante">
                  <p className="ruleta-categoria__etiqueta">Categoría seleccionada:</p>
                  <h2 id="categoria-resultante">{categoriaElegida.nombre}</h2>
                  <Boton alHacerClic={manejarContinuar}>
                    Continuar a la Partida
                  </Boton>
                </dialog>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
