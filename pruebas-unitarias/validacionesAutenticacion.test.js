import { describe, expect, it } from 'vitest'
import { esCorreoValido, validarInicioSesion, validarRegistro } from '../src/utilidades/validacionesAutenticacion.js'

describe('validaciones de autenticación', () => {
  it.each([
    ['ana@ejemplo.com', true],
    ['a@b.c', true],
    ['', false],
    ['anaejemplo.com', false],
    ['@ejemplo.com', false],
    ['ana@', false],
    ['ana@@ejemplo.com', false],
    ['ana@ejemplo', false],
    ['ana@.com', false],
    ['ana@ejemplo.', false],
    ['ana @ejemplo.com', false],
  ])('valida el correo %s', (correo, valido) => {
    expect(esCorreoValido(correo)).toBe(valido)
  })

  it('informa los campos obligatorios del inicio de sesión', () => {
    expect(validarInicioSesion({ correo: ' ', contrasena: '' })).toEqual({
      correo: 'Ingresá tu correo electrónico.',
      contrasena: 'Ingresá tu contraseña.',
    })
  })

  it('acepta un correo válido con espacios externos y una contraseña', () => {
    expect(validarInicioSesion({ correo: ' ana@ejemplo.com ', contrasena: 'Clave1234' })).toEqual({})
  })

  it('rechaza el correo inválido', () => {
    expect(validarInicioSesion({ correo: 'ana@ejemplo', contrasena: 'Clave1234' })).toEqual({
      correo: 'Ingresá un correo electrónico válido.',
    })
  })

  it('informa todos los errores del registro', () => {
    expect(validarRegistro({
      nombre: ' ', correo: 'sin-arroba', contrasena: '123', confirmacionContrasena: 'otra',
    })).toEqual({
      nombre: 'Ingresá tu nombre.',
      correo: 'Ingresá un correo electrónico válido.',
      contrasena: 'La contraseña debe tener al menos 8 caracteres.',
      confirmacionContrasena: 'Las contraseñas no coinciden.',
    })
  })

  it('exige la confirmación de la contraseña', () => {
    expect(validarRegistro({
      nombre: 'Ana', correo: 'ana@ejemplo.com', contrasena: 'Clave1234', confirmacionContrasena: '',
    })).toEqual({ confirmacionContrasena: 'Confirmá tu contraseña.' })
  })

  it('acepta un registro completo', () => {
    expect(validarRegistro({
      nombre: 'Ana', correo: 'ana@ejemplo.com', contrasena: 'Clave1234', confirmacionContrasena: 'Clave1234',
    })).toEqual({})
  })
})
