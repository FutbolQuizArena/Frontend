import { useEffect, useRef, useState } from 'react'
import { Link as Enlace, useNavigate as usarNavegacion } from 'react-router-dom'
import NavegacionInicio from '../componentes/NavegacionInicio.jsx'
import Boton from '../componentes/Boton.jsx'
import BotonCerrarSesion from '../componentes/BotonCerrarSesion.jsx'
import ComponenteRuleta from '../componentes/ComponenteRuleta.jsx'
import usarPerfilActual from '../ganchos/usarPerfilActual.js'
import { obtenerCategoriaAleatoria, obtenerCategoriasDisponibles } from '../servicios/servicioPartidas.js'
import '../estilos/estilosRuleta.css'



/** Obtiene categorías jugables y controla el giro que inicia una partida. */
export default function PaginaRuletaCategoria() {
  const perfil = usarPerfilActual()
  const esAdministrador = perfil?.rol === 'ADMINISTRADOR'
  const navegar = usarNavegacion()
  const ruletaReferencial = useRef(null)
  const [categoriasDisponibles, setCategoriasDisponibles] = useState([])
  const [categoriaElegida, setCategoriaElegida] = useState(null)
  const [categoriaSiguiente, setCategoriaSiguiente] = useState(null)
  const [giroActivo, setGiroActivo] = useState(false)
  const [mensajeError, setMensajeError] = useState('')
  const [cargando, setCargando] = useState(true)
  const [intentoCarga, setIntentoCarga] = useState(0)

  // Carga las categorías de la API; si falla, muestra el error y deja el giro deshabilitado.
  useEffect(() => {
    let cancelado = false
    setCargando(true)
    setMensajeError('')
    setCategoriasDisponibles([])
    sessionStorage.removeItem('categoriaPartidaSeleccionadaId')

    obtenerCategoriasDisponibles()
      .then((categorias) => {
        if (!cancelado && Array.isArray(categorias)) {
          setCategoriasDisponibles(categorias)
        }
      })
      .catch(() => {
        if (!cancelado) {
          setMensajeError('No pudimos cargar las categorías. Volvé a intentarlo en unos instantes.')
        }
      })
      .finally(() => { if (!cancelado) setCargando(false) })

    return () => {
      cancelado = true
    }
  }, [intentoCarga])

  // Elige una categoría de la lista y le indica a la animación dónde debe detenerse.
  // Inicia el giro cuando ya hay categorías disponibles.
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

  // Conserva el ID elegido; el servidor verifica que siga siendo jugable al iniciar.
  const manejarFinalGiro = (categoriaSeleccionada) => {
    setCategoriaElegida(categoriaSeleccionada)
    setGiroActivo(false)
    if (categoriaSeleccionada?.nombre) {
      sessionStorage.setItem('categoriaPartidaSeleccionada', categoriaSeleccionada.nombre)
      sessionStorage.setItem('categoriaPartidaSeleccionadaId', String(categoriaSeleccionada.id))
    }
  }

  // Conserva la selección para mostrarla en la partida siguiente.
  const manejarContinuar = () => {
    if (!categoriaElegida || categoriasDisponibles.length === 0) return
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
          <span>{esAdministrador ? 'Administrador' : 'Jugador'} · {perfil?.puntajeTotal == null ? '—' : perfil.puntajeTotal.toLocaleString('es-AR')} pts</span>
        </div>
      </aside>

      <header className="inicio__cabecera">
        <span className="inicio__escudo" aria-label="FutbolQuiz Arena">FQ</span>
        <div className="inicio__saludo-movil"><strong>Hola, {perfil?.nombre || 'Jugador'}</strong><span>Cuenta de {esAdministrador ? 'administrador' : 'jugador'}</span></div>
        <Enlace className="inicio__avatar" to="/perfil" aria-label="Ver mi perfil">{perfil?.iniciales || 'FQ'}</Enlace>
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
            {categoriasDisponibles.length > 0 && <ComponenteRuleta
              ref={ruletaReferencial}
              categorias={categoriasDisponibles}
              resultadoSeleccionado={categoriaSiguiente}
              alFinalizarGiro={manejarFinalGiro}
              deshabilitado={giroActivo || categoriasDisponibles.length === 0}
            />}

            <div className="ruleta-categoria__acciones">
              <Boton alHacerClic={manejarGiro} deshabilitado={giroActivo || categoriasDisponibles.length === 0}>
                Girar Ruleta
              </Boton>
              {mensajeError && <p className="mensaje mensaje--error" role="alert">{mensajeError}</p>}
              {cargando && <p role="status">Cargando categorías…</p>}
              {!cargando && !mensajeError && categoriasDisponibles.length === 0 && <p role="status">Todavía no hay categorías listas para jugar. Volvé a intentarlo más tarde.</p>}
              {!cargando && categoriasDisponibles.length === 0 && <Boton alHacerClic={() => setIntentoCarga((n) => n + 1)}>Volver a consultar</Boton>}

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
