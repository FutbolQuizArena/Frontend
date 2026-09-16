# FutbolQuiz Arena — Frontend

React con Vite. Implementación de registro y login en `feature/auth`.

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

## Autenticación

- `registrar(nombre, correo, contrasena)` realiza un `POST` real a `${VITE_API_URL}/api/auth/registro` con `{ nombre, email, password }`. Devuelve el cuerpo del `201` y conserva `{ code, message, detail }` en los errores del backend. No se envía la confirmación de contraseña.
- Registro valida nombre, formato de correo, contraseña de al menos 8 caracteres y coincidencia de contraseñas. El formulario muestra `message` ante un error y confirma el alta sin redirigir.
- `iniciarSesion(correo, contrasena)` es una Promise simulada con 450 ms de demora. La cuenta de prueba es **jugador@futbolquiz.com / FutbolQuiz123**. Devuelve exactamente `{ access_token, token_type: "bearer" }`; cualquier otra combinación rechaza con `{ code: "CREDENCIALES_INVALIDAS", message, detail: null }`, equivalente al cuerpo del `401`.
- El login simulado no consulta el backend ni guarda tokens, contraseñas o una sesión. Las cuentas creadas mediante registro real todavía no pueden iniciar sesión. El `TODO` del servicio señala dónde reemplazarlo cuando exista el endpoint.
- Durante cada solicitud se bloquea el formulario para evitar envíos duplicados. Los fallos de conexión, respuestas no JSON y esperas superiores a 60 segundos muestran un mensaje y permiten reintentar.

## Estructura y diseño

```text
src/
  componentes/     CampoEntrada, Boton y MarcoAutenticacion
  paginas/        PaginaRegistro y PaginaLogin
  servicios/      servicioAuth.js
  utilidades/     validacionesAutenticacion.js
  estilos/        estilos.css
  Aplicacion.jsx
  principal.jsx
```

Nombres propios del proyecto en español; las claves de la API, los atributos HTML y los nombres de dependencias conservan sus contratos externos. `CampoEntrada` y `Boton` son los componentes reutilizables de entrada y botón.

Convenciones verificadas contra `Equipo 5/Entregable 2/Convenciones de nombres.docx`, dentro del ZIP de documentación:

| Elemento del frontend | Convención | Ejemplo del repositorio |
| --- | --- | --- |
| Componentes | PascalCase | `PaginaRegistro.jsx` |
| Variables y funciones | camelCase | `manejarEnvio`, `validarInicioSesion` |
| Carpetas | kebab-case | `componentes/`, `utilidades/` |
| Archivos que no son componentes | camelCase | `validacionesAutenticacion.js`, `circuloCancha.svg` |

Se conservan `PaginaLogin.jsx`, `servicioAuth.js`, `/login` y `feature/auth` según lo acordado para esta funcionalidad. Los archivos estándar de herramientas (`package.json`, `package-lock.json`, `.gitignore`, `.env.example`, `index.html`) y el sufijo de pruebas `.spec.js` mantienen sus nombres técnicos. Las reglas de snake_case y los prefijos de booleanos del documento corresponden al backend, no a React.

En Git se usa `tipo/descripcion-corta` para ramas y Conventional Commits, por ejemplo: `feat: implementar registro y acceso de usuarios`. Los títulos de PR deben describir el cambio y referenciar la EDT/WBS: `[1.2.1, 1.2.2] Pantallas de registro e inicio de sesión`. El manejo real de JWT de la tarea 1.2.4 queda pendiente del endpoint de login.

El diseño sigue las pantallas de Figma: [acceso de escritorio](https://www.figma.com/design/XwL4F5K6AtKhvDBRQL315g/Futbol-quiz-arena?node-id=44-257), [registro de escritorio](https://www.figma.com/design/XwL4F5K6AtKhvDBRQL315g/Futbol-quiz-arena?node-id=44-318), [acceso móvil](https://www.figma.com/design/XwL4F5K6AtKhvDBRQL315g/Futbol-quiz-arena?node-id=55-2) y [registro móvil](https://www.figma.com/design/XwL4F5K6AtKhvDBRQL315g/Futbol-quiz-arena?node-id=55-27). La versión de escritorio usa el panel de cancha y la cabecera; hasta 900 px se adapta a la versión móvil con escudo FQ y formulario compacto. Inter y el SVG exportado de Figma están incluidos localmente.

Los recursos de la cancha y la pelota en `src/recursos/` se exportaron directamente de Figma para conservar su apariencia en distintos sistemas. La opción «Mantener sesión iniciada» del diseño queda deshabilitada hasta conectar el login real. El indicador de contraseña refleja el mínimo de 8 caracteres del contrato, sin presentar esa longitud como garantía de seguridad. Los errores y la confirmación amplían el formulario sin recortarse.

## Verificación

```powershell
npm run build
npx playwright install chromium
npm test
```

También se puede usar Chrome instalado: en PowerShell, ejecutar `$env:CANAL_NAVEGADOR = 'chrome'` antes de `npm test`.

Las pruebas de navegador usan un dominio ficticio e interceptan las peticiones para no crear usuarios en producción. Cubren validaciones, contrato JSON, alta sin redirección, mensajes 409/401, conexión fallida y reintento, respuesta no JSON, envíos duplicados, navegación y vista móvil. Guardan capturas de escritorio y celular en `test-results/` (ignorado por Git).

Para verificar manualmente el backend real, usar `/registro` con el servidor local y la configuración de `.env`; cada envío válido crea una cuenta real. El backend debe permitir por CORS el origen desde el que se sirva este frontend.
