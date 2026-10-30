import { createContext as crearContexto, useCallback as usarCallback, useContext as usarContexto, useEffect as usarEfecto, useMemo as usarMemo, useState as usarEstado } from 'react'
import { borrarSesion, claveToken, guardarSesion, obtenerDatosToken, obtenerToken } from '../servicios/servicioSesion.js'

const ContextoSesion = crearContexto(null)

/** Expone la sesión y la sincroniza con almacenamiento y vencimiento. */
export function ProveedorSesion({ children: contenido }) {
  const [token, establecerToken] = usarEstado(obtenerToken)

  const abrirSesion = usarCallback((respuesta, mantenerSesion) => {
    establecerToken(guardarSesion(respuesta, mantenerSesion))
  }, [establecerToken])

  const cerrarSesion = usarCallback(() => {
    borrarSesion()
    establecerToken(null)
  }, [establecerToken])

  // Actualiza el estado si otra pestaña cambia el token o vuelve el foco.
  const sincronizarSesion = usarCallback((evento) => {
    if (evento.type !== 'storage' || evento.key === claveToken || evento.key === null) {
      establecerToken(obtenerToken())
    }
  }, [establecerToken])

  // Programa la salida al vencer el token y limpia los listeners al cambiar la sesión.
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

    revisarVencimiento()
    window.addEventListener('storage', sincronizarSesion)
    window.addEventListener('focus', sincronizarSesion)
    return () => {
      window.clearTimeout(temporizador)
      window.removeEventListener('storage', sincronizarSesion)
      window.removeEventListener('focus', sincronizarSesion)
    }
  }, [token, sincronizarSesion])

  const valorSesion = usarMemo(() => ({
    token,
    autenticado: Boolean(token),
    abrirSesion,
    cerrarSesion,
  }), [token, abrirSesion, cerrarSesion])

  return (
    <ContextoSesion.Provider value={valorSesion}>
      {contenido}
    </ContextoSesion.Provider>
  )
}

/** Entrega el contexto y detecta componentes fuera del proveedor. */
export function usarSesion() {
  const sesion = usarContexto(ContextoSesion)
  if (!sesion) throw new Error('usarSesion debe utilizarse dentro de ProveedorSesion.')
  return sesion
}
