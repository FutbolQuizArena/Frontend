import { Link as Enlace } from 'react-router-dom'
import { usarSesion } from '../contextos/ContextoSesion.jsx'
import pelota from '../recursos/pelota.png'
import '../estilos/estilosAyuda.css'

const secciones = [
  {
    id: 'cuenta',
    titulo: 'Crear y usar mi cuenta',
    preguntas: [
      {
        pregunta: '¿Cómo creo una cuenta?',
        respuesta: [
          'En la pantalla de ingreso, elegí Registrarme.',
          'Completá tu nombre de usuario, correo y contraseña. Repetí la contraseña para confirmarla.',
          'Pulsá Crear mi cuenta. Cuando se confirme el registro, iniciá sesión.',
        ],
      },
      {
        pregunta: '¿Cómo inicio sesión?',
        respuesta: [
          'Ingresá el correo y la contraseña con los que te registraste.',
          'Pulsá Ingresar. Si querés conservar el acceso en este dispositivo, marcá Mantener sesión iniciada.',
        ],
      },
      {
        pregunta: '¿Cómo cierro sesión?',
        respuesta: [
          'Pulsá Cerrar sesión en la parte superior de la app.',
          'Para volver a entrar, iniciá sesión con tu correo y contraseña.',
        ],
      },
      {
        pregunta: '¿Cómo actualizo mi nombre, correo o contraseña?',
        respuesta: [
          'Entrá en Perfil y cambiá tu nombre o correo.',
          'Para cambiar la contraseña, completá Contraseña actual y Nueva contraseña.',
          'Pulsá Guardar cambios.',
        ],
      },
    ],
  },
  {
    id: 'partidas',
    titulo: 'Jugar partidas',
    preguntas: [
      {
        pregunta: '¿Cómo juego una partida individual?',
        respuesta: [
          'Desde Inicio pulsá Empezar partida, o entrá en Jugar y elegí Partida Individual.',
          'Girá la ruleta para obtener una categoría y respondé las preguntas antes de que termine el tiempo.',
          'Al finalizar, consultá tu resultado.',
        ],
      },
      {
        pregunta: '¿Cómo juego un duelo con otra persona?',
        respuesta: [
          'Entrá en Jugar y elegí Duelo 1v1.',
          'Esperá a que la app encuentre un rival y respondé las preguntas.',
          'Al terminar, consultá el resultado del duelo.',
        ],
      },
      {
        pregunta: '¿Cómo funciona el juego local?',
        respuesta: [
          'En Jugar elegí Juego local e indicá los nombres de los dos jugadores.',
          'Compartan el mismo dispositivo y respondan cuando la pantalla indique el turno de cada uno.',
          'Al finalizar, consulten el resultado.',
        ],
      },
    ],
  },
  {
    id: 'torneos',
    titulo: 'Participar en torneos',
    preguntas: [
      {
        pregunta: '¿Cómo creo un torneo?',
        respuesta: [
          'Abrí Torneos y pulsá Crear torneo.',
          'Indicá el nombre, la cantidad de participantes y, si querés, una contraseña de acceso.',
          'Creá el torneo y compartí el código que se genera.',
        ],
      },
      {
        pregunta: '¿Cómo me uno a un torneo?',
        respuesta: [
          'En Torneos, buscá uno en Disponibles o elegí Ingresar código.',
          'Escribí el código del torneo y la contraseña si corresponde.',
          'Pulsá Unirme al torneo.',
        ],
      },
      {
        pregunta: '¿Dónde veo mis torneos y resultados?',
        respuesta: [
          'Abrí Torneos y usá las pestañas Mis torneos y Finalizados.',
          'Entrá en un torneo para ver su sala, el cuadro y los resultados disponibles.',
        ],
      },
      {
        pregunta: '¿Por qué no encuentro un torneo?',
        respuesta: [
          'Revisá el nombre o código que escribiste y quitá los filtros de Disponibles.',
          'Si te compartieron un código de invitación, usá Ingresar código.',
        ],
      },
    ],
  },
  {
    id: 'administracion',
    titulo: 'Administración',
    preguntas: [
      {
        pregunta: '¿Quién puede entrar al panel de administración?',
        respuesta: [
          'El panel está disponible para las cuentas con rol de administrador.',
          'Desde allí se gestionan preguntas, categorías y usuarios.',
        ],
      },
    ],
  },
  {
    id: 'disponibilidad',
    titulo: 'Funciones disponibles',
    preguntas: [
      {
        pregunta: '¿Por qué no veo el ranking?',
        respuesta: [
          'El ranking figura como próximamente en esta versión de la app.',
          'Mientras tanto, podés consultar tu puntaje acumulado en Inicio y Perfil.',
        ],
      },
      {
        pregunta: '¿Qué hago si una pantalla no carga los datos?',
        respuesta: [
          'Comprobá tu conexión a Internet y volvé a intentar la acción.',
          'Si aparece el botón Reintentar, pulsalo.',
          'Si tu sesión venció, iniciá sesión nuevamente.',
        ],
      },
    ],
  },
]

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
            <p>Encontrá respuestas rápidas sobre tu cuenta, las partidas y los torneos.</p>
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
