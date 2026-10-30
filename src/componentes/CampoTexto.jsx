import { useId as usarId } from 'react'

/** Renderiza un campo de texto controlado con su etiqueta y requisitos. */
export default function CampoTexto({ etiqueta, nombre, valor, alCambiar, ejemplo, requerido = false }) {
  const id = usarId()

  return (
    <div className="campo">
      <label className="campo__etiqueta" htmlFor={id}>{etiqueta}</label>
      <textarea
        className="campo__entrada campo__area-texto"
        id={id}
        name={nombre}
        value={valor}
        onChange={alCambiar}
        placeholder={ejemplo}
        required={requerido}
        rows="3"
      />
    </div>
  )
}
