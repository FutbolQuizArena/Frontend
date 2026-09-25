import { Link as Enlace, Route as Ruta, Routes as Rutas } from 'react-router-dom'
import PaginaLogin from './paginas/PaginaLogin.jsx'
import PaginaRegistro from './paginas/PaginaRegistro.jsx'
import PaginaHome from './paginas/PaginaHome.jsx'
import PaginaPendiente from './paginas/PaginaPendiente.jsx'
import PaginaPerfil from './paginas/PaginaPerfil.jsx'
import PaginaCrearTorneo from './paginas/PaginaCrearTorneo.jsx'
import PaginaTorneos from './paginas/PaginaTorneos.jsx'
import PaginaUnirseTorneo from './paginas/PaginaUnirseTorneo.jsx'
import PaginaSalaTorneo from './paginas/PaginaSalaTorneo.jsx'
import PaginaDetalleTorneo from './paginas/PaginaDetalleTorneo.jsx'
import PaginaCuadroTorneo from './paginas/PaginaCuadroTorneo.jsx'
import PaginaRuletaCategoria from './paginas/PaginaRuletaCategoria.jsx'
import PaginaPartidaIndividual from './paginas/PaginaPartidaIndividual.jsx'
import PaginaResultadoPartida from './paginas/PaginaResultadoPartida.jsx'
import PaginaResultadoIndividual from './paginas/PaginaResultadoIndividual.jsx'
import PaginaResultadoDuelo from './paginas/PaginaResultadoDuelo.jsx'
import PaginaSeleccionModo from './paginas/PaginaSeleccionModo.jsx'
import PaginaEsperandoRival from './paginas/PaginaEsperandoRival.jsx'
import PaginaPartidaDuelo from './paginas/PaginaPartidaDuelo.jsx'
import PaginaDueloLocal from './paginas/PaginaDueloLocal.jsx'
import PaginaPreguntasAdmin from './paginas/PaginaPreguntasAdmin.jsx'
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
        <Ruta path="/jugar" element={<PaginaSeleccionModo />} />
        <Ruta path="/juegos/modos" element={<PaginaSeleccionModo />} />
        <Ruta path="/partida-individual" element={<PaginaPendiente titulo="Partida Individual" destinoAccion="/partida/ruleta" textoAccion="Ir a la ruleta" />} />
        <Ruta path="/duelo" element={<PaginaEsperandoRival />} />
        <Ruta path="/duelo/esperando" element={<PaginaEsperandoRival />} />
        <Ruta path="/duelo/modo" element={<PaginaPendiente titulo="Duelo" destinoAccion="/partida/ruleta" textoAccion="Ir a la ruleta" />} />
        <Ruta path="/duelo/partida" element={<PaginaPartidaDuelo />} />
        <Ruta path="/duelo/juegan" element={<PaginaPartidaDuelo />} />
        <Ruta path="/duelo/local" element={<PaginaDueloLocal />} />
        <Ruta path="/duelo/:idDuelo/resultado" element={<PaginaResultadoDuelo />} />
        <Ruta path="/duelo/resultado" element={<PaginaResultadoDuelo />} />
        <Ruta path="/partida/ruleta" element={<PaginaRuletaCategoria />} />
        <Ruta path="/partida/juegan" element={<PaginaPartidaIndividual />} />
        <Ruta path="/partida/individual" element={<PaginaPartidaIndividual />} />
        <Ruta path="/partida/resultado" element={<PaginaResultadoIndividual />} />
        <Ruta path="/resultado-individual" element={<PaginaResultadoIndividual />} />
        <Ruta path="/torneos" element={<PaginaTorneos />} />
        <Ruta path="/torneos/crear" element={<PaginaCrearTorneo />} />
        <Ruta path="/torneos/unirse" element={<PaginaUnirseTorneo />} />
        <Ruta path="/torneos/:idTorneo/sala" element={<PaginaSalaTorneo />} />
        <Ruta path="/torneos/:idTorneo/cuadro" element={<PaginaCuadroTorneo />} />
        <Ruta path="/torneos/:idTorneo" element={<PaginaDetalleTorneo />} />
        <Ruta path="/ranking" element={<PaginaPendiente titulo="Ranking" />} />
        <Ruta path="/perfil" element={<PaginaPerfil />} />
        <Ruta path="/admin" element={<PaginaPreguntasAdmin />} />
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
