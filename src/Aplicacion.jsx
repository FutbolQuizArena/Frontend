import { Link as Enlace, Route as Ruta, Routes as Rutas } from 'react-router-dom'
import PaginaLogin from './paginas/PaginaLogin.jsx'
import PaginaRegistro from './paginas/PaginaRegistro.jsx'
import PaginaHome from './paginas/PaginaHome.jsx'
import PaginaPendiente from './paginas/PaginaPendiente.jsx'
import PaginaPerfil from './paginas/PaginaPerfil.jsx'
import PaginaCrearTorneo from './paginas/PaginaCrearTorneo.jsx'
import RutaProtegida from './componentes/RutaProtegida.jsx'
import RutaPublica from './componentes/RutaPublica.jsx'

export default function Aplicacion() {
  return (
    <Rutas>
      <Ruta element={<RutaPublica />}>
        <Ruta path="/" element={<PaginaLogin />} />
        <Ruta path="/login" element={<PaginaLogin />} />
        <Ruta path="/registro" element={<PaginaRegistro />} />
      </Ruta>
      <Ruta element={<RutaProtegida />}>
        <Ruta path="/home" element={<PaginaHome />} />
        <Ruta path="/partida-individual" element={<PaginaPendiente titulo="Partida Individual" />} />
        <Ruta path="/duelo" element={<PaginaPendiente titulo="Duelo" />} />
        <Ruta path="/torneos" element={<PaginaPendiente titulo="Torneos" destinoAccion="/torneos/crear" textoAccion="Crear torneo" />} />
        <Ruta path="/torneos/crear" element={<PaginaCrearTorneo />} />
        <Ruta path="/ranking" element={<PaginaPendiente titulo="Ranking" />} />
        <Ruta path="/perfil" element={<PaginaPerfil />} />
        <Ruta path="/admin" element={<PaginaPendiente titulo="Administración" />} />
      </Ruta>
      <Ruta path="*" element={
        <main className="pagina-no-encontrada">
          <p className="sobretitulo">FUTBOLQUIZ ARENA</p>
          <h1>No encontramos esta página</h1>
          <Enlace to="/login">Volver al inicio de sesión</Enlace>
        </main>
      } />
    </Rutas>
  )
}
