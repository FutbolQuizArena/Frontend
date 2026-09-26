# FutbolQuiz Arena — Frontend

React con Vite. Registro, login, Home, edición de perfil, sesión JWT y módulo visual de torneos.

El recorrido de cambios y decisiones del proyecto está en [CHANGELOG.md](CHANGELOG.md).

El contrato del backend consultado para esta integración está resumido en [docs/swagger.md](docs/swagger.md), junto al enlace a Swagger y OpenAPI.

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

Después de iniciar sesión, se abre `/home`. Usa los frames de escritorio y móvil enlazados en `docs/figma.md`, con un único componente y CSS responsive. Reutiliza `Boton` y agrega `TarjetaModo` para Duelo y Administración.

Home consulta `GET /api/usuarios/me` para mostrar nombre, rol y puntaje reales. El acceso a Administración aparece solo cuando la respuesta indica `ADMINISTRADOR`. Ranking, posición y estadísticas de partidas todavía carecen de endpoint y siguen siendo datos de demostración o se muestran como no disponibles.

## Administración: preguntas — actividad 5.2.1

Abrir `/admin` con una sesión de administrador para consultar el listado de preguntas. Incluye búsqueda por enunciado, filtros por categoría y estado, y diseños de escritorio y móvil. La vista previa pagina de a cinco; la sesión real usa las páginas de seis elementos del backend. La pantalla consulta `GET /api/usuarios/me` para comprobar el rol antes de mostrar el contenido; el backend debe hacer la autorización definitiva.

Con una cuenta administradora real, el listado consulta una página por vez de `GET /api/admin/preguntas` con JWT. La búsqueda y los filtros se envían al backend; el frontend usa `total` y `total_paginas` para mostrar la paginación.

Desde el listado se puede abrir **Nueva pregunta** o elegir **Editar** en el menú de tres puntos. El formulario 5.2.2 permite escribir el enunciado, elegir categoría, cargar cuatro opciones distintas y marcar la correcta. Valida los campos antes de guardar. En una sesión real, usa `POST /api/admin/preguntas`, `GET/PATCH /api/admin/preguntas/{id}` y los identificadores de categoría del backend.

La actividad 5.2.3 agrega **Eliminar** al menú de cada fila. Muestra una confirmación y, al aceptar con sesión real, llama a `DELETE /api/admin/preguntas/{id}`.

La actividad 5.2.4 agrega `/admin/categorias`: listado y búsqueda de categorías, con acceso por rol y navegación desde Preguntas. En una sesión real usa `GET /api/admin/categorias`, incluidos estado y cantidad de preguntas. El listado toma como referencia las pantallas de categorías desktop y mobile de Figma.

La actividad 5.2.5 agrega `/admin/categorias/nueva` y `/admin/categorias/:idCategoria/editar`. En una sesión real usa `POST /api/admin/categorias` y `GET/PATCH /api/admin/categorias/{id}`. El backend no acepta descripción de categoría, por lo que ese campo se muestra solo en la vista previa local.

La actividad 5.2.6 agrega `/admin/usuarios`: listado y búsqueda de usuarios por nombre o correo, con filtros de rol y estado. Una sesión administradora real consulta `GET /api/admin/usuarios` con JWT Bearer; la cuenta admin local y `vistaPrevia=1` usan datos de ejemplo solo en desarrollo. El listado tiene paginación visual y estados de carga, error y vacío.

La actividad 5.2.7 agrega la acción de habilitar y deshabilitar usuarios con diálogo de confirmación accesible (`alertdialog`). En una sesión real conecta con `PATCH /api/admin/usuarios/{usuario_id}/estado` enviando `{ esta_habilitado: boolean }`. La interfaz contempla respuestas de error del backend (como evitar la deshabilitación de la propia cuenta de administrador) y en desarrollo actualiza el estado sobre los datos de ejemplo locales.

La actividad 5.2.8 protege todas las rutas `/admin` con una comprobación común del rol obtenido de `GET /api/usuarios/me`. Un jugador recibe un mensaje de acceso restringido antes de que se monte cualquier pantalla administrativa; el backend conserva la autorización definitiva. En desarrollo, `vistaPrevia=1` permite recorrer el panel con datos de ejemplo. La barra lateral y la navegación móvil permiten pasar entre preguntas, categorías y usuarios y volver al juego.

Para revisar el panel localmente sin una cuenta de administrador, iniciá sesión con cualquier cuenta y abrí `/admin?vistaPrevia=1` con `npm run dev`. Esta vista previa simula el rol solo en desarrollo y muestra un aviso; la compilación de producción conserva la comprobación del rol real.

También se puede iniciar sesión en desarrollo con `admin@futbolquiz.local` y contraseña `Admin1234!`. Es una cuenta simulada exclusiva de `npm run dev`: abre `/admin` sin contactar al backend y no sirve para operaciones reales. El listado y el formulario siguen usando datos temporales.

La barra lateral del juego muestra **Administración** solo cuando `GET /api/usuarios/me` devuelve el rol `ADMINISTRADOR`. El panel mantiene su navegación separada y permite volver al juego. Esto permite regresar al panel después de salir sin escribir la URL.

## Perfil

Abrir `/perfil` para consultar y editar el usuario autenticado. La pantalla muestra nombre y correo en escritorio y móvil; los campos de contraseña aparecen en escritorio. Usuario, biografía y avatar no se envían porque no forman parte del contrato actual.

`servicioPerfil.js` consulta `GET /api/usuarios/me` y guarda nombre, email y, si se ingresó, contraseña mediante `PATCH /api/usuarios/me`. Los errores muestran `message` del backend. También expone `cambiarContrasena()` para `PATCH /api/usuarios/me/password`.

Home y Perfil requieren iniciar sesión y muestran la acción «Cerrar sesión» tanto en escritorio como en celular.

## Listado de torneos — actividad 3.3.1

Abrir `/torneos` para consultar «Mis torneos», «Disponibles» y «Finalizados». La página adapta las tablas y grillas de escritorio a tarjetas móviles, mantiene la navegación inferior y enlaza con la creación existente en `/torneos/crear`.

`servicioTorneos.js` consulta el endpoint autenticado `GET /api/torneos` con los filtros `mios`, `disponibles` y `finalizados`. La pantalla contempla carga, error, lista vacía y resultados, y adapta el contrato `snake_case` del backend al modelo visual del frontend. El listado no informa todavía campeón, resultado individual ni cruces; esos datos se presentan como pendientes de detalle.

El acceso para unirse abre la pantalla de la actividad 3.3.3. Los detalles usan la pantalla de 3.3.4 y los torneos en curso o finalizados permiten consultar el cuadro implementado en la actividad 3.3.5.

## Creación de torneos — actividad 3.3.2

Abrir `/torneos/crear` para configurar un torneo con nombre, 4, 8 o 16 participantes y una contraseña opcional. La ruta es privada y conserva la navegación responsive de Home. Los frames de escritorio y móvil están enlazados en `docs/figma.md`.

`servicioTorneos.js` conecta `crearTorneo(datosTorneo)` con `POST /api/torneos`. Envía el token Bearer y el contrato `{ nombre, cantidad_participantes, contrasena_acceso }`; al recibir el `201`, abre `/torneos/:idTorneo/sala` con el ID real, donde se muestra el código de acceso. Los errores presentan el campo `message` devuelto por el backend y el formulario permanece en pantalla para permitir corregirlos.

## Ingreso a torneo — actividad 3.3.3

Abrir `/torneos/unirse` para ingresar un código de seis caracteres y una contraseña cuando el torneo sea privado. La ruta es protegida, normaliza el código a mayúsculas, evita envíos duplicados y conserva las composiciones desktop y mobile de Figma.

`servicioTorneos.js` conecta `unirseATorneo(codigo, contrasena)` con `POST /api/torneos/unirse` usando `{ codigo_acceso, contrasena }`. Al ingresar correctamente se muestra una confirmación y se abre `/torneos/:idTorneo/sala` con el ID devuelto por el backend.

La acción «Salir del torneo» usa `DELETE /api/torneos/{torneo_id}/salir` mientras el torneo espera jugadores. Si el usuario es el creador, se advierte que la salida cancela el torneo para todos antes de enviar la solicitud. Todas estas solicitudes pasan por `clienteApi.js`, que agrega el JWT, usa `VITE_API_URL` y conserva `code`, `message` y `detail` de los errores.

## Sala y detalle del torneo — actividad 3.3.4

Las rutas protegidas `/torneos/:idTorneo/sala` y `/torneos/:idTorneo` muestran la sala y el detalle del torneo. Ambas leen `idTorneo` desde la URL, contemplan carga, error y torneo inexistente, y adaptan los frames de Figma a escritorio y móvil con un único componente por pantalla.

La sala muestra código, cupos y participantes obtenidos de `GET /api/torneos/{torneo_id}` y actualiza esos datos cada 15 segundos mientras espera jugadores. Copiar usa la API del portapapeles y confirma el resultado. Cuando el estado real pasa a `EN_CURSO`, se habilita el acceso a `/torneos/:idTorneo/cuadro`.

El frame de Figma ilustra una sala con 6 de 8 participantes. Justo después de crear un torneo, el backend inscribe únicamente al creador: la sala muestra 1 participante y los cupos restantes, con nombres y código reales.

`obtenerSalaTorneo(idTorneo)` y `obtenerDetalleTorneo(idTorneo)` adaptan esa respuesta real. Las pruebas usan respuestas interceptadas con la forma de Swagger; los IDs de esas pruebas no son torneos de producción.

## Cuadro de llaves y torneo finalizado — actividad 3.3.5

La ruta protegida `/torneos/:idTorneo/cuadro` muestra las rondas, participantes, ganadores y campeón que devuelve `GET /api/torneos/{torneo_id}`. La lógica de las partidas sigue pendiente del módulo 2.

Cuando el torneo está finalizado, la misma ruta muestra el campeón, permite consultar el cuadro completo, compartir el resultado mediante la API nativa del navegador y volver al listado. El backend todavía no devuelve puntajes por partida, premio ni resumen personal; se muestran como pendientes o se omiten.

`obtenerCuadroTorneo(idTorneo)` adapta el campo `cuadro` del detalle real. Las pruebas simulan respuestas del backend para los estados en curso, finalizado y de error.

## Sesión JWT — actividad 1.2.5

`ProveedorSesion` restaura el token al iniciar la app y comparte el estado mediante `usarSesion()`. El login guarda el `access_token` real y redirige a `/home`. `servicioSesion.js` centraliza la lectura, guardado y eliminación del token bajo la clave `futbolquizToken`.

Por defecto, el token se guarda en `sessionStorage`: permanece al recargar y se elimina al cerrar la pestaña. Si se marca «Mantener sesión iniciada», se guarda en `localStorage` para recuperarlo al volver a abrir el navegador. No se almacenan contraseñas. Cerrar sesión elimina el token de ambos almacenamientos y vuelve a `/login`; el cierre de una sesión persistente se sincroniza con las otras pestañas abiertas.

Se descartan JWT malformados o vencidos al restaurar la sesión. Si el JWT contiene `exp`, también se cierra la sesión cuando vence mientras la app está abierta. Si no contiene `exp`, se mantiene hasta cerrar sesión o eliminarlo del almacenamiento. No hay renovación automática de tokens porque no se dispone de contrato de refresh. Decodificar el JWT en el navegador no verifica su firma: el backend debe validar el token y autorizar cada operación real.

`RutaProtegida` requiere sesión en `/home`, `/perfil`, `/partida-individual`, `/duelo`, todas las rutas de `/torneos`, `/ranking` y `/admin`. Sin sesión, redirige a `/login`. `RutaPublica` redirige a `/home` cuando alguien autenticado abre `/`, `/login` o `/registro`. `/admin` consulta el rol en `GET /api/usuarios/me`; las rutas administrativas del backend también exigen JWT y rol `ADMINISTRADOR`.

El usuario, perfil, sala, detalle y cuadro consultan endpoints reales. Ranking y estadísticas de juego no disponibles en `GET /api/usuarios/me` siguen pendientes. El cierre de sesión es local, sin revocación de JWT.

## Autenticación

- `registrar(nombre, correo, contrasena)` realiza un `POST` real a `${VITE_API_URL}/api/auth/registro` con `{ nombre, email, password }`. Devuelve el cuerpo del `201` y conserva `{ code, message, detail }` en los errores del backend. No se envía la confirmación de contraseña.
- Registro valida nombre, formato de correo, contraseña de al menos 8 caracteres y coincidencia de contraseñas. El formulario muestra `message` ante un error y confirma el alta sin redirigir.
- `iniciarSesion(correo, contrasena)` realiza un `POST` real a `${VITE_API_URL}/api/auth/login` con `{ email, password }`. Devuelve la respuesta `{ access_token, token_type: "bearer" }` y conserva el cuerpo de los errores del backend, incluido el `401` con código `CREDENCIALES_INVALIDAS`. El formulario muestra su campo `message`.
- Al verificar las credenciales de una cuenta registrada, el formulario guarda el JWT y redirige a `/home`. La cuenta administrativa de prueba descrita arriba está disponible solo en desarrollo.
- Durante cada solicitud se bloquea el formulario para evitar envíos duplicados. Los fallos de conexión, respuestas no JSON y esperas superiores a 60 segundos muestran un mensaje y permiten reintentar.

## Estructura y diseño

```text
src/
  componentes/     Campos, botones, tarjetas, MarcoAutenticacion, RutaProtegida y RutaPublica
  contextos/       ContextoSesion.jsx (ProveedorSesion y usarSesion)
  paginas/         PaginaRegistro, PaginaLogin, PaginaHome, PaginaPerfil y páginas de torneos
  servicios/       clienteApi.js, servicioAuth.js, servicioPerfil.js, servicioSesion.js y servicioTorneos.js
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

En Git se usa `tipo/descripcion-corta` para ramas y Conventional Commits, por ejemplo: `feat: implementar manejo de sesión JWT`. Los títulos de PR deben describir el cambio y referenciar la EDT/WBS: `[1.2.5] Manejo de sesión (JWT)`.

El diseño sigue las pantallas de Figma: [acceso de escritorio](https://www.figma.com/design/XwL4F5K6AtKhvDBRQL315g/Futbol-quiz-arena?node-id=44-257), [registro de escritorio](https://www.figma.com/design/XwL4F5K6AtKhvDBRQL315g/Futbol-quiz-arena?node-id=44-318), [acceso móvil](https://www.figma.com/design/XwL4F5K6AtKhvDBRQL315g/Futbol-quiz-arena?node-id=55-2) y [registro móvil](https://www.figma.com/design/XwL4F5K6AtKhvDBRQL315g/Futbol-quiz-arena?node-id=55-27). La versión de escritorio usa el panel de cancha y la cabecera; hasta 900 px se adapta a la versión móvil con escudo FQ y formulario compacto. Inter y el SVG exportado de Figma están incluidos localmente.

Los recursos de la cancha y la pelota en `src/recursos/` se exportaron directamente de Figma para conservar su apariencia en distintos sistemas. La opción «Mantener sesión iniciada» está habilitada en escritorio y celular. El indicador de contraseña refleja el mínimo de 8 caracteres del contrato, sin presentar esa longitud como garantía de seguridad. Los errores y la confirmación amplían el formulario sin recortarse.

## Verificación

```powershell
npm run build
npx playwright install chromium
npm test
```

También se puede usar Chrome instalado: en PowerShell, ejecutar `$env:CANAL_NAVEGADOR = 'chrome'` antes de `npm test`.

Las pruebas de navegador usan un dominio ficticio e interceptan las peticiones para no crear usuarios en producción. Cubren validaciones, contrato JSON, alta sin redirección, mensajes 409/401, conexión fallida y reintento, respuesta no JSON, envíos duplicados, navegación, vista móvil, login con redirección, persistencia, rutas privadas/públicas, tokens inválidos/vencidos y cierre de sesión. Los JWT de prueba son ficticios. Guardan capturas de escritorio y celular en `test-results/` (ignorado por Git).

Para verificar manualmente el backend real, usar `/login` con una cuenta registrada, el servidor local y la configuración de `.env`. También se puede usar `/registro`; cada envío válido crea una cuenta real. El backend debe permitir por CORS el origen desde el que se sirva este frontend.

Los ajustes visuales de administración usan las referencias desktop/mobile de Figma: navegación del panel, estados, formulario A–D y confirmación de borrado. Con un administrador real, ACTIVA/BORRADOR proviene del backend; en la vista previa son datos de ejemplo. La pantalla no ofrece todavía una acción rápida de publicación. Se mantienen cuatro opciones, una correcta y acceso por rol.
