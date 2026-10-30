/** Aplica la comprobación básica de formato y espacios del correo. */
export function esCorreoValido(correo) {
  const indiceArroba = correo.indexOf('@')
  if (indiceArroba <= 0 || indiceArroba !== correo.lastIndexOf('@') || indiceArroba === correo.length - 1) return false

  for (const caracter of correo) {
    if (caracter.trim() === '') return false
  }

  const dominio = correo.slice(indiceArroba + 1)
  const indicePunto = dominio.indexOf('.')
  return indicePunto > 0 && indicePunto < dominio.length - 1
}

/** Devuelve errores por campo para no enviar credenciales incompletas. */
export function validarInicioSesion({ correo, contrasena }) {
  const errores = {}

  if (!correo.trim()) {
    errores.correo = 'Ingresá tu correo electrónico.'
  } else if (!esCorreoValido(correo.trim())) {
    errores.correo = 'Ingresá un correo electrónico válido.'
  }

  if (!contrasena) {
    errores.contrasena = 'Ingresá tu contraseña.'
  }

  return errores
}

/** Reutiliza las reglas de ingreso y añade nombre y confirmación. */
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
