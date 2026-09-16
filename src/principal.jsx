import { StrictMode as ModoEstricto } from 'react'
import { createRoot as crearRaiz } from 'react-dom/client'
import { BrowserRouter as Enrutador } from 'react-router-dom'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import '@fontsource/inter/latin-800.css'
import Aplicacion from './Aplicacion.jsx'
import './estilos/estilos.css'

crearRaiz(document.getElementById('raiz')).render(
  <ModoEstricto>
    <Enrutador>
      <Aplicacion />
    </Enrutador>
  </ModoEstricto>,
)
