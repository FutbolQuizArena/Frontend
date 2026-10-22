import { test as prueba, expect as esperar } from './fixturesCobertura.js'
import { prepararSesion } from './datosSesion.js'

prueba.beforeEach(async ({ page: pagina }) => {
  await prepararSesion(pagina)
})

prueba('normaliza los modos recibidos y descarta respuestas invalidas', async ({ page: pagina }) => {
  await pagina.route('https://api.futbolquiz.test/api/juegos/modos', (ruta) => ruta.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      modos: [
        null,
        'invalido',
        {},
        { titulo: '' },
        {
          id: 'modo-canonico',
          titulo: 'Modo canónico',
          descripcion: 'Descripción canónica',
          destino: '/partida/ruleta',
          icono: '⚽',
          etiqueta: 'Clásico',
        },
        {
          title: 'Modo en inglés',
          description: 'Descripción en inglés',
          path: '/duelo/local',
          emoji: '🎮',
          label: 'Alternativo',
        },
        {
          nombre: 'Modo con nombre',
          resumen: 'Descripción resumida',
          ruta: '/duelo/esperando',
          simbolo: '🏆',
          tag: 'Competencia',
        },
        {
          name: 'Modo con name',
          link: '/torneos',
          icon: '⭐',
          tipo: 'Torneo',
        },
        {
          titulo: 'Modo con valores por defecto',
          destino: '',
        },
      ],
    }),
  }))

  await pagina.goto('/jugar')

  await esperar(pagina.getByRole('link', { name: /Modo canónico/ })).toHaveAttribute('href', '/partida/ruleta')
  await esperar(pagina.getByRole('link', { name: /Modo en inglés/ })).toHaveAttribute('href', '/duelo/local')
  await esperar(pagina.getByRole('link', { name: /Modo con nombre/ })).toHaveAttribute('href', '/duelo/esperando')
  await esperar(pagina.getByRole('link', { name: /Modo con name/ })).toHaveAttribute('href', '/torneos')
  await esperar(pagina.getByRole('link', { name: /Modo con valores por defecto/ })).toHaveAttribute('href', '/home')
  await esperar(pagina.getByText('Descripción canónica')).toBeVisible()
  await esperar(pagina.getByText('Modo de juego disponible.').first()).toBeVisible()
  await esperar(pagina.getByRole('link', { name: /Partida Individual/ })).toHaveCount(0)
})

prueba('prueba la siguiente ruta y extrae modos desde data', async ({ page: pagina }) => {
  let llamadasSegundaRuta = 0

  await pagina.route('https://api.futbolquiz.test/api/juegos/modos', (ruta) => ruta.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ modos: [] }),
  }))
  await pagina.route('https://api.futbolquiz.test/api/modos-juego', (ruta) => {
    llamadasSegundaRuta += 1
    return ruta.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [{ title: 'Modo desde data', path: '/jugar' }] }),
    })
  })

  await pagina.goto('/jugar')

  await esperar(pagina.getByRole('link', { name: /Modo desde data/ })).toHaveAttribute('href', '/jugar')
  esperar(llamadasSegundaRuta).toBeGreaterThan(0)
})

prueba('extrae modos desde modosJuego cuando las otras colecciones no son arreglos', async ({ page: pagina }) => {
  await pagina.route('https://api.futbolquiz.test/api/juegos/modos', (ruta) => ruta.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ modosJuego: [{ titulo: 'Modo alternativo' }] }),
  }))

  await pagina.goto('/jugar')

  await esperar(pagina.getByRole('link', { name: /Modo alternativo/ })).toHaveAttribute('href', '/home')
})

prueba('continua si la API responde vacio o sin colecciones de modos', async ({ page: pagina }) => {
  let ultimaRutaConsultada = 0

  await pagina.route('https://api.futbolquiz.test/api/juegos/modos', (ruta) => ruta.fulfill({
    status: 204,
    body: '',
  }))
  await pagina.route('https://api.futbolquiz.test/api/modos-juego', (ruta) => ruta.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({}),
  }))
  for (const rutaApi of ['/api/game-modes', '/api/modos']) {
    await pagina.route(`https://api.futbolquiz.test${rutaApi}`, (ruta) => ruta.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Servicio no disponible' }),
    }))
  }
  await pagina.route('https://api.futbolquiz.test/api/juegos', (ruta) => {
    ultimaRutaConsultada += 1
    return ruta.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Servicio no disponible' }),
    })
  })

  await pagina.goto('/jugar')
  await esperar.poll(() => ultimaRutaConsultada).toBeGreaterThan(0)

  await esperar(pagina.getByRole('link', { name: /Partida Individual/ })).toBeVisible()
})

prueba('usa los modos base cuando todas las rutas de la API fallan', async ({ page: pagina }) => {
  const rutasDeModos = [
    '/api/juegos/modos',
    '/api/modos-juego',
    '/api/game-modes',
    '/api/modos',
    '/api/juegos',
  ]
  let llamadasApi = 0

  for (const rutaApi of rutasDeModos) {
    await pagina.route(`https://api.futbolquiz.test${rutaApi}`, (ruta) => {
      llamadasApi += 1
      return ruta.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Servicio no disponible' }),
      })
    })
  }

  await pagina.goto('/jugar')
  await esperar.poll(() => llamadasApi).toBeGreaterThanOrEqual(5)

  await esperar(pagina.getByRole('link', { name: /Partida Individual/ })).toBeVisible()
  await esperar(pagina.getByRole('link', { name: /Duelo 1v1/ })).toBeVisible()
  await esperar(pagina.getByRole('link', { name: /Juego local/ })).toBeVisible()
})
