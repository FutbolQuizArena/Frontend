import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import Boton from '../src/componentes/Boton.jsx'
import CampoTexto from '../src/componentes/CampoTexto.jsx'

afterEach(cleanup)

describe('Boton', () => {
  it('muestra el texto y ejecuta el clic cuando está habilitado', () => {
    const alHacerClic = vi.fn()
    render(<Boton alHacerClic={alHacerClic}>Guardar</Boton>)
    const boton = screen.getByRole('button', { name: 'Guardar' })
    expect(boton.type).toBe('button')
    fireEvent.click(boton)
    expect(alHacerClic).toHaveBeenCalledOnce()
  })

  it('impide el clic y muestra el estado de carga', () => {
    const alHacerClic = vi.fn()
    render(<Boton cargando textoCargando="Guardando" alHacerClic={alHacerClic}>Guardar</Boton>)
    const boton = screen.getByRole('button', { name: 'Guardando' })
    expect(boton.disabled).toBe(true)
    expect(boton.getAttribute('aria-busy')).toBe('true')
    fireEvent.click(boton)
    expect(alHacerClic).not.toHaveBeenCalled()
  })

  it('respeta el tipo y la desactivación explícitos', () => {
    render(<Boton tipo="submit" deshabilitado>Enviar</Boton>)
    const boton = screen.getByRole('button', { name: 'Enviar' })
    expect(boton.type).toBe('submit')
    expect(boton.disabled).toBe(true)
  })
})

describe('CampoTexto', () => {
  it('asocia la etiqueta y transmite los cambios del usuario', () => {
    const alCambiar = vi.fn()
    render(<CampoTexto etiqueta="Descripción" nombre="descripcion" valor="" ejemplo="Escribí" requerido alCambiar={alCambiar} />)
    const campo = screen.getByRole('textbox', { name: 'Descripción' })
    expect(campo.name).toBe('descripcion')
    expect(campo.required).toBe(true)
    expect(campo.placeholder).toBe('Escribí')
    fireEvent.change(campo, { target: { value: 'Un torneo' } })
    expect(alCambiar).toHaveBeenCalledOnce()
  })
})
