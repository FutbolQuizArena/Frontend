import { beforeEach, describe, expect, it, vi } from 'vitest'
import { solicitarApi } from '../src/servicios/clienteApi.js'
import {
  actualizarPreguntaAdmin, crearPreguntaAdmin, eliminarPreguntaAdmin,
  obtenerPreguntaAdmin, obtenerPreguntasAdmin, renombrarCategoriaPreguntasAdmin,
} from '../src/servicios/servicioPreguntasAdmin.js'

vi.mock('../src/servicios/clienteApi.js', () => ({ solicitarApi: vi.fn() }))

beforeEach(() => vi.resetAllMocks())

const preguntaApi = {
  id: 8, enunciado: '¿Qué equipo?', categoria_nombre: 'Clubes', categoria_id: 3,
  dificultad: 'Fácil', estado: 'ACTIVA', opcion_a: 'A', opcion_b: 'B', opcion_c: 'C',
  opcion_d: 'D', respuesta_correcta: 'B',
}
const datosPregunta = {
  enunciado: '¿Qué equipo?', categoria: 'Clubes', dificultad: 'Fácil',
  opciones: ['A', 'B', 'C', 'D'], respuestaCorrecta: 1, estado: 'ACTIVA',
}

describe('preguntas de administración', () => {
  it('arma los filtros y adapta el listado del servidor', async () => {
    vi.mocked(solicitarApi).mockResolvedValue({ items: [preguntaApi], total: 1, total_paginas: 0 })
    await expect(obtenerPreguntasAdmin({ pagina: 2, buscar: ' copa ', categoriaId: 3, estado: 'ACTIVA' })).resolves.toEqual({
      preguntas: [{
        id: 8, enunciado: '¿Qué equipo?', categoria: 'Clubes', categoriaId: 3,
        dificultad: 'Fácil', estado: 'ACTIVA', opciones: ['A', 'B', 'C', 'D'], respuestaCorrecta: 1,
      }], total: 1, totalPaginas: 1,
    })
    expect(solicitarApi).toHaveBeenCalledWith('/api/admin/preguntas?page=2&buscar=copa&categoria_id=3&estado=ACTIVA')
  })

  it('rechaza una respuesta sin listado o sin total de páginas', async () => {
    vi.mocked(solicitarApi).mockResolvedValue({ items: [], total_paginas: '1' })
    await expect(obtenerPreguntasAdmin()).rejects.toThrow('listado de preguntas inesperado')
  })

  it('obtiene una pregunta por ID y copia las opciones en vista previa', async () => {
    vi.mocked(solicitarApi).mockResolvedValue(preguntaApi)
    await expect(obtenerPreguntaAdmin(8)).resolves.toMatchObject({ id: 8, respuestaCorrecta: 1 })
    const primera = await obtenerPreguntaAdmin(1, { vistaPrevia: true })
    primera.opciones[0] = 'Modificada'
    expect((await obtenerPreguntaAdmin(1, { vistaPrevia: true })).opciones[0]).not.toBe('Modificada')
    await expect(obtenerPreguntaAdmin(999, { vistaPrevia: true })).rejects.toThrow('No encontramos esa pregunta')
  })

  it('traduce la categoría y las opciones para crear una pregunta', async () => {
    vi.mocked(solicitarApi).mockResolvedValueOnce([{ id: 3, nombre: 'Clubes' }]).mockResolvedValueOnce(preguntaApi)
    await expect(crearPreguntaAdmin(datosPregunta)).resolves.toMatchObject({ id: 8, respuestaCorrecta: 1 })
    expect(solicitarApi).toHaveBeenNthCalledWith(2, '/api/admin/preguntas', {
      metodo: 'POST', datos: {
        enunciado: '¿Qué equipo?', categoria_id: 3, dificultad: 'Fácil',
        opcion_a: 'A', opcion_b: 'B', opcion_c: 'C', opcion_d: 'D',
        respuesta_correcta: 'B', estado: 'ACTIVA',
      },
    })
  })

  it('rechaza una categoría que dejó de estar disponible', async () => {
    vi.mocked(solicitarApi).mockResolvedValue([])
    await expect(crearPreguntaAdmin(datosPregunta)).rejects.toThrow('categoría seleccionada ya no está disponible')
  })

  it('crea, actualiza y elimina una pregunta en la vista previa', async () => {
    const opciones = { vistaPrevia: true }
    const creada = await crearPreguntaAdmin(datosPregunta, opciones)
    expect(creada.id).toBeGreaterThan(12)
    const actualizada = await actualizarPreguntaAdmin(creada.id, { enunciado: 'Nueva pregunta' }, opciones)
    expect(actualizada.enunciado).toBe('Nueva pregunta')
    await eliminarPreguntaAdmin(creada.id, opciones)
    await expect(obtenerPreguntaAdmin(creada.id, opciones)).rejects.toThrow('No encontramos esa pregunta')
  })

  it('valida IDs inexistentes y propaga la eliminación por API', async () => {
    await expect(actualizarPreguntaAdmin(999, datosPregunta, { vistaPrevia: true })).rejects.toThrow('No encontramos esa pregunta')
    await expect(eliminarPreguntaAdmin(999, { vistaPrevia: true })).rejects.toThrow('No encontramos esa pregunta')
    vi.mocked(solicitarApi).mockResolvedValue(null)
    await eliminarPreguntaAdmin(8)
    expect(solicitarApi).toHaveBeenCalledWith('/api/admin/preguntas/8', { metodo: 'DELETE' })
  })

  it('renombra la categoría de las preguntas de la vista previa', async () => {
    await renombrarCategoriaPreguntasAdmin('Mundiales', 'Copas')
    const preguntas = await obtenerPreguntasAdmin({ vistaPrevia: true })
    expect(preguntas.some((pregunta) => pregunta.categoria === 'Copas')).toBe(true)
    await renombrarCategoriaPreguntasAdmin('Copas', 'Mundiales')
  })
})
