import { test as prueba, expect as esperar } from '@playwright/test'
import { prepararSesion } from './datosSesion.js'

prueba('sin sesión, la sala redirige a login', async ({ page: pagina }) => {
  await pagina.goto('/torneos/14/sala')
  await esperar(pagina).toHaveURL(/\/login$/)
})

prueba('obtiene el torneo desde la ruta y muestra participantes y cupos', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.goto('/torneos/14/sala')

  await esperar(pagina.getByRole('heading', { name: 'Copa de Amigos' })).toBeVisible()
  await esperar(pagina.getByRole('heading', { name: 'Participantes · 6/8' })).toBeVisible()
  await esperar(pagina.getByText('Lucas (creador)')).toBeVisible()
  await esperar(pagina.getByText('Lugar disponible').first()).toBeVisible()
})

prueba('copia el código y muestra una confirmación local', async ({ page: pagina, context: contexto }) => {
  await contexto.grantPermissions(['clipboard-read', 'clipboard-write'])
  await prepararSesion(pagina)
  await pagina.goto('/torneos/14/sala')

  await pagina.getByRole('button', { name: 'Copiar código' }).click()
  await esperar(pagina.getByRole('status')).toHaveText('Código copiado al portapapeles.')
  esperar(await pagina.evaluate(() => navigator.clipboard.readText())).toBe('FQA8K2')
})

prueba('un participante no puede iniciar el torneo', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.goto('/torneos/5/sala')

  await esperar(pagina.getByText('El organizador iniciará el torneo cuando se complete la sala.')).toBeVisible()
  await esperar(pagina.getByRole('button', { name: 'Iniciar torneo' })).toHaveCount(0)
})

prueba('el organizador no puede iniciar mientras falten jugadores', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.goto('/torneos/14/sala')

  await esperar(pagina.getByRole('button', { name: 'Iniciar torneo' })).toBeDisabled()
  await esperar(pagina).toHaveURL(/\/torneos\/14\/sala$/)
})

prueba('una sala completa permite iniciar y abre el cuadro provisional', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.goto('/torneos/17/sala')

  const botonIniciar = pagina.getByRole('button', { name: 'Iniciar torneo' })
  await esperar(botonIniciar).toBeEnabled()
  await botonIniciar.click()
  await esperar(pagina.getByRole('status')).toContainText('Torneo iniciado')
  await esperar(pagina).toHaveURL(/\/torneos\/17\/cuadro$/)
  await esperar(pagina.getByRole('heading', { name: 'Cuadro del torneo' })).toBeVisible()
})

prueba('muestra un estado específico para un torneo inexistente', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.goto('/torneos/404/sala')

  await esperar(pagina.getByRole('alert').getByText('Torneo inexistente')).toBeVisible()
  await esperar(pagina.getByRole('link', { name: 'Volver a Torneos' })).toBeVisible()
})

prueba('la sala coincide con desktop y mobile sin desbordar', async ({ page: pagina }) => {
  await prepararSesion(pagina)
  await pagina.setViewportSize({ width: 1440, height: 1024 })
  await pagina.goto('/torneos/14/sala')
  await esperar(pagina.getByRole('heading', { name: 'Participantes · 6/8' })).toBeVisible()
  esperar(await pagina.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await pagina.screenshot({ path: 'test-results/sala-torneo-escritorio.png', fullPage: true })

  await pagina.setViewportSize({ width: 390, height: 844 })
  await pagina.reload()
  await esperar(pagina.getByRole('banner').getByText('Código FQA8K2')).toBeVisible()
  await esperar(pagina.getByText('6 de 8 jugadores listos')).toBeVisible()
  esperar(await pagina.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await pagina.screenshot({ path: 'test-results/sala-torneo-movil.png', fullPage: true })
})
