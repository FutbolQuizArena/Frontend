import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
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

function obtenerTextoBotonCambioEstado(guardando, usuario) {
  if (guardando) return 'Guardando…'
  if (usuario.esta_habilitado) return 'Sí, deshabilitar'
  return 'Sí, habilitar'
}

export default function PaginaUsuariosAdmin() {
  const [parametros] = useSearchParams()
  const ubicacion = useLocation()
  const vistaPrevia = import.meta.env.DEV && parametros.get('vistaPrevia') === '1'
  const sufijo = vistaPrevia ? '?vistaPrevia=1' : ''
  const datosEjemplo = import.meta.env.DEV && (vistaPrevia || esSesionAdminPrueba(obtenerToken()))
  const [rolActual, setRolActual] = useState(null)
  const [usuarios, setUsuarios] = useState([])
  const [textoBusqueda, setTextoBusqueda] = useState('')
  const [buscar, setBuscar] = useState('')
  const [rol, setRol] = useState('')
  const [estado, setEstado] = useState('')
  const [pagina, setPagina] = useState(1)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [intento, setIntento] = useState(0)
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null)
  const [guardandoEstado, setGuardandoEstado] = useState(false)
  const [errorEstado, setErrorEstado] = useState('')
  const [aviso, setAviso] = useState('')
  const dialogo = useRef(null)

  useEffect(() => {
    let vigente = true
    setCargando(true)
    setError('')
    async function cargar() {
      const perfil = vistaPrevia ? { rol: 'ADMINISTRADOR' } : await obtenerPerfil()
      if (!vigente) return
      setRolActual(perfil.rol)
      if (perfil.rol !== 'ADMINISTRADOR') return
      const lista = await obtenerUsuariosAdmin({ buscar, rol, estaHabilitado: estado }, { vistaPrevia })
      if (vigente) setUsuarios(lista)
    }
    cargar().catch((error_) => { if (vigente) setError(error_.message || 'No pudimos cargar los usuarios.') })
      .finally(() => { if (vigente) setCargando(false) })
    return () => { vigente = false }
  }, [buscar, rol, estado, intento, vistaPrevia])

  useEffect(() => {
    if (usuarioSeleccionado && dialogo.current && !dialogo.current.open) {
      dialogo.current.showModal?.()
    }
  }, [usuarioSeleccionado])

  // El texto escrito se aplica al listado cuando se envía el formulario con Buscar o Enter.
  function enviarBusqueda(evento) {
    evento.preventDefault()
    setBuscar(textoBusqueda.trim())
    setPagina(1)
  }

  async function confirmarCambioEstado() {
    if (!usuarioSeleccionado || guardandoEstado) return
    setGuardandoEstado(true)
    setErrorEstado('')
    try {
      const nuevoEstado = !usuarioSeleccionado.esta_habilitado
      await cambiarEstadoUsuarioAdmin(usuarioSeleccionado.id, nuevoEstado, { vistaPrevia })
      setUsuarios((anteriores) =>
        estado
          ? anteriores.filter((u) => u.id !== usuarioSeleccionado.id)
          : anteriores.map((u) => (u.id === usuarioSeleccionado.id ? { ...u, esta_habilitado: nuevoEstado } : u))
      )
      if (estado && visibles.length === 1 && pagina > 1) setPagina((actual) => actual - 1)
      setAviso(nuevoEstado ? `Usuario ${usuarioSeleccionado.nombre} habilitado.` : `Usuario ${usuarioSeleccionado.nombre} deshabilitado.`)
      setUsuarioSeleccionado(null)
    } catch (error_) {
      setErrorEstado(error_.message || 'No pudimos cambiar el estado del usuario.')
    } finally {
      setGuardandoEstado(false)
    }
  }

  const totalPaginas = Math.max(1, Math.ceil(usuarios.length / tamanioPagina))
  const visibles = usuarios.slice((pagina - 1) * tamanioPagina, pagina * tamanioPagina)
  function cambiarFiltro(establecer, valor) { establecer(valor); setPagina(1) }

  return <MarcoTorneo administrador sufijoAdmin={sufijo} tituloMovil="Administración" subtituloMovil="Usuarios">
    <div className="admin-preguntas admin-usuarios">
      <header className="admin-preguntas__encabezado"><div><h1>Usuarios</h1><p>Consultá y gestioná las cuentas registradas.</p></div>{!cargando && !error && rolActual === 'ADMINISTRADOR' && <Link className="admin-listado__nuevo" to={`/admin/usuarios/nuevo${sufijo}`}>Nuevo usuario</Link>}</header>
      {cargando && <p className="admin-preguntas__estado"><output>Cargando usuarios…</output></p>}
      {!cargando && error && <div className="admin-preguntas__estado" role="alert"><p>{error}</p><button type="button" onClick={() => setIntento((actual) => actual + 1)}>Reintentar</button></div>}
      {!cargando && !error && rolActual !== 'ADMINISTRADOR' && <div className="admin-preguntas__estado" role="alert"><p>Solo los administradores pueden consultar usuarios.</p><Link to="/home">Volver al inicio</Link></div>}
      {!cargando && !error && rolActual === 'ADMINISTRADOR' && <section className="admin-preguntas__panel" aria-labelledby="titulo-usuarios-admin">
        {(aviso || ubicacion.state?.avisoUsuario) && <p className="admin-preguntas__aviso"><output>{aviso || ubicacion.state?.avisoUsuario}</output></p>}
        {datosEjemplo && <p className="admin-preguntas__aviso"><output>Datos de ejemplo para probar el panel en desarrollo.</output></p>}
        <NavegacionAdmin vistaPrevia={vistaPrevia} />
        <div className="admin-preguntas__titulo"><div><h2 id="titulo-usuarios-admin">Gestión de usuarios</h2><p>{datosEjemplo ? 'Listado de ejemplo' : 'Listado del backend'}</p></div></div>
        <form className="admin-preguntas__filtros" onSubmit={enviarBusqueda}><div className="admin-usuarios__busqueda"><label>Buscar usuario<input type="search" value={textoBusqueda} onChange={(evento) => setTextoBusqueda(evento.target.value)} placeholder="Nombre o correo" /></label><button type="submit" className="admin-usuarios__boton-accion">Buscar</button></div><label>Rol<select value={rol} onChange={(evento) => cambiarFiltro(setRol, evento.target.value)}><option value="">Todos los roles</option><option value="JUGADOR">Jugador</option><option value="ADMINISTRADOR">Administrador</option></select></label><label>Estado<select value={estado} onChange={(evento) => cambiarFiltro(setEstado, evento.target.value)}><option value="">Todos los estados</option><option value="true">Habilitado</option><option value="false">Deshabilitado</option></select></label></form>
        <p className="admin-preguntas__cantidad"><output>{usuarios.length} {usuarios.length === 1 ? 'usuario' : 'usuarios'}</output></p>
        {visibles.length ? <div className="admin-preguntas__tabla admin-usuarios__tabla"><div className="admin-preguntas__cabecera" aria-hidden="true"><span>Nombre</span><span>Correo</span><span>Rol</span><span>Estado</span><span>Acciones</span></div><ul>{visibles.map((usuario) => <li key={usuario.id}><strong>{usuario.nombre}</strong><span data-etiqueta="Correo">{usuario.email}</span><span data-etiqueta="Rol">{usuario.rol === 'ADMINISTRADOR' ? 'Administrador' : 'Jugador'}</span><span className={`admin-categorias__estado${usuario.esta_habilitado ? '' : ' admin-categorias__estado--borrador'}`}>{usuario.esta_habilitado ? 'HABILITADO' : 'DESHABILITADO'}</span><div className="admin-usuarios__acciones"><Link className="admin-usuarios__boton-accion" to={`/admin/usuarios/${usuario.id}/editar${sufijo}`}>Editar</Link><button type="button" className={`admin-usuarios__boton-accion${usuario.esta_habilitado ? ' admin-usuarios__boton-accion--deshabilitar' : ' admin-usuarios__boton-accion--habilitar'}`} onClick={() => { setUsuarioSeleccionado(usuario); setErrorEstado('') }} aria-label={`${usuario.esta_habilitado ? 'Deshabilitar' : 'Habilitar'} usuario: ${usuario.nombre}`}>{usuario.esta_habilitado ? 'Deshabilitar' : 'Habilitar'}</button></div></li>)}</ul></div> : <p className="admin-preguntas__vacio">No hay usuarios que coincidan con los filtros.</p>}
        {totalPaginas > 1 && <nav className="admin-preguntas__paginacion" aria-label="Páginas de usuarios"><span>Página {pagina} de {totalPaginas}</span><div><button type="button" disabled={pagina === 1} onClick={() => setPagina((actual) => actual - 1)}>Anterior</button><button type="button" disabled={pagina === totalPaginas} onClick={() => setPagina((actual) => actual + 1)}>Siguiente</button></div></nav>}
      </section>}
      {usuarioSeleccionado && <dialog ref={dialogo} className="admin-preguntas__confirmacion" onCancel={(evento) => { evento.preventDefault(); if (!guardandoEstado) setUsuarioSeleccionado(null) }} role="alertdialog" aria-modal="true" aria-labelledby="titulo-estado-usuario" aria-describedby="detalle-estado-usuario" onKeyDown={(evento) => {
        if (evento.key === 'Escape' && !guardandoEstado) setUsuarioSeleccionado(null)
        if (evento.key === 'Tab') {
          const botones = evento.currentTarget.querySelectorAll('button:not(:disabled)')
          const primero = botones[0]
          const ultimo = botones[botones.length - 1]
          if (evento.shiftKey && document.activeElement === primero) { evento.preventDefault(); ultimo?.focus() }
          else if (!evento.shiftKey && document.activeElement === ultimo) { evento.preventDefault(); primero?.focus() }
        }
      }}><h2 id="titulo-estado-usuario">¿{usuarioSeleccionado.esta_habilitado ? 'Deshabilitar' : 'Habilitar'} usuario?</h2><p id="detalle-estado-usuario">¿Seguro que querés {usuarioSeleccionado.esta_habilitado ? 'deshabilitar' : 'habilitar'} a <strong>{usuarioSeleccionado.nombre}</strong> ({usuarioSeleccionado.email})?</p><p>{usuarioSeleccionado.esta_habilitado ? 'El usuario no podrá iniciar sesión mientras permanezca deshabilitado.' : 'El usuario volverá a tener acceso a la plataforma con sus datos previos.'}</p>{errorEstado && <p role="alert" className="admin-formulario__error">{errorEstado}</p>}<div><button type="button" disabled={guardandoEstado} onClick={() => setUsuarioSeleccionado(null)}>Cancelar</button><button type="button" disabled={guardandoEstado} onClick={() => { void confirmarCambioEstado() }}>{obtenerTextoBotonCambioEstado(guardandoEstado, usuarioSeleccionado)}</button></div></dialog>}
    </div>
  </MarcoTorneo>
}
