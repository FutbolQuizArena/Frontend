const perfilTemporal = {
  nombre: 'Lucas Agüero',
  usuario: 'lucas10',
  correo: 'lucas@futbolquiz.com',
  bio: 'Fanático del fútbol y los datos.',
  iniciales: 'LM',
  puntajeTotal: 2450,
}

function copiarPerfil() {
  return { ...perfilTemporal }
}

export function obtenerPerfil() {
  // TODO: reemplazar por GET con Authorization: Bearer cuando exista un endpoint de usuario actual/perfil.
  return Promise.resolve(copiarPerfil())
}

export function actualizarPerfil(datosPerfil) {
  // TODO: reemplazar por PATCH/PUT con Authorization: Bearer cuando exista el contrato del endpoint de perfil.
  Object.assign(perfilTemporal, datosPerfil, {
    iniciales: datosPerfil.nombre
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase())
      .join('') || perfilTemporal.iniciales,
  })

  return Promise.resolve(copiarPerfil())
}
