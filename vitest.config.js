import { defineConfig as definirConfiguracion } from 'vitest/config'
import complementoReact from '@vitejs/plugin-react'

export default definirConfiguracion({
  plugins: [complementoReact()],
  test: {
    include: ['pruebas-unitarias/**/*.test.{js,jsx}'],
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,jsx}'],
      reporter: ['text-summary', 'lcov', 'html'],
      reportsDirectory: 'coverage-unit',
    },
  },
})
