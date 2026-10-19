import { rm } from 'node:fs/promises'

await Promise.all([
  rm('.nyc_output', { recursive: true, force: true }),
  rm('coverage', { recursive: true, force: true }),
])
