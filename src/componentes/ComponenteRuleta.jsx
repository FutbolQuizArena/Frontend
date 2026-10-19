import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react'

const PALETA_CATEGORIAS = ['#35c466', '#1f4d3a', '#f7d77d', '#87d2a4', '#2a7a4a', '#dff9ea']

const normalizarCategoria = (categoria, indice) => {
  if (typeof categoria === 'string') {
    return { id: `${categoria}-${indice}`, nombre: categoria, color: PALETA_CATEGORIAS[indice % PALETA_CATEGORIAS.length] }
  }

  return {
    id: categoria.id ?? `${categoria.nombre ?? 'categoria'}-${indice}`,
    nombre: categoria.nombre ?? categoria.titulo ?? `Categoría ${indice + 1}`,
    color: categoria.color ?? PALETA_CATEGORIAS[indice % PALETA_CATEGORIAS.length],
  }
}

const ComponenteRuleta = forwardRef(function ComponenteRuleta({
  categorias = [],
  alFinalizarGiro,
  deshabilitado = false,
  resultadoSeleccionado = null,
  indiceResultado = null,
}, referencia) {
  const [rotacion, setRotacion] = useState(0)
  const [giroEnCurso, setGiroEnCurso] = useState(false)
  const temporizadorGiro = useRef(null)

  const categoriasNormalizadas = useMemo(
    () => categorias.map(normalizarCategoria),
    [categorias],
  )

  const anguloSegmento = categoriasNormalizadas.length > 0 ? 360 / categoriasNormalizadas.length : 360

  const obtenerIndiceResultado = useCallback(() => {
    if (Number.isInteger(indiceResultado) && indiceResultado >= 0 && indiceResultado < categoriasNormalizadas.length) {
      return indiceResultado
    }

    if (resultadoSeleccionado) {
      const buscado = typeof resultadoSeleccionado === 'string'
        ? resultadoSeleccionado
        : resultadoSeleccionado.nombre

      const indice = categoriasNormalizadas.findIndex((categoria) => categoria.nombre === buscado || categoria.id === resultadoSeleccionado.id)
      if (indice >= 0) {
        return indice
      }
    }

    return Math.floor(Math.random() * categoriasNormalizadas.length)
  }, [categoriasNormalizadas, indiceResultado, resultadoSeleccionado])

  const girarRuleta = useCallback((resultado = null) => {
    if (giroEnCurso || deshabilitado || categoriasNormalizadas.length === 0) {
      return null
    }

    const indiceObjetivo = resultado
      ? (typeof resultado === 'string'
        ? categoriasNormalizadas.findIndex((categoria) => categoria.nombre === resultado)
        : categoriasNormalizadas.findIndex((categoria) => categoria.nombre === resultado.nombre || categoria.id === resultado.id))
      : obtenerIndiceResultado()

    const indiceFinal = indiceObjetivo >= 0 ? indiceObjetivo : obtenerIndiceResultado()
    const centroSegmento = (indiceFinal + 0.5) * anguloSegmento
    const rotacionObjetivo = (360 - centroSegmento + 360) % 360
    const rotacionActual = ((rotacion % 360) + 360) % 360
    const diferencia = (rotacionObjetivo - rotacionActual + 360) % 360
    const vueltas = 6 + Math.floor(Math.random() * 2)
    const aumento = vueltas * 360 + diferencia
    const siguienteRotacion = rotacion + aumento

    setRotacion(siguienteRotacion)
    setGiroEnCurso(true)

    if (temporizadorGiro.current) {
      clearTimeout(temporizadorGiro.current)
    }

    temporizadorGiro.current = setTimeout(() => {
      const categoriaElegida = categoriasNormalizadas[indiceFinal]
      setGiroEnCurso(false)
      if (typeof alFinalizarGiro === 'function') {
        alFinalizarGiro(categoriaElegida)
      }
    }, 4200)

    return categoriaElegidaEnIndice(indiceFinal)
  }, [anguloSegmento, categoriasNormalizadas, deshabilitado, giroEnCurso, obtenerIndiceResultado, alFinalizarGiro, rotacion])

  const categoriaElegidaEnIndice = (indice) => categoriasNormalizadas[indice] ?? null

  const segmentos = categoriasNormalizadas.map((categoria, indice) => {
    const anguloInicio = -90 + indice * anguloSegmento
    const anguloFin = anguloInicio + anguloSegmento
    const radio = 130
    const centroX = 150
    const centroY = 150
    const x1 = centroX + radio * Math.cos((anguloInicio * Math.PI) / 180)
    const y1 = centroY + radio * Math.sin((anguloInicio * Math.PI) / 180)
    const x2 = centroX + radio * Math.cos((anguloFin * Math.PI) / 180)
    const y2 = centroY + radio * Math.sin((anguloFin * Math.PI) / 180)
    const grande = anguloSegmento > 180 ? 1 : 0
    const radioInterior = 46
    const x1Interior = centroX + radioInterior * Math.cos((anguloInicio * Math.PI) / 180)
    const y1Interior = centroY + radioInterior * Math.sin((anguloInicio * Math.PI) / 180)
    const x2Interior = centroX + radioInterior * Math.cos((anguloFin * Math.PI) / 180)
    const y2Interior = centroY + radioInterior * Math.sin((anguloFin * Math.PI) / 180)

    const anguloCentro = anguloInicio + anguloSegmento / 2
    const xTexto = centroX + 98 * Math.cos((anguloCentro * Math.PI) / 180)
    const yTexto = centroY + 98 * Math.sin((anguloCentro * Math.PI) / 180)

    return {
      ...categoria,
      path: `M ${centroX} ${centroY} L ${x1} ${y1} A ${radio} ${radio} 0 ${grande} 1 ${x2} ${y2} Z`,
      background: `M ${centroX} ${centroY} L ${x1Interior} ${y1Interior} A ${radioInterior} ${radioInterior} 0 ${grande} 1 ${x2Interior} ${y2Interior} Z`,
      xTexto,
      yTexto,
      rotacionTexto: anguloCentro + 90,
    }
  })

  useImperativeHandle(referencia, () => ({ girarRuleta }))

  return (
    <div className="ruleta">
      <div className="ruleta__contenedor" aria-live="polite">
        <div className="ruleta__puntero" aria-hidden="true" />
        <svg
          className={`ruleta__rueda ${giroEnCurso ? 'ruleta__rueda--girando' : ''}`}
          viewBox="0 0 300 300"
          role="img"
          aria-label="Ruleta de categorías de fútbol"
          style={{
            transform: `rotate(${rotacion}deg)`,
            transition: giroEnCurso ? 'transform 4.2s cubic-bezier(0.18, 0.89, 0.32, 1.28)' : 'transform 0.4s ease',
          }}
          data-girando={giroEnCurso}
        >
          {segmentos.map((segmento) => (
            <g key={segmento.id}>
              <path d={segmento.path} fill={segmento.color} stroke="#07100c" strokeWidth="2" />
              <text
                x={segmento.xTexto}
                y={segmento.yTexto}
                fill="#07100c"
                fontSize="11"
                fontWeight="700"
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${segmento.rotacionTexto} ${segmento.xTexto} ${segmento.yTexto})`}
                style={{ pointerEvents: 'none' }}
              >
                {segmento.nombre}
              </text>
            </g>
          ))}
          <circle cx="150" cy="150" r="34" fill="#07100c" stroke="#35c466" strokeWidth="4" />
          <circle cx="150" cy="150" r="16" fill="#f2f7f6" />
        </svg>
      </div>
    </div>
  )
})

export default ComponenteRuleta
