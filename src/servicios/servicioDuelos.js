export function buscarRivalDuelo() {
  const demoraBase = typeof window !== 'undefined' && Number.isFinite(window.__DUELO_TIMEOUT__)
    ? Number(window.__DUELO_TIMEOUT__)
    : 3500

  const demora = demoraBase + Math.floor(Math.random() * 1000)

  return new Promise((resolver) => {
    window.setTimeout(() => {
      const rivalMock = typeof window !== 'undefined' ? window.__DUELO_RIVAL__ : undefined
      resolver(rivalMock ?? null)
    }, demora)
  })
}

export function cancelarBusquedaDuelo() {
  return true
}
