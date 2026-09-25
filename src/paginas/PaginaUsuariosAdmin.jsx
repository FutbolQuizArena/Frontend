import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import MarcoTorneo from '../componentes/MarcoTorneo.jsx'
import NavegacionAdmin from '../componentes/NavegacionAdmin.jsx'
import { obtenerPerfil } from '../servicios/servicioPerfil.js'
import { obtenerUsuariosAdmin } from '../servicios/servicioUsuariosAdmin.js'
import { esSesionAdminPrueba, obtenerToken } from '../servicios/servicioSesion.js'
import '../estilos/estilosSalaDetalleTorneo.css'
import '../estilos/estilosPreguntasAdmin.css'
import '../estilos/estilosMarcoAdmin.css'
import '../estilos/estilosUsuariosAdmin.css'

const tamanioPagina = 6

export default function PaginaUsuariosAdmin() {
  const [parametros] = useSearchParams()
  const vistaPrevia = import.meta.env.DEV && parametros.get('vistaPrevia') === '1'
  const datosEjemplo = import.meta.env.DEV && (vistaPrevia || esSesionAdminPrueba(obtenerToken()))
  const [rolActual, establecerRolActual] = useState(null)
  const [usuarios, establecerUsuarios] = useState([])
  const [buscar, establecerBuscar] = useState('')
  const [rol, establecerRol] = useState('')
  const [estado, establecerEstado] = useState('')
  const [pagina, establecerPagina] = useState(1)
  const [cargando, establecerCargando] = useState(true)
  const [error, establecerError] = useState('')
  const [intento, establecerIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    establecerCargando(true)
    establecerError('')
    async function cargar() {
      const perfil = vistaPrevia ? { rol: 'ADMINISTRADOR' } : await obtenerPerfil()
      if (!vigente) return
      establecerRolActual(perfil.rol)
      if (perfil.rol !== 'ADMINISTRADOR') return
      const lista = await obtenerUsuariosAdmin({ buscar, rol, estaHabilitado: estado }, { vistaPrevia })
      if (vigente) establecerUsuarios(lista)
    }
    cargar().catch((fallo) => { if (vigente) establecerError(fallo.message || 'No pudimos cargar los usuarios.') })
      .finally(() => { if (vigente) establecerCargando(false) })
    return () => { vigente = false }
  }, [buscar, rol, estado, intento, vistaPrevia])

  const totalPaginas = Math.max(1, Math.ceil(usuarios.length / tamanioPagina))
  const visibles = usuarios.slice((pagina - 1) * tamanioPagina, pagina * tamanioPagina)
  function cambiarFiltro(establecer, valor) { establecer(valor); establecerPagina(1) }

  return <MarcoTorneo administrador sufijoAdmin={vistaPrevia ? '?vistaPrevia=1' : ''} tituloMovil="Administración" subtituloMovil="Usuarios">
    <div className="admin-preguntas admin-usuarios">
      <header className="admin-preguntas__encabezado"><div><h1>Usuarios</h1><p>Consultá las cuentas registradas y su estado.</p></div></header>
      {cargando && <p className="admin-preguntas__estado" role="status">Cargando usuarios…</p>}
      {!cargando && error && <div className="admin-preguntas__estado" role="alert"><p>{error}</p><button type="button" onClick={() => establecerIntento((actual) => actual + 1)}>Reintentar</button></div>}
      {!cargando && !error && rolActual !== 'ADMINISTRADOR' && <div className="admin-preguntas__estado" role="alert"><p>Solo los administradores pueden consultar usuarios.</p><Link to="/home">Volver al inicio</Link></div>}
      {!cargando && !error && rolActual === 'ADMINISTRADOR' && <section className="admin-preguntas__panel" aria-labelledby="titulo-usuarios-admin">
        {datosEjemplo && <p className="admin-preguntas__aviso" role="status">Datos de ejemplo para probar el panel en desarrollo.</p>}
        <NavegacionAdmin vistaPrevia={vistaPrevia} />
        <div className="admin-preguntas__titulo"><div><h2 id="titulo-usuarios-admin">Gestión de usuarios</h2><p>{datosEjemplo ? 'Listado de ejemplo' : 'Listado del backend'}</p></div></div>
        <div className="admin-preguntas__filtros"><label>Buscar usuario<input type="search" value={buscar} onChange={(evento) => cambiarFiltro(establecerBuscar, evento.target.value)} placeholder="Nombre o correo" /></label><label>Rol<select value={rol} onChange={(evento) => cambiarFiltro(establecerRol, evento.target.value)}><option value="">Todos los roles</option><option value="JUGADOR">Jugador</option><option value="ADMINISTRADOR">Administrador</option></select></label><label>Estado<select value={estado} onChange={(evento) => cambiarFiltro(establecerEstado, evento.target.value)}><option value="">Todos los estados</option><option value="true">Habilitado</option><option value="false">Deshabilitado</option></select></label></div>
        <p className="admin-preguntas__cantidad" role="status">{usuarios.length} {usuarios.length === 1 ? 'usuario' : 'usuarios'}</p>
        {visibles.length ? <div className="admin-preguntas__tabla admin-usuarios__tabla"><div className="admin-preguntas__cabecera" aria-hidden="true"><span>Nombre</span><span>Correo</span><span>Rol</span><span>Estado</span></div><ul>{visibles.map((usuario) => <li key={usuario.id}><strong>{usuario.nombre}</strong><span data-etiqueta="Correo">{usuario.email}</span><span data-etiqueta="Rol">{usuario.rol === 'ADMINISTRADOR' ? 'Administrador' : 'Jugador'}</span><span className={`admin-categorias__estado${usuario.esta_habilitado ? '' : ' admin-categorias__estado--borrador'}`}>{usuario.esta_habilitado ? 'HABILITADO' : 'DESHABILITADO'}</span></li>)}</ul></div> : <p className="admin-preguntas__vacio">No hay usuarios que coincidan con los filtros.</p>}
        {totalPaginas > 1 && <nav className="admin-preguntas__paginacion" aria-label="Páginas de usuarios"><span>Página {pagina} de {totalPaginas}</span><div><button type="button" disabled={pagina === 1} onClick={() => establecerPagina((actual) => actual - 1)}>Anterior</button><button type="button" disabled={pagina === totalPaginas} onClick={() => establecerPagina((actual) => actual + 1)}>Siguiente</button></div></nav>}
      </section>}
    </div>
  </MarcoTorneo>
}
