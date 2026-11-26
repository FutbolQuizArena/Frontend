import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import usarPresenciaDuelo from '../src/ganchos/usarPresenciaDuelo.js'
import { enviarPresenciaDuelo } from '../src/servicios/servicioDuelos.js'

vi.mock('../src/servicios/servicioDuelos.js', () => ({ enviarPresenciaDuelo: vi.fn() }))

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  enviarPresenciaDuelo.mockResolvedValue({ estado: 'EN_CURSO' })
})
afterEach(() => { cleanup(); vi.useRealTimers() })

it('envía presencia sin clics cada cinco segundos y limpia al salir', async () => {
  const { unmount } = renderHook(() => usarPresenciaDuelo(42))
  await act(async () => {})
  expect(enviarPresenciaDuelo).toHaveBeenCalledTimes(1)
  await act(async () => { await vi.advanceTimersByTimeAsync(10000) })
  expect(enviarPresenciaDuelo).toHaveBeenCalledTimes(3)
  unmount()
  await act(async () => { await vi.advanceTimersByTimeAsync(15000) })
  window.dispatchEvent(new Event('online'))
  expect(enviarPresenciaDuelo).toHaveBeenCalledTimes(3)
})

it('reintenta una pérdida de conexión y recibe el cierre del servidor', async () => {
  enviarPresenciaDuelo.mockRejectedValueOnce(new Error('sin internet'))
  const { result } = renderHook(() => usarPresenciaDuelo(42))
  await act(async () => {})
  expect(result.current.errorConexion).toBe('sin internet')
  enviarPresenciaDuelo.mockResolvedValue({ estado: 'FINALIZADA', motivo_finalizacion: 'ABANDONO' })
  await act(async () => { await vi.advanceTimersByTimeAsync(5000) })
  expect(result.current.estado.motivo_finalizacion).toBe('ABANDONO')
  expect(result.current.errorConexion).toBe('')
  await act(async () => { await vi.advanceTimersByTimeAsync(15000) })
  expect(enviarPresenciaDuelo).toHaveBeenCalledTimes(2)
})

it('no interpreta ocultar la pestaña como abandono ni envía con ID inválido', async () => {
  const { rerender } = renderHook(({ id }) => usarPresenciaDuelo(id), { initialProps: { id: null } })
  await act(async () => {})
  expect(enviarPresenciaDuelo).not.toHaveBeenCalled()
  rerender({ id: 42 })
  await act(async () => {})
  document.dispatchEvent(new Event('visibilitychange'))
  expect(enviarPresenciaDuelo).toHaveBeenCalledTimes(1)
})
