import { Link as Enlace } from 'react-router-dom'
import circuloCancha from '../recursos/circuloCancha.svg'
import pelota from '../recursos/pelota.png'

export default function MarcoAutenticacion({ variante = 'inicio-sesion', titulo, tituloMovil, descripcion, descripcionMovil, children: contenido }) {
  const esRegistro = variante === 'registro'

  return (
    <div className={`autenticacion autenticacion--${variante}`}>
      <a className="enlace-salto" href="#contenido">Ir al formulario</a>
      <header className="cabecera">
        <span className="marca" aria-label="FutbolQuiz Arena">
          FUTBOLQUIZ
          <span className="marca__arena">ARENA</span>
        </span>
        <nav className="navegacion" aria-label="Acceso a la cuenta">
          <span>{esRegistro ? '¿Ya tenés una cuenta?' : '¿Todavía no tenés cuenta?'}</span>
          <Enlace to={esRegistro ? '/login' : '/registro'} className="navegacion__enlace">
            {esRegistro ? 'Ingresar' : 'Registrarme'}
          </Enlace>
        </nav>
      </header>

      <header className="cabecera-movil">
        {esRegistro && <Enlace className="volver" to="/login" aria-label="Volver a iniciar sesión">‹</Enlace>}
        <span className="escudo-movil" aria-label="FutbolQuiz Arena">FQ</span>
        {!esRegistro && <>
          <p className="marca-movil">FUTBOLQUIZ</p>
          <h2>Entrá a la cancha</h2>
          <p className="cabecera-movil__descripcion">Desafiá tus conocimientos y competí con amigos.</p>
        </>}
      </header>

      <main className="autenticacion__contenido" id="contenido">
        <section className="presentacion" aria-labelledby="titulo-presentacion">
          <p className="sobretitulo">{esRegistro ? 'EMPEZÁ TU TEMPORADA' : 'TRIVIA COMPETITIVA DE FÚTBOL'}</p>
          <h2 id="titulo-presentacion">{esRegistro ? <>
            Creá tu jugador.<br />El resto se gana jugando.
          </> : <>
            Demostrá cuánto sabés.<br />Ganate tu lugar en la cancha.
          </>}</h2>
          <p className="presentacion__descripcion">
            {esRegistro ? 'Registrarte lleva menos de un minuto.' : <>
              Partidas rápidas, duelos asincrónicos y torneos<br className="salto-escritorio" /> de eliminación directa en un solo lugar.
            </>}
          </p>
          <div className="cancha" aria-hidden="true">
            <div className="cancha__limites" />
            <div className="cancha__linea" />
            <img className="cancha__circulo" src={circuloCancha} width="108" height="108" alt="" />
            <img className="cancha__pelota" src={pelota} width="84" height="84" alt="" />
          </div>
          {esRegistro ? <ul className="ventajas">
            <li><span aria-hidden="true">✓</span>Sumá puntos en partidas individuales</li>
            <li><span aria-hidden="true">✓</span>Desafiá a otros jugadores</li>
            <li><span aria-hidden="true">✓</span>Creá y participá en torneos</li>
          </ul> : <>
            <dl className="estadisticas">
              <div><dt>preguntas</dt><dd>10</dd></div>
              <div><dt>por respuesta</dt><dd>15 s</dd></div>
              <div><dt>objetivo</dt><dd>#1</dd></div>
            </dl>
            <p className="presentacion__lema">Tu conocimiento. Tu ranking. Tu arena.</p>
          </>}
        </section>

        <div className="panel-formulario">
          <section className="tarjeta" aria-labelledby="titulo-formulario">
            <h1 id="titulo-formulario"><span className="texto-escritorio">{titulo}</span><span className="texto-movil">{tituloMovil}</span></h1>
            <p className="tarjeta__descripcion"><span className="texto-escritorio">{descripcion}</span><span className="texto-movil">{descripcionMovil}</span></p>
            {contenido}
            {esRegistro ? <p className="nota-condiciones">Al crear la cuenta aceptás las condiciones de uso<br /> del proyecto académico.</p> : <div className="nota-seguridad">
              <span className="nota-seguridad__icono" aria-hidden="true">✓</span>
              <div><strong>Acceso seguro</strong><p>Tus credenciales se protegen de forma segura.</p></div>
            </div>}
          </section>
          <p className="alternativa-movil">
            {esRegistro ? '¿Ya tenés cuenta?' : '¿No tenés cuenta?'}{' '}
            <Enlace to={esRegistro ? '/login' : '/registro'}>{esRegistro ? 'Iniciar sesión' : 'Crear cuenta'}</Enlace>
          </p>
          {esRegistro ? <p className="sello-movil">✓&nbsp; Registro seguro</p> : <footer className="pie-pagina">© 2026 FutbolQuiz Arena · Proyecto académico</footer>}
        </div>
      </main>
    </div>
  )
}
