import { useId as usarId } from 'react'

export default function CampoEntrada({
  etiqueta,
  nombre,
  tipo = 'text',
  valor,
  alCambiar,
  error,
  ayuda,
  autocompletar,
  longitudMinima,
  ejemplo,
  simbolo,
  etiquetaMovil,
  requerido = true,
}) {
  const id = usarId()
  const descripcionId = `${id}-descripcion`

  return (
    <div className="campo">
      <label className="campo__etiqueta" htmlFor={id}>
        {etiquetaMovil ? <><span className="texto-escritorio">{etiqueta}</span><span className="texto-movil">{etiquetaMovil}</span></> : etiqueta}
      </label>
      <div className="campo__control">
        {simbolo && <span className="campo__simbolo" aria-hidden="true">{simbolo}</span>}
        <input
          className="campo__entrada"
          id={id}
          name={nombre}
          type={tipo}
          value={valor}
          onChange={alCambiar}
          autoComplete={autocompletar}
          minLength={longitudMinima}
          placeholder={ejemplo}
          required={requerido}
          aria-invalid={Boolean(error)}
          aria-describedby={error || ayuda ? descripcionId : undefined}
        />
      </div>
      {(error || ayuda) && (
        <p id={descripcionId} className={error ? 'campo__error' : 'campo__ayuda'}>
          {error || ayuda}
        </p>
      )}
    </div>
  )
}
