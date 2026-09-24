# FutbolQuiz Arena — Frontend

React con Vite. Registro, login, Home, edición de perfil, sesión JWT y módulo visual de torneos.

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

Los datos de usuario, rendimiento y ranking son de demostración, definidos en `PaginaHome.jsx`. El acceso a Administración aparece solo si la propiedad `usuario.rol` es `ADMINISTRADOR`; esto solo controla su visibilidad, no implementa autorización. Las rutas `/partida-individual`, `/duelo`, `/ranking` y `/admin` muestran pantallas pendientes, con un enlace para volver.

## Perfil

Abrir `/perfil` para editar los datos temporales del usuario. La pantalla sigue los frames de escritorio y móvil: en escritorio muestra nombre, correo y campos de contraseña; en móvil muestra nombre, usuario, correo y bio.

`servicioPerfil.js` ofrece `obtenerPerfil()` y `actualizarPerfil(datosPerfil)` como mocks locales. Ambos incluyen un `TODO` para conectar el endpoint autenticado cuando exista su contrato; los cambios no se envían al backend ni persisten al recargar la página.

Home y Perfil requieren iniciar sesión y muestran la acción «Cerrar sesión» tanto en escritorio como en celular.

## Listado de torneos — actividad 3.3.1

Abrir `/torneos` para consultar «Mis torneos», «Disponibles» y «Finalizados». La página adapta las tablas y grillas de escritorio a tarjetas móviles, mantiene la navegación inferior y enlaza con la creación existente en `/torneos/crear`.

`servicioTorneos.js` ofrece temporalmente `obtenerMisTorneos()`, `obtenerTorneosDisponibles()` y `obtenerTorneosFinalizados()` con datos mock. La pantalla contempla carga, error, lista vacía y resultados. Estos métodos tienen un `TODO` para reemplazarlos cuando el backend publique el contrato real, sin inventar rutas ni nombres de campos.

El acceso para unirse abre la pantalla de la actividad 3.3.3. Los detalles usan la pantalla de 3.3.4 y los torneos en curso o finalizados permiten consultar el cuadro implementado en la actividad 3.3.5.

## Creación de torneos — actividad 3.3.2

Abrir `/torneos/crear` para configurar un torneo con nombre, 4, 8 o 16 participantes y una contraseña opcional. La ruta es privada y conserva la navegación responsive de Home. Los frames de escritorio y móvil están enlazados en `docs/figma.md`.

`servicioTorneos.js` ofrece temporalmente `crearTorneo(datosTorneo)` como mock local. Genera un código temporal y permite comprobar el manejo de errores intentando crear dos veces un torneo con el mismo nombre. El formulario permanece en la pantalla después de confirmar la creación.

La llamada HTTP queda pendiente hasta que el backend publique el contrato definitivo de creación de torneos. El servicio contiene el `TODO` para reemplazar el mock; no se inventan todavía una URL ni nombres de campos del endpoint.

## Ingreso a torneo — actividad 3.3.3

Abrir `/torneos/unirse` para ingresar un código de seis caracteres y una contraseña cuando el torneo sea privado. La ruta es protegida, normaliza el código a mayúsculas, evita envíos duplicados y conserva las composiciones desktop y mobile de Figma.

`servicioTorneos.js` ofrece temporalmente `unirseATorneo(codigo, contrasena)` como mock. Se puede probar `LIGA24` sin contraseña, `FQA8K2` con la contraseña `cancha`, `LLENO8` para un torneo completo e `INSCR1` para un usuario ya registrado. Cualquier otro código devuelve el error de torneo inexistente.

Al ingresar correctamente se muestra una confirmación y se abre `/torneos/:idTorneo/sala`. La integración HTTP sigue pendiente hasta que el backend publique su contrato definitivo.

## Sala y detalle del torneo — actividad 3.3.4

Las rutas protegidas `/torneos/:idTorneo/sala` y `/torneos/:idTorneo` muestran la sala y el detalle del torneo. Ambas leen `idTorneo` desde la URL, contemplan carga, error y torneo inexistente, y adaptan los frames de Figma a escritorio y móvil con un único componente por pantalla.

La sala muestra código, cupos y participantes. Copiar usa la API del portapapeles y confirma el resultado. Al completar el cupo, el mock refleja el flujo definido en el alcance: el torneo pasa a estar en curso, los cruces se generan automáticamente y se habilita el acceso a `/torneos/:idTorneo/cuadro`.

`servicioTorneos.js` mantiene mocks para `obtenerSalaTorneo(idTorneo)` y `obtenerDetalleTorneo(idTorneo)`. IDs temporales para probarlos:

- `5`: sala en espera con el usuario como participante y detalle en espera.
- `14`: sala en espera con el usuario como organizador; faltan dos participantes.
- `16`: sala en espera con el usuario como participante; faltan cuatro participantes.
- `17`: sala completa y en curso, con cruces generados automáticamente.
- `1`: detalle de torneo en curso.
- `9`: detalle de torneo finalizado.
- `404` o cualquier ID no definido: torneo inexistente.
- `500`: error de carga simulado.

Estos datos no se envían al backend. Los métodos conservan el `TODO` de integración y no definen URLs ni contratos HTTP todavía.

## Cuadro de llaves y torneo finalizado — actividad 3.3.5

La ruta protegida `/torneos/:idTorneo/cuadro` muestra el cuadro completo de eliminación directa, la ronda actual, el próximo partido, los resultados de cada cruce y el campeón. En celular prioriza el camino hacia la final y conserva el acceso temporal a `/duelo`; la lógica de la partida sigue pendiente del módulo 2.

Cuando el torneo está finalizado, la misma ruta muestra el campeón, el premio y el resumen del usuario. Desde allí se puede consultar el cuadro completo, compartir el resultado mediante la API nativa del navegador y volver al listado de torneos.

`servicioTorneos.js` ofrece temporalmente `obtenerCuadroTorneo(idTorneo)` con datos mock. IDs para probar la pantalla:

- `1`: torneo en curso, actualmente en semifinales.
- `17`: torneo en curso cuyo cupo ya se completó y cuyos cruces se generaron automáticamente.
- `9`: torneo finalizado con campeón y resumen de participación.
- `404` o cualquier ID no definido: torneo inexistente.
- `500`: error de carga simulado.

El backend todavía no publica el contrato de estado, participantes y cruces. El método conserva un `TODO` explícito y no inventa una URL HTTP; los datos se reemplazarán cuando esté disponible el endpoint de la actividad 3.2.3.

## Sesión JWT — actividad 1.2.5

`ProveedorSesion` restaura el token al iniciar la app y comparte el estado mediante `usarSesion()`. El login guarda el `access_token` real y redirige a `/home`. `servicioSesion.js` centraliza la lectura, guardado y eliminación del token bajo la clave `futbolquizToken`.

Por defecto, el token se guarda en `sessionStorage`: permanece al recargar y se elimina al cerrar la pestaña. Si se marca «Mantener sesión iniciada», se guarda en `localStorage` para recuperarlo al volver a abrir el navegador. No se almacenan contraseñas. Cerrar sesión elimina el token de ambos almacenamientos y vuelve a `/login`; el cierre de una sesión persistente se sincroniza con las otras pestañas abiertas.

Se descartan JWT malformados o vencidos al restaurar la sesión. Si el JWT contiene `exp`, también se cierra la sesión cuando vence mientras la app está abierta. Si no contiene `exp`, se mantiene hasta cerrar sesión o eliminarlo del almacenamiento. No hay renovación automática de tokens porque no se dispone de contrato de refresh. Decodificar el JWT en el navegador no verifica su firma: el backend debe validar el token y autorizar cada operación real.

`RutaProtegida` requiere sesión en `/home`, `/perfil`, `/partida-individual`, `/duelo`, todas las rutas de `/torneos`, `/ranking` y `/admin`. Sin sesión, redirige a `/login`. `RutaPublica` redirige a `/home` cuando alguien autenticado abre `/`, `/login` o `/registro`. `/admin` sigue siendo un placeholder que requiere sesión; los permisos reales de administrador quedan pendientes del contrato de roles.

Los datos del usuario y las estadísticas de Home, ranking y torneos siguen siendo demostraciones. Perfil sigue usando su servicio mock. No se infieren datos o roles de claims sin contrato de usuario actual; los `TODO` indican dónde conectar los endpoints cuando estén disponibles. El cierre de sesión es local, sin endpoint de revocación.

## Autenticación

- `registrar(nombre, correo, contrasena)` realiza un `POST` real a `${VITE_API_URL}/api/auth/registro` con `{ nombre, email, password }`. Devuelve el cuerpo del `201` y conserva `{ code, message, detail }` en los errores del backend. No se envía la confirmación de contraseña.
- Registro valida nombre, formato de correo, contraseña de al menos 8 caracteres y coincidencia de contraseñas. El formulario muestra `message` ante un error y confirma el alta sin redirigir.
- `iniciarSesion(correo, contrasena)` realiza un `POST` real a `${VITE_API_URL}/api/auth/login` con `{ email, password }`. Devuelve la respuesta `{ access_token, token_type: "bearer" }` y conserva el cuerpo de los errores del backend, incluido el `401` con código `CREDENCIALES_INVALIDAS`. El formulario muestra su campo `message`.
- Al verificar las credenciales de una cuenta registrada, el formulario guarda el JWT y redirige a `/home`. No existe una cuenta de prueba incorporada.
- Durante cada solicitud se bloquea el formulario para evitar envíos duplicados. Los fallos de conexión, respuestas no JSON y esperas superiores a 60 segundos muestran un mensaje y permiten reintentar.

## Estructura y diseño

```text
src/
  componentes/     Campos, botones, tarjetas, MarcoAutenticacion, RutaProtegida y RutaPublica
  contextos/       ContextoSesion.jsx (ProveedorSesion y usarSesion)
  paginas/         PaginaRegistro, PaginaLogin, PaginaHome, PaginaPerfil y páginas de torneos
  servicios/       servicioAuth.js, servicioPerfil.js, servicioSesion.js y servicioTorneos.js
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
