# FutbolQuiz Arena — Frontend

React con Vite. Registro, login, Home y edición de perfil.

## Desarrollo local

Requiere Node.js 22.12 o superior y npm.

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

En macOS/Linux, usar `cp .env.example .env`. La URL pública del backend se configura en `.env`:

```dotenv
VITE_API_URL=https://futbolquiz-backend.onrender.com
```

Usar la URL base, sin `/api`. Vite lee esta variable al iniciar o compilar: reiniciar el servidor después de cambiarla. En despliegues, definirla antes de ejecutar `npm run build`. Las variables `VITE_` son públicas; no colocar secretos en ellas.

Rutas: `/registro`, `/login` e inicio `/` (login). El alojamiento debe resolver las rutas del frontend hacia `index.html` para permitir recargas y enlaces directos.

## Home

Abrir `/home` para ver la pantalla de inicio. Usa los frames de escritorio y móvil enlazados en `docs/figma.md`, con un único componente y CSS responsive. Reutiliza `Boton` y agrega `TarjetaModo` para Duelo y Administración.

Los datos de usuario, rendimiento, ranking y torneos son de demostración, definidos en `PaginaHome.jsx`. El acceso a Administración aparece solo si la propiedad `usuario.rol` es `ADMINISTRADOR`; esto solo controla su visibilidad, no implementa autorización. Las rutas `/partida-individual`, `/duelo`, `/torneos`, `/ranking` y `/admin` muestran pantallas pendientes, con un enlace para volver.

## Perfil

Abrir `/perfil` para editar los datos temporales del usuario. La pantalla sigue los frames de escritorio y móvil: en escritorio muestra nombre, correo y campos de contraseña; en móvil muestra nombre, usuario, correo y bio.

`servicioPerfil.js` ofrece `obtenerPerfil()` y `actualizarPerfil(datosPerfil)` como mocks locales. Ambos incluyen un `TODO` para conectar el endpoint autenticado cuando se implemente JWT; los cambios no se envían al backend ni persisten al recargar la página.

El login conserva su comportamiento actual: todavía no redirige a la Home ni mantiene la sesión. Para revisar la Home, entrar directamente a `/home`. No se modificaron los formularios ni el servicio de autenticación.

## Autenticación

- `registrar(nombre, correo, contrasena)` realiza un `POST` real a `${VITE_API_URL}/api/auth/registro` con `{ nombre, email, password }`. Devuelve el cuerpo del `201` y conserva `{ code, message, detail }` en los errores del backend. No se envía la confirmación de contraseña.
- Registro valida nombre, formato de correo, contraseña de al menos 8 caracteres y coincidencia de contraseñas. El formulario muestra `message` ante un error y confirma el alta sin redirigir.
- `iniciarSesion(correo, contrasena)` realiza un `POST` real a `${VITE_API_URL}/api/auth/login` con `{ email, password }`. Devuelve la respuesta `{ access_token, token_type: "bearer" }` y conserva el cuerpo de los errores del backend, incluido el `401` con código `CREDENCIALES_INVALIDAS`. El formulario muestra su campo `message`.
- El formulario permite verificar las credenciales de una cuenta registrada y muestra confirmación sin redirigir. Todavía no guarda el token ni mantiene una sesión: la persistencia, el cierre de sesión y las rutas protegidas corresponden a la tarea 1.2.5. No existe una cuenta de prueba incorporada.
- Durante cada solicitud se bloquea el formulario para evitar envíos duplicados. Los fallos de conexión, respuestas no JSON y esperas superiores a 60 segundos muestran un mensaje y permiten reintentar.

## Estructura y diseño

```text
src/
  componentes/     CampoEntrada, CampoTexto, Boton y MarcoAutenticacion
  paginas/         PaginaRegistro, PaginaLogin, PaginaHome y PaginaPerfil
  servicios/       servicioAuth.js y servicioPerfil.js
  utilidades/     validacionesAutenticacion.js
  estilos/        estilos.css
  Aplicacion.jsx
  principal.jsx
```

Nombres propios del proyecto en español; las claves de la API, los atributos HTML y los nombres de dependencias conservan sus contratos externos. `CampoEntrada` y `Boton` son los componentes reutilizables de entrada y botón.

Convenciones verificadas contra `Equipo 5/Entregable 2/Convenciones de nombres.docx`, dentro del ZIP de documentación:

| Elemento del frontend | Convención | Ejemplo del repositorio |
| --- | --- | --- |
| Componentes | PascalCase | `PaginaRegistro.jsx`, `PaginaPerfil.jsx` |
| Variables y funciones | camelCase | `manejarEnvio`, `validarInicioSesion` |
| Carpetas | kebab-case | `componentes/`, `utilidades/` |
| Archivos que no son componentes | camelCase | `validacionesAutenticacion.js`, `circuloCancha.svg` |

Se conservan `PaginaLogin.jsx`, `servicioAuth.js`, `/login` y `feature/auth` según lo acordado para esta funcionalidad. Los archivos estándar de herramientas (`package.json`, `package-lock.json`, `.gitignore`, `.env.example`, `index.html`) y el sufijo de pruebas `.spec.js` mantienen sus nombres técnicos. Las reglas de snake_case y los prefijos de booleanos del documento corresponden al backend, no a React.

En Git se usa `tipo/descripcion-corta` para ramas y Conventional Commits, por ejemplo: `feat: implementar registro y acceso de usuarios`. Los títulos de PR deben describir el cambio y referenciar la EDT/WBS: `[1.2.1, 1.2.2] Pantallas de registro e inicio de sesión`. El endpoint de login ya está conectado; queda pendiente implementar el manejo de sesión JWT de la tarea 1.2.5.

El diseño sigue las pantallas de Figma: [acceso de escritorio](https://www.figma.com/design/XwL4F5K6AtKhvDBRQL315g/Futbol-quiz-arena?node-id=44-257), [registro de escritorio](https://www.figma.com/design/XwL4F5K6AtKhvDBRQL315g/Futbol-quiz-arena?node-id=44-318), [acceso móvil](https://www.figma.com/design/XwL4F5K6AtKhvDBRQL315g/Futbol-quiz-arena?node-id=55-2) y [registro móvil](https://www.figma.com/design/XwL4F5K6AtKhvDBRQL315g/Futbol-quiz-arena?node-id=55-27). La versión de escritorio usa el panel de cancha y la cabecera; hasta 900 px se adapta a la versión móvil con escudo FQ y formulario compacto. Inter y el SVG exportado de Figma están incluidos localmente.

Los recursos de la cancha y la pelota en `src/recursos/` se exportaron directamente de Figma para conservar su apariencia en distintos sistemas. La opción «Mantener sesión iniciada» del diseño queda deshabilitada hasta implementar la persistencia de sesión. El indicador de contraseña refleja el mínimo de 8 caracteres del contrato, sin presentar esa longitud como garantía de seguridad. Los errores y la confirmación amplían el formulario sin recortarse.

## Verificación

```powershell
npm run build
npx playwright install chromium
npm test
```

También se puede usar Chrome instalado: en PowerShell, ejecutar `$env:CANAL_NAVEGADOR = 'chrome'` antes de `npm test`.

Las pruebas de navegador usan un dominio ficticio e interceptan las peticiones para no crear usuarios en producción. Cubren validaciones, contrato JSON, alta sin redirección, mensajes 409/401, conexión fallida y reintento, respuesta no JSON, envíos duplicados, navegación y vista móvil. Guardan capturas de escritorio y celular en `test-results/` (ignorado por Git).

Para verificar manualmente el backend real, usar `/login` con una cuenta registrada, el servidor local y la configuración de `.env`. También se puede usar `/registro`; cada envío válido crea una cuenta real. El backend debe permitir por CORS el origen desde el que se sirva este frontend.
