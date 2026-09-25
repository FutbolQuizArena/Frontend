import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import MarcoTorneo from '../componentes/MarcoTorneo.jsx'
import { obtenerPerfil } from '../servicios/servicioPerfil.js'
import { esSesionAdminPrueba, obtenerToken } from '../servicios/servicioSesion.js'
import { actualizarCategoriaAdmin, crearCategoriaAdmin, obtenerCategoriaAdmin } from '../servicios/servicioCategoriasAdmin.js'
import '../estilos/estilosSalaDetalleTorneo.css'
import '../estilos/estilosPreguntasAdmin.css'
import '../estilos/estilosMarcoAdmin.css'

const inicial = { nombre: '', descripcion: '', estado: 'ACTIVA' }

export default function PaginaFormularioCategoriaAdmin() {
  const { idCategoria } = useParams()
  const [parametros] = useSearchParams()
  const navegar = useNavigate()
  const vistaPrevia = import.meta.env.DEV && parametros.get('vistaPrevia') === '1'
  const datosEjemplo = vistaPrevia || esSesionAdminPrueba(obtenerToken())
  const sufijo = vistaPrevia ? '?vistaPrevia=1' : ''
  const regreso = `/admin/categorias${sufijo}`
  const [rol, establecerRol] = useState(null)
  const [datos, establecerDatos] = useState(inicial)
  const [cargando, establecerCargando] = useState(true)
  const [guardando, establecerGuardando] = useState(false)
  const [errorCarga, establecerErrorCarga] = useState('')
  const [errorFormulario, establecerErrorFormulario] = useState('')

  useEffect(() => {
    let vigente = true
    async function cargar() {
      try {
        const rolActual = vistaPrevia ? 'VISTA_PREVIA' : (await obtenerPerfil()).rol
        if (!vigente) return
        establecerRol(rolActual)
        if (rolActual !== 'ADMINISTRADOR' && !vistaPrevia) return
        if (idCategoria) {
          const categoria = await obtenerCategoriaAdmin(idCategoria, { vistaPrevia })
          if (vigente) establecerDatos(categoria)
        }
      } catch (fallo) {
        if (vigente) establecerErrorCarga(fallo.message || 'No pudimos cargar la categoría.')
      } finally {
        if (vigente) establecerCargando(false)
      }
    }
    cargar()
    return () => { vigente = false }
  }, [idCategoria, vistaPrevia])

  async function guardar(evento) {
    evento.preventDefault()
    if (!datos.nombre.trim()) {
      establecerErrorFormulario('Ingresá el nombre de la categoría.')
      return
    }
    establecerErrorFormulario('')
    establecerGuardando(true)
    try {
      if (idCategoria) await actualizarCategoriaAdmin(idCategoria, datos, { vistaPrevia })
      else await crearCategoriaAdmin(datos, { vistaPrevia })
      navegar(regreso, { state: { avisoCategoria: datosEjemplo ? 'Categoría guardada temporalmente. Los cambios se pierden al recargar la página.' : 'Categoría guardada.' } })
    } catch (fallo) {
      establecerErrorFormulario(fallo.message || 'No pudimos guardar la categoría.')
    } finally {
      establecerGuardando(false)
    }
  }

  const titulo = idCategoria ? 'Editar categoría' : 'Nueva categoría'
  return <MarcoTorneo administrador sufijoAdmin={sufijo} tituloMovil={titulo} subtituloMovil="Gestión de contenido">
    <div className="admin-preguntas admin-formulario admin-formulario-categoria">
      <header className="admin-preguntas__encabezado"><div><h1>{titulo}</h1><p>Organizá las preguntas por categoría.</p></div><Link to={regreso}>Volver a categorías</Link></header>
      {cargando && <p role="status">Cargando categoría…</p>}
      {!cargando && errorCarga && <p className="admin-preguntas__estado" role="alert">{errorCarga}</p>}
      {!cargando && !errorCarga && rol !== 'ADMINISTRADOR' && !vistaPrevia && <p className="admin-preguntas__estado" role="alert">Solo los administradores pueden gestionar categorías.</p>}
      {!cargando && !errorCarga && (rol === 'ADMINISTRADOR' || vistaPrevia) && <form className="admin-formulario__panel" onSubmit={guardar} noValidate>
        <label>Nombre de la categoría<input value={datos.nombre} onChange={(evento) => establecerDatos({ ...datos, nombre: evento.target.value })} maxLength="100" /></label>
        {datosEjemplo && <label>Descripción (opcional)<textarea value={datos.descripcion || ''} onChange={(evento) => establecerDatos({ ...datos, descripcion: evento.target.value })} maxLength="300" rows="3" /></label>}
        <label>Estado<select value={datos.estado} onChange={(evento) => establecerDatos({ ...datos, estado: evento.target.value })}><option value="ACTIVA">Activa</option><option value="BORRADOR">Borrador</option></select></label>
        {errorFormulario && <p className="admin-formulario__error" role="alert">{errorFormulario}</p>}
        {datosEjemplo && <p className="admin-formulario__temporal">Datos de prueba: los cambios se pierden al recargar.</p>}
        <div className="admin-formulario__acciones"><Link to={regreso}>Cancelar</Link><button type="submit" disabled={guardando}>{guardando ? 'Guardando…' : idCategoria ? 'Guardar cambios' : 'Crear categoría'}</button></div>
      </form>}
    </div>
  </MarcoTorneo>
}
