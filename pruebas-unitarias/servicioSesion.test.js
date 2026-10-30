import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  borrarSesion,
  claveToken,
  esSesionAdminPrueba,
  esTokenVigente,
  guardarSesion,
  obtenerDatosToken,
  obtenerToken,
} from '../src/servicios/servicioSesion.js'

function crearToken(datos) {
  const contenido = btoa(JSON.stringify(datos)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
  return ['cabecera', contenido, 'firma'].join('.')
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  vi.setSystemTime(new Date('2026-10-23T12:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('servicio de sesión', () => {
  it('lee el contenido de un token de prueba válido', () => {
    const datos = { id: 7, exp: Math.floor(Date.now() / 1000) + 60 }
    expect(obtenerDatosToken(crearToken(datos))).toEqual(datos)
  })

  it.each(['', 'cabecera.cuerpo', 'cabecera.%%%.firma', crearToken([]), crearToken({ exp: 'mañana' })])(
    'rechaza un token malformado o con datos inválidos', (token) => {
      expect(obtenerDatosToken(token)).toBeNull()
    },
  )

  it('distingue los tokens vigentes de los vencidos', () => {
    const ahora = Math.floor(Date.now() / 1000)
    expect(esTokenVigente(crearToken({ exp: ahora + 1 }))).toBe(true)
    expect(esTokenVigente(crearToken({ exp: ahora - 1 }))).toBe(false)
    expect(esTokenVigente(crearToken({ id: 7 }))).toBe(true)
  })

  it('reconoce la sesión de administrador de prueba solo con la marca correspondiente', () => {
    expect(esSesionAdminPrueba(crearToken({ adminPrueba: true }))).toBe(true)
    expect(esSesionAdminPrueba(crearToken({ adminPrueba: false }))).toBe(false)
  })

  it('guarda la sesión en el almacenamiento elegido y borra la anterior', () => {
    const token = crearToken({ id: 7 })
    localStorage.setItem(claveToken, 'anterior')
    expect(guardarSesion({ token_type: 'bearer', access_token: token })).toBe(token)
    expect(sessionStorage.getItem(claveToken)).toBe(token)
    expect(localStorage.getItem(claveToken)).toBeNull()

    expect(guardarSesion({ token_type: 'bearer', access_token: token }, true)).toBe(token)
    expect(localStorage.getItem(claveToken)).toBe(token)
    expect(sessionStorage.getItem(claveToken)).toBeNull()
  })

  it('rechaza una respuesta de sesión inválida', () => {
    expect(() => guardarSesion({ token_type: 'otro', access_token: crearToken({ id: 7 }) })).toThrow('sesión inválida')
    expect(() => guardarSesion({ token_type: 'bearer', access_token: 'incorrecto' })).toThrow('sesión inválida')
  })

  it('prioriza la sesión temporal y limpia los tokens vencidos', () => {
    const vigente = crearToken({ id: 7 })
    sessionStorage.setItem(claveToken, vigente)
    localStorage.setItem(claveToken, crearToken({ id: 9 }))
    expect(obtenerToken()).toBe(vigente)

    sessionStorage.setItem(claveToken, crearToken({ exp: Math.floor(Date.now() / 1000) - 1 }))
    expect(obtenerToken()).toBeNull()
    expect(sessionStorage.getItem(claveToken)).toBeNull()
    expect(localStorage.getItem(claveToken)).toBeNull()
  })

  it('borra la sesión de ambos almacenamientos', () => {
    localStorage.setItem(claveToken, 'uno')
    sessionStorage.setItem(claveToken, 'dos')
    borrarSesion()
    expect(localStorage.getItem(claveToken)).toBeNull()
    expect(sessionStorage.getItem(claveToken)).toBeNull()
    expect(obtenerToken()).toBeNull()
  })
})
