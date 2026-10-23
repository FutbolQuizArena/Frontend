import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { test as pruebaBase } from '@playwright/test'

const directorioCobertura = path.join(process.cwd(), '.nyc_output')

export const test = pruebaBase.extend({
  page: async ({ page }, usar) => {
    await usar(page)

    await page
      .evaluate(() => {
        if (window.__coverage__) {
          return window.guardarCoberturaIstanbul(JSON.stringify(window.__coverage__))
        }
      })
      .catch(() => {})
  },
  context: async ({ context }, usar) => {
    await mkdir(directorioCobertura, { recursive: true })

    await context.exposeFunction('guardarCoberturaIstanbul', async (cobertura) => {
      if (!cobertura || cobertura === 'undefined') return

      await writeFile(
        path.join(directorioCobertura, `playwright-${randomUUID()}.json`),
        cobertura,
      )
    })

    await context.addInitScript(() => {
      window.addEventListener('beforeunload', () => {
        if (window.__coverage__) {
          window.guardarCoberturaIstanbul(JSON.stringify(window.__coverage__))
        }
      })
    })

    await usar(context)

    await Promise.all(
      context.pages().map((pagina) =>
        pagina
          .evaluate(() => {
            if (window.__coverage__) {
              return window.guardarCoberturaIstanbul(JSON.stringify(window.__coverage__))
            }
          })
          .catch(() => {}),
      ),
    )
  },
})

export const expect = test.expect
