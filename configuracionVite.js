import { defineConfig as definirConfiguracion } from 'vite'
import complementoReact from '@vitejs/plugin-react'

export default definirConfiguracion({
  plugins: [complementoReact()],
})
