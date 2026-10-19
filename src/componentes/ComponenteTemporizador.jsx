export default function ComponenteTemporizador({ tiempoRestante = 0, tiempoTotal = 15, enCurso = true }) {
  const progreso = Math.max(0, Math.min(100, (tiempoRestante / tiempoTotal) * 100))
  const color = tiempoRestante <= 5 ? '#e45454' : '#35c466'

  return (
    <div className={`temporizador ${enCurso ? '' : 'temporizador--pausado'}`}>
      <div
        className="temporizador__circulo"
        style={{
          background: `conic-gradient(${color} ${progreso}%, rgba(255, 255, 255, 0.08) 0)`,
        }}
      >
        <span>{tiempoRestante}s</span>
      </div>
    </div>
  )
}
