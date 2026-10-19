import { defineConfig as definirConfiguracion } from 'vite'
import complementoReact from '@vitejs/plugin-react'
import complementoCobertura from 'vite-plugin-istanbul'

export default definirConfiguracion({
  plugins: [
    complementoReact(),
    complementoCobertura({
      include: ['src/**/*.js', 'src/**/*.jsx'],
      exclude: ['node_modules/**', 'pruebas/**'],
      extension: ['.js', '.jsx'],
      requireEnv: true,
    }),
  ],
  build: {
    sourcemap: process.env.VITE_COVERAGE === 'true',
  },
})
