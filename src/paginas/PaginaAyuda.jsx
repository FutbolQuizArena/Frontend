import { Link as Enlace } from 'react-router-dom'
import { usarSesion } from '../contextos/ContextoSesion.jsx'
import pelota from '../recursos/pelota.png'
import secciones from '../datos/preguntasAyuda.json'
import '../estilos/estilosAyuda.css'

/** Presenta las preguntas frecuentes y permite desplegar cada respuesta de la guía. */
export default function PaginaAyuda() {
  const { autenticado } = usarSesion()

  return (
    <div className="ayuda">
      <a className="enlace-salto" href="#contenido-ayuda">Ir al contenido</a>
      <header className="ayuda__cabecera">
        <Enlace className="marca ayuda__marca" to={autenticado ? '/home' : '/login'} aria-label="FutbolQuiz Arena, ir al inicio">
          FUTBOLQUIZ<span className="marca__arena">ARENA</span>
        </Enlace>
        <Enlace className="ayuda__volver" to={autenticado ? '/home' : '/login'}>
          {autenticado ? 'Volver al inicio' : 'Iniciar sesión'}
        </Enlace>
      </header>

      <main className="ayuda__contenido" id="contenido-ayuda">
        <section className="ayuda__portada" aria-labelledby="titulo-ayuda">
          <div className="ayuda__portada-texto">
            <p className="ayuda__etiqueta"><span aria-hidden="true">●</span> CENTRO DE AYUDA</p>
            <h1 id="titulo-ayuda">Todo para jugar <span>sin quedarte en el banco.</span></h1>
            <p>Encontrá respuestas rápidas sobre tu cuenta, las partidas, los duelos y los torneos.</p>
            <div className="ayuda__acciones">
              <a className="ayuda__accion-principal" href="#preguntas">Ver preguntas frecuentes <span aria-hidden="true">→</span></a>
            </div>
          </div>
          <div className="ayuda__visual" aria-hidden="true">
            <div className="ayuda__cancha"><span className="ayuda__cancha-centro" /><img className="ayuda__pelota" src={pelota} alt="" /></div>
            <div className="ayuda__tarjeta-visual"><span>GUÍA RÁPIDA</span><strong>Tu próxima jugada empieza acá.</strong><small>Preguntas concretas. Respuestas al instante.</small></div>
          </div>
        </section>

        <section className="ayuda__listado" id="preguntas" aria-labelledby="titulo-preguntas">
          <header className="ayuda__encabezado-listado">
            <p className="ayuda__etiqueta">RESPUESTAS PARA CADA JUGADA</p>
            <h2 id="titulo-preguntas">Preguntas frecuentes</h2>
          </header>
          {secciones.map(({ id, titulo, preguntas }, indice) => (
            <section className="ayuda__seccion" id={id} key={id} aria-labelledby={`titulo-${id}`}>
              <header className="ayuda__encabezado-seccion">
                <span className="ayuda__numero-seccion">{String(indice + 1).padStart(2, '0')}</span>
                <div><h2 id={`titulo-${id}`}>{titulo}</h2><p>{preguntas.length} {preguntas.length === 1 ? 'pregunta frecuente' : 'preguntas frecuentes'}</p></div>
              </header>
              <div className="ayuda__preguntas">
                {preguntas.map(({ pregunta, respuesta }) => (
                  <details className="ayuda__pregunta" key={pregunta}>
                    <summary>{pregunta}</summary>
                    <ul className="ayuda__vinetas">
                      {respuesta.map((punto) => <li key={punto}>{punto}</li>)}
                    </ul>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </section>
      </main>
    </div>
  )
}
