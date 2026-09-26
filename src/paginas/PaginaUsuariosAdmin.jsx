import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import MarcoTorneo from '../componentes/MarcoTorneo.jsx'
import NavegacionAdmin from '../componentes/NavegacionAdmin.jsx'
import { obtenerPerfil } from '../servicios/servicioPerfil.js'
import { cambiarEstadoUsuarioAdmin, obtenerUsuariosAdmin } from '../servicios/servicioUsuariosAdmin.js'
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
  const [usuarioSeleccionado, establecerUsuarioSeleccionado] = useState(null)
  const [guardandoEstado, establecerGuardandoEstado] = useState(false)
  const [errorEstado, establecerErrorEstado] = useState('')
  const [aviso, establecerAviso] = useState('')
  const dialogo = useRef(null)

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

  useEffect(() => {
    if (usuarioSeleccionado && dialogo.current && !dialogo.current.open) {
      dialogo.current.showModal?.()
    }
  }, [usuarioSeleccionado])

  async function confirmarCambioEstado() {
    if (!usuarioSeleccionado || guardandoEstado) return
    establecerGuardandoEstado(true)
    establecerErrorEstado('')
    try {
      const nuevoEstado = !usuarioSeleccionado.esta_habilitado
      await cambiarEstadoUsuarioAdmin(usuarioSeleccionado.id, nuevoEstado, { vistaPrevia })
      establecerUsuarios((anteriores) =>
        estado
          ? anteriores.filter((u) => u.id !== usuarioSeleccionado.id)
          : anteriores.map((u) => (u.id === usuarioSeleccionado.id ? { ...u, esta_habilitado: nuevoEstado } : u))
      )
      if (estado && visibles.length === 1 && pagina > 1) establecerPagina((actual) => actual - 1)
      establecerAviso(nuevoEstado ? `Usuario ${usuarioSeleccionado.nombre} habilitado.` : `Usuario ${usuarioSeleccionado.nombre} deshabilitado.`)
      establecerUsuarioSeleccionado(null)
    } catch (fallo) {
      establecerErrorEstado(fallo.message || 'No pudimos cambiar el estado del usuario.')
    } finally {
      establecerGuardandoEstado(false)
    }
  }

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
        {aviso && <p className="admin-preguntas__aviso" role="status">{aviso}</p>}
        {datosEjemplo && <p className="admin-preguntas__aviso" role="status">Datos de ejemplo para probar el panel en desarrollo.</p>}
        <NavegacionAdmin vistaPrevia={vistaPrevia} />
        <div className="admin-preguntas__titulo"><div><h2 id="titulo-usuarios-admin">Gestión de usuarios</h2><p>{datosEjemplo ? 'Listado de ejemplo' : 'Listado del backend'}</p></div></div>
        <div className="admin-preguntas__filtros"><label>Buscar usuario<input type="search" value={buscar} onChange={(evento) => cambiarFiltro(establecerBuscar, evento.target.value)} placeholder="Nombre o correo" /></label><label>Rol<select value={rol} onChange={(evento) => cambiarFiltro(establecerRol, evento.target.value)}><option value="">Todos los roles</option><option value="JUGADOR">Jugador</option><option value="ADMINISTRADOR">Administrador</option></select></label><label>Estado<select value={estado} onChange={(evento) => cambiarFiltro(establecerEstado, evento.target.value)}><option value="">Todos los estados</option><option value="true">Habilitado</option><option value="false">Deshabilitado</option></select></label></div>
        <p className="admin-preguntas__cantidad" role="status">{usuarios.length} {usuarios.length === 1 ? 'usuario' : 'usuarios'}</p>
        {visibles.length ? <div className="admin-preguntas__tabla admin-usuarios__tabla"><div className="admin-preguntas__cabecera" aria-hidden="true"><span>Nombre</span><span>Correo</span><span>Rol</span><span>Estado</span><span>Acciones</span></div><ul>{visibles.map((usuario) => <li key={usuario.id}><strong>{usuario.nombre}</strong><span data-etiqueta="Correo">{usuario.email}</span><span data-etiqueta="Rol">{usuario.rol === 'ADMINISTRADOR' ? 'Administrador' : 'Jugador'}</span><span className={`admin-categorias__estado${usuario.esta_habilitado ? '' : ' admin-categorias__estado--borrador'}`}>{usuario.esta_habilitado ? 'HABILITADO' : 'DESHABILITADO'}</span><button type="button" className={`admin-usuarios__boton-accion${usuario.esta_habilitado ? ' admin-usuarios__boton-accion--deshabilitar' : ' admin-usuarios__boton-accion--habilitar'}`} onClick={() => { establecerUsuarioSeleccionado(usuario); establecerErrorEstado('') }} aria-label={`${usuario.esta_habilitado ? 'Deshabilitar' : 'Habilitar'} usuario: ${usuario.nombre}`}>{usuario.esta_habilitado ? 'Deshabilitar' : 'Habilitar'}</button></li>)}</ul></div> : <p className="admin-preguntas__vacio">No hay usuarios que coincidan con los filtros.</p>}
        {totalPaginas > 1 && <nav className="admin-preguntas__paginacion" aria-label="Páginas de usuarios"><span>Página {pagina} de {totalPaginas}</span><div><button type="button" disabled={pagina === 1} onClick={() => establecerPagina((actual) => actual - 1)}>Anterior</button><button type="button" disabled={pagina === totalPaginas} onClick={() => establecerPagina((actual) => actual + 1)}>Siguiente</button></div></nav>}
      </section>}
      {usuarioSeleccionado && <dialog ref={dialogo} className="admin-preguntas__confirmacion" onCancel={(evento) => { evento.preventDefault(); if (!guardandoEstado) establecerUsuarioSeleccionado(null) }} role="alertdialog" aria-modal="true" aria-labelledby="titulo-estado-usuario" aria-describedby="detalle-estado-usuario" onKeyDown={(evento) => {
        if (evento.key === 'Escape' && !guardandoEstado) establecerUsuarioSeleccionado(null)
        if (evento.key === 'Tab') {
          const botones = evento.currentTarget.querySelectorAll('button:not(:disabled)')
          const primero = botones[0]
          const ultimo = botones[botones.length - 1]
          if (evento.shiftKey && document.activeElement === primero) { evento.preventDefault(); ultimo?.focus() }
          else if (!evento.shiftKey && document.activeElement === ultimo) { evento.preventDefault(); primero?.focus() }
        }
      }}><h2 id="titulo-estado-usuario">¿{usuarioSeleccionado.esta_habilitado ? 'Deshabilitar' : 'Habilitar'} usuario?</h2><p id="detalle-estado-usuario">¿Seguro que querés {usuarioSeleccionado.esta_habilitado ? 'deshabilitar' : 'habilitar'} a <strong>{usuarioSeleccionado.nombre}</strong> ({usuarioSeleccionado.email})?</p><p>{usuarioSeleccionado.esta_habilitado ? 'El usuario no podrá iniciar sesión mientras permanezca deshabilitado.' : 'El usuario volverá a tener acceso a la plataforma con sus datos previos.'}</p>{errorEstado && <p role="alert" className="admin-formulario__error">{errorEstado}</p>}<div><button type="button" disabled={guardandoEstado} onClick={() => establecerUsuarioSeleccionado(null)}>Cancelar</button><button type="button" disabled={guardandoEstado} onClick={confirmarCambioEstado}>{guardandoEstado ? 'Guardando…' : (usuarioSeleccionado.esta_habilitado ? 'Sí, deshabilitar' : 'Sí, habilitar')}</button></div></dialog>}
    </div>
  </MarcoTorneo>
}
