export default function TarjetaPregunta({
  pregunta,
  indicePregunta,
  totalPreguntas,
  respuestaSeleccionada,
  respuestaCorrecta,
  mostrarFeedback,
  bloqueado,
  onSeleccionar,
}) {
  if (!pregunta) {
    return null
  }

  return (
    <article className="tarjeta-pregunta">
      <div className="tarjeta-pregunta__encabezado">
        <span className="tarjeta-pregunta__categoria">{pregunta.categoria}</span>
        <span className="tarjeta-pregunta__estado">Pregunta {indicePregunta + 1} de {totalPreguntas}</span>
      </div>

      <h2>{pregunta.enunciado}</h2>

      <div className="tarjeta-pregunta__opciones" role="list">
        {pregunta.opciones.map((opcion) => {
          const tieneRespuestaCorrecta = Boolean(pregunta.opcionCorrectaId)
          const esSeleccionada = opcion.id === respuestaSeleccionada
          const esCorrecta = tieneRespuestaCorrecta ? opcion.id === pregunta.opcionCorrectaId : Boolean(respuestaCorrecta) && esSeleccionada
          const esCorrectaMostrada = mostrarFeedback && esCorrecta
          const esIncorrectaMostrada = mostrarFeedback && esSeleccionada && (!tieneRespuestaCorrecta ? !respuestaCorrecta : !esCorrecta)

          const claseBoton = [
            'tarjeta-pregunta__opcion',
            esCorrectaMostrada ? 'tarjeta-pregunta__opcion--correcta' : '',
            esIncorrectaMostrada ? 'tarjeta-pregunta__opcion--incorrecta' : '',
            esSeleccionada && !mostrarFeedback ? 'tarjeta-pregunta__opcion--seleccionada' : '',
          ].filter(Boolean).join(' ')

          return (
            <button
              key={opcion.id}
              type="button"
              className={claseBoton}
              onClick={() => onSeleccionar(opcion.id)}
              disabled={bloqueado}
              data-testid="opcion-pregunta"
            >
              <span>{opcion.texto}</span>
            </button>
          )
        })}
      </div>

      {mostrarFeedback && (
        <p className={`tarjeta-pregunta__feedback ${respuestaCorrecta ? 'tarjeta-pregunta__feedback--correcto' : 'tarjeta-pregunta__feedback--incorrecto'}`}>
          {respuestaCorrecta ? 'Respuesta correcta.' : 'Respuesta incorrecta o tiempo agotado.'}
        </p>
      )}
    </article>
  )
}
