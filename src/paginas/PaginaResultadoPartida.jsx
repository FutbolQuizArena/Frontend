import { Link as Enlace } from 'react-router-dom'

export default function PaginaResultadoPartida() {
  const resultadoGuardado = sessionStorage.getItem('resultadoPartidaIndividual')
  const resultado = resultadoGuardado ? JSON.parse(resultadoGuardado) : null

  return (
    <main className="resultado-partida">
      <section className="resultado-partida__tarjeta">
        <p className="sobretitulo">PARTIDA FINALIZADA</p>
        <h1>Resultado de la partida</h1>
        <p className="resultado-partida__puntaje">{resultado?.puntaje ?? 0} puntos</p>
        <p className="resultado-partida__texto">Gracias por jugar. La siguiente ronda te espera en la cancha.</p>
        <Enlace className="boton resultado-partida__boton" to="/home">Volver al inicio</Enlace>
      </section>
    </main>
  )
}
