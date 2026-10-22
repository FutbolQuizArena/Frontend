import { test, expect } from '@playwright/test'

test('CampoTexto asocia su etiqueta y actualiza el texto ingresado', async ({ page }) => {
  await page.goto('/pruebas/fixtures/campo-texto.html')

  const campo = page.getByRole('textbox', { name: 'Descripción' })

  await expect(campo).toHaveJSProperty('required', true)
  await expect(campo).toHaveAttribute('placeholder', 'Escribí una descripción')
  await campo.fill('Texto de prueba')
  await expect(campo).toHaveValue('Texto de prueba')
})
