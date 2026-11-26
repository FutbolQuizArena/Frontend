import { useEffect, useState } from 'react'
import { enviarPresenciaDuelo } from '../servicios/servicioDuelos.js'

/** Señales independientes de clics, respuestas y visibilidad de la pestaña. */
export default function usarPresenciaDuelo(idDuelo, habilitado = true) {
  const [estado, setEstado] = useState(null)
  const [errorConexion, setErrorConexion] = useState('')

  useEffect(() => {
    if (!habilitado || !Number.isInteger(Number(idDuelo)) || Number(idDuelo) <= 0) return
    let activo = true
    let consultando = false
    let terminado = false
    const enviar = async () => {
      if (!activo || consultando || terminado) return
      consultando = true
      try {
        const datos = await enviarPresenciaDuelo(idDuelo)
        if (!activo) return
        setEstado(datos)
        setErrorConexion('')
        terminado = datos.estado === 'FINALIZADA'
        if (terminado) window.clearInterval(intervalo)
      } catch (error) {
        if (activo) setErrorConexion(error.message || 'Se perdió la conexión. Intentando reconectar…')
      } finally {
        consultando = false
      }
    }
    const intervalo = window.setInterval(enviar, 5000)
    void enviar()
    // Volver de una suspensión dispara una comprobación sin esperar otro intervalo.
    window.addEventListener('online', enviar)
    window.addEventListener('focus', enviar)
    return () => {
      activo = false
      window.clearInterval(intervalo)
      window.removeEventListener('online', enviar)
      window.removeEventListener('focus', enviar)
    }
  }, [idDuelo, habilitado])

  return { estado, errorConexion }
}
