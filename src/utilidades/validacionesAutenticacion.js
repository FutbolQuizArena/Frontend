export function validarInicioSesion({ correo, contrasena }) {
  const errores = {}

  if (!correo.trim()) {
    errores.correo = 'Ingresá tu correo electrónico.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) {
    errores.correo = 'Ingresá un correo electrónico válido.'
  }

  if (!contrasena) {
    errores.contrasena = 'Ingresá tu contraseña.'
  }

  return errores
}

export function validarRegistro(datos) {
  const errores = validarInicioSesion(datos)

  if (!datos.nombre.trim()) {
    errores.nombre = 'Ingresá tu nombre.'
  }

  if (datos.contrasena && datos.contrasena.length < 8) {
    errores.contrasena = 'La contraseña debe tener al menos 8 caracteres.'
  }

  if (!datos.confirmacionContrasena) {
    errores.confirmacionContrasena = 'Confirmá tu contraseña.'
  } else if (datos.confirmacionContrasena !== datos.contrasena) {
    errores.confirmacionContrasena = 'Las contraseñas no coinciden.'
  }

  return errores
}
