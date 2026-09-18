import { createContext as crearContexto, useContext as usarContexto, useEffect as usarEfecto, useState as usarEstado } from 'react'
import { borrarSesion, claveToken, guardarSesion, obtenerDatosToken, obtenerToken } from '../servicios/servicioSesion.js'

const ContextoSesion = crearContexto(null)

export function ProveedorSesion({ children: contenido }) {
  const [token, establecerToken] = usarEstado(obtenerToken)

  function abrirSesion(respuesta, mantenerSesion) {
    establecerToken(guardarSesion(respuesta, mantenerSesion))
  }

  function cerrarSesion() {
    borrarSesion()
    establecerToken(null)
  }

  usarEfecto(() => {
    let temporizador
    const vencimiento = obtenerDatosToken(token)?.exp

    function revisarVencimiento() {
      if (vencimiento === undefined) return
      const tiempoRestante = vencimiento * 1000 - Date.now()
      if (tiempoRestante <= 0) {
        borrarSesion()
        establecerToken(null)
      } else {
        temporizador = window.setTimeout(revisarVencimiento, Math.min(tiempoRestante, 2147483647))
      }
    }

    function sincronizarSesion(evento) {
      if (evento.type !== 'storage' || evento.key === claveToken || evento.key === null) {
        establecerToken(obtenerToken())
      }
    }

    revisarVencimiento()
    window.addEventListener('storage', sincronizarSesion)
    window.addEventListener('focus', sincronizarSesion)
    return () => {
      window.clearTimeout(temporizador)
      window.removeEventListener('storage', sincronizarSesion)
      window.removeEventListener('focus', sincronizarSesion)
    }
  }, [token])

  return (
    <ContextoSesion.Provider value={{ token, autenticado: Boolean(token), abrirSesion, cerrarSesion }}>
      {contenido}
    </ContextoSesion.Provider>
  )
}

export function usarSesion() {
  const sesion = usarContexto(ContextoSesion)
  if (!sesion) throw new Error('usarSesion debe utilizarse dentro de ProveedorSesion.')
  return sesion
}
