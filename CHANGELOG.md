# Changelog

Historial del **frontend** de FutbolQuiz Arena, reconstruido a partir de los commits de `develop`, la rama actual, el código y las decisiones de esta conversación. Las entradas están ordenadas de la más reciente a la más antigua, como el changelog del backend. La fecha corresponde a los commits; una funcionalidad descrita como temporal todavía no persiste en el servidor. Estado revisado el 25/09/2026.

## 25/9 [5.2.6] Listado y búsqueda de usuarios (Módulo 5 - Administración)

Implementación en `feature/admin-usuarios-listado`, pendiente de commit y PR.

- **Capa de presentación:** `PaginaUsuariosAdmin.jsx` agrega `/admin/usuarios` al panel con búsqueda por nombre o correo, filtros de rol y estado, paginación visual, estados de carga/error/vacío y adaptación a celular. La barra lateral y las pestañas de administración incluyen el acceso a Usuarios.
- **Capa de servicios:** `servicioUsuariosAdmin.js` consulta `GET /api/admin/usuarios` con los parámetros `buscar`, `rol` y `esta_habilitado`, usando el JWT Bearer del cliente común. La respuesta es un array de usuarios, tal como publica el OpenAPI del backend desplegado.
- **Desarrollo local:** la cuenta admin simulada y `vistaPrevia=1` usan registros claramente identificados como ejemplos; las sesiones administrativas reales usan el backend. Una cuenta de jugador no solicita el listado administrativo.
- **Documentación y pruebas:** `docs/swagger.md` registra la URL de Swagger y los contratos relevantes. `pruebas/usuariosAdmin.spec.js` cubre consultas, filtros, autorización, vista previa y ancho móvil.

## 25/9 [5.2.5] Formularios de creación y edición de categorías (Módulo 5 - Administración)

Commit local `2c77fc7` en `feature/admin-categorias-formulario`; todavía no consta un merge a `develop`.

- **Capa de presentación:** creación de `PaginaFormularioCategoriaAdmin.jsx` y de las rutas `/admin/categorias/nueva` y `/admin/categorias/:idCategoria/editar` en `Aplicacion.jsx`. El listado ofrece «Nueva categoría» y un enlace «Editar» por fila, conservando `vistaPrevia=1` durante la navegación local.
- **Formulario y reglas:** nombre obligatorio, descripción opcional y estado `ACTIVA`/`BORRADOR`. Se rechazan los nombres vacíos y duplicados sin distinguir mayúsculas y minúsculas; se muestran los errores en la pantalla. Guardar vuelve al listado con un aviso; cancelar vuelve sin cambios.
- **Capa de servicios:** `servicioCategoriasAdmin.js` permite consultar una categoría, crearla y actualizarla en memoria. Al renombrarla, `servicioPreguntasAdmin.js` actualiza la categoría de las preguntas temporales asociadas para conservar su conteo y poder filtrarlas por el nombre nuevo. Las categorías activas nuevas aparecen en el selector del formulario de preguntas; al editar una pregunta se conserva la categoría ya asignada aunque esté en borrador.
- **Seguridad y alcance:** el formulario comprueba el rol `ADMINISTRADOR` con el mismo mecanismo que las otras pantallas; la vista previa está limitada al desarrollo. El guardado es temporal y se pierde al recargar: el frontend aún no usa los endpoints administrativos de categorías.
- **Testing automatizado:** `pruebas/formularioCategoriaAdmin.spec.js` cubre creación, disponibilidad en preguntas, rechazo de duplicados, cambio de nombre con preguntas asociadas y bloqueo a jugadores. También se verificaron las pruebas existentes de categorías y preguntas, el build de Vite y el ancho móvil.

## 25/9 [5.2.1–5.2.4, 6.1] Ajustes visuales de administración

PR #19, merge `d00147d`.

- **Diseño compartido:** `MarcoTorneo.jsx` incorpora la presentación del panel administrador; `estilosMarcoAdmin.css` adapta barra lateral, cabecera y navegación móvil. Las pantallas usan esa base en escritorio y celular.
- **Banco de preguntas:** filtro visual por estado, columna de estado, acciones bajo el menú de tres puntos y paginación. Las opciones del formulario se identifican como A–D y la respuesta correcta puede seleccionarse. El diálogo de eliminación usa `dialog` con foco y navegación de teclado.
- **Categorías:** el listado comparte la estética del panel y conserva búsqueda, conteo y estados de ejemplo.
- **Pruebas y documentación:** se ajustaron las pruebas de administración a los controles visibles y se actualizó el README. La revisión funcional del ZIP mantuvo cuatro opciones y una sola correcta; los valores de Figma sirven como ejemplo visual, no como resultados reales.

## 25/9 [5.2.4, 6.1] Listado y búsqueda de categorías

PR #18, merge `0e08f4b`; implementación `6158806`.

- **Capa de presentación:** `PaginaCategoriasAdmin.jsx` agrega `/admin/categorias`, búsqueda por nombre, cantidad de preguntas y estado por categoría, con lista de escritorio y tarjetas móviles. `NavegacionAdmin.jsx` permite alternar entre Preguntas y Categorías.
- **Capa de servicios:** `servicioCategoriasAdmin.js` contiene categorías temporales y calcula su cantidad de preguntas desde `servicioPreguntasAdmin.js`; no consulta todavía el backend administrativo.
- **Control de acceso y estados:** la página consulta el usuario autenticado para mostrar contenido solo al administrador; contempla carga, error, reintento y lista vacía.
- **Testing automatizado:** `pruebas/categoriasAdmin.spec.js` cubre búsqueda, resultado vacío, navegación, acceso denegado a jugadores y ausencia de desbordamiento móvil.

## 25/9 [5.2.3, 6.1] Eliminación de preguntas y administrador local de prueba

PR #17, merge `9a5e65a`; commits `83799d4` y `2abadce`.

- **Interacción de eliminación:** la acción muestra la pregunta concreta en una confirmación; cancelar conserva el listado y confirmar la retira de los datos temporales. La operación real queda pendiente de integración con la API.
- **Cuenta local de desarrollo:** se agregó una sesión administrativa simulada, disponible únicamente con `npm run dev`, para recorrer las pantallas sin necesitar una cuenta administradora del backend. No autoriza solicitudes reales.
- **Pruebas:** `pruebas/eliminarPreguntaAdmin.spec.js` valida cancelar, confirmar y el foco de teclado; `pruebas/adminPrueba.spec.js` verifica el acceso local.

## 25/9 [5.2.2] Formulario de creación y edición de preguntas

Implementación `2d2edce`. El commit histórico de merge `f893797` contiene literalmente `PR #N`; el número de PR no quedó escrito correctamente en ese mensaje.

- **Capa de presentación:** `PaginaFormularioPreguntaAdmin.jsx` agrega rutas de alta y edición protegidas. Permite escribir enunciado, elegir categoría, cargar cuatro opciones y marcar una correcta.
- **Validación:** comprueba campos obligatorios, cuatro respuestas no vacías y diferentes, y una sola respuesta correcta. Muestra errores sin salir del formulario.
- **Capa de servicios:** `servicioPreguntasAdmin.js` crea y actualiza preguntas en memoria; los cambios se ven al volver al listado durante la misma sesión de la página y desaparecen al recargar.
- **Testing:** `pruebas/formularioPreguntaAdmin.spec.js` recorre alta, edición, validación y rechazo a jugadores.

## 24/9 [5.2.1, 6.1] Listado de preguntas administrativas

PR #15, merge `849c40e`; implementación `38ad5e4` y vista previa `15c9a37`.

- **Capa de presentación:** `PaginaPreguntasAdmin.jsx` crea `/admin` con listado, búsqueda por enunciado, filtro por categoría, paginación, carga, error, reintento y estado sin resultados. La tabla se adapta a tarjetas móviles.
- **Capa de servicios y datos:** `servicioPreguntasAdmin.js` aporta un banco temporal con categoría, dificultad, cuatro opciones, respuesta correcta y estado. No es una copia de la base de datos.
- **Control de acceso:** la pantalla consulta `GET /api/usuarios/me` para verificar el rol; el parámetro `vistaPrevia=1` funciona solo durante desarrollo. La autorización definitiva de las operaciones administrativas corresponde al backend.
- **Testing:** `pruebas/preguntasAdmin.spec.js` verifica rol, búsqueda, filtros, paginación y diseño móvil.

## 24–25/9 [Módulo 2] Ruleta, partida individual, modos de juego y duelos

Funcionalidades integradas a `develop` mediante merges de ramas de juego y los commits `7005978`, `20b9584`, `0966ba3`, `5918ee6`, `e6443d2`, `0e90e84` y ajustes posteriores.

- **Ruleta y modo individual:** pantallas para selección de categoría, preguntas, respuesta y resultado. `servicioPartidas.js` contiene la comunicación de partida individual y resultado; `pruebas/ruletaCategorias.spec.js`, `partidaIndividual.spec.js` y `resultadoIndividual.spec.js` cubren los recorridos relevantes.
- **Selección de modo:** vista para elegir modalidad de juego; el servicio `servicioModosJuego.js` se adaptó al backend en `10cae64`.
- **Duelo en línea y local:** espera de rival, partida, resultado y flujo local por turnos. `servicioDuelos.js` y `servicioDuelosLocales.js` coordinan llamadas y estados; hay pruebas separadas de duelo, resultado y modalidad local.
- **Ajustes de integración:** los commits `cc9edc0`, `020920f`, `ab3ce0c`, `87fa8df`, `4fd3cad`, `ec046be` y `a566886` adaptaron resultados, ruleta, duelo y partidas a contratos del backend. Este changelog registra esas integraciones sin afirmar que todas las variantes del módulo 2 estén validadas manualmente.

## 24/9 [3.3.1, 3.3.4, 6.1] Acceso correcto a la sala desde Mis torneos

PR #14, merge `512c35b`.

- **Navegación por torneo:** cada fila usa el ID de su torneo. La acción de un torneo propio en espera abre su sala; se evita que un botón global o una acción de otro torneo dirija al cuadro equivocado.
- **Creación:** después de crear, el usuario llega a la sala del torneo recién creado. La sala muestra al creador y los cupos restantes con los datos obtenidos del backend.
- **Pruebas:** `pruebas/torneos.spec.js` comprueba acciones por fila y su versión móvil; `pruebas/crearTorneo.spec.js` comprueba el flujo de creación.

## 24/9 [1.2.3, 1.2.4, 3.3.4, 3.3.5, 6.1] Sala, cuadro y perfil con datos del backend

PR #13, merge `118bd0d`; commits `0984115` y `e021c16`.

- **Torneos:** `servicioTorneos.js` usa `GET /api/torneos/{id}` para sala, detalle y cuadro. Al unirse se abre la sala del ID recibido; la sala muestra participantes reales y consulta periódicamente mientras espera. El cuadro lee cruces, rondas y ganador del contrato publicado.
- **Salida:** «Salir del torneo» llama `DELETE /api/torneos/{id}/salir` y muestra los errores recibidos; la acción del creador advierte que puede cancelar el torneo.
- **Usuario y perfil:** Home y Perfil consultan `GET /api/usuarios/me`. El perfil guarda mediante `PATCH /api/usuarios/me` y contempla cambio de contraseña con `PATCH /api/usuarios/me/password`.
- **Límite de datos:** el detalle del backend no suministraba puntajes por partida, premio ni resumen personal para este flujo; la interfaz no los inventa como resultados reales. `pruebas/salaTorneo.spec.js`, `detalleTorneo.spec.js`, `cuadroTorneo.spec.js`, `perfil.spec.js` e `inicio.spec.js` usan respuestas interceptadas para comprobar la integración.

## 24/9 [3.3.1–3.3.3, 6.1] Integración de creación, listado e ingreso a torneos

PR #12, merge `224d64f`; implementación `c08483b`.

- **Cliente de API:** `clienteApi.js` agrega URL base, JWT Bearer y normaliza errores del backend. `VITE_API_URL` apunta a la URL base, sin `/api`.
- **Operaciones reales:** `servicioTorneos.js` conecta `POST /api/torneos`, `GET /api/torneos?filtro=mios|disponibles|finalizados` y `POST /api/torneos/unirse`. La creación envía nombre, cupo de 4/8/16 y contraseña opcional; el ingreso envía código y contraseña si corresponde.
- **Presentación:** las pantallas muestran datos recibidos, estados de carga y errores. El listado mantiene los tres filtros y separa torneos propios, disponibles y finalizados. Las pruebas de creación, listado e ingreso verifican el contrato enviado y la navegación.

## 24/9 [3.3.5, 6.1] Cuadro de llaves y torneo finalizado

PR #11, merge `09ecdf7`; implementación `2fe5cf9`.

- **Pantallas y componentes:** `PaginaCuadroTorneo.jsx`, `CruceTorneo.jsx` y estilos asociados representan rondas, emparejamientos, avance y campeón para cupos de 4, 8 y 16. La misma ruta muestra el estado finalizado cuando el torneo termina.
- **Integración progresiva:** el cuadro comenzó con datos temporales y después pasó al detalle real de torneo en el PR #13. El inicio y los resultados de las partidas dependen de las operaciones del módulo 2.
- **Testing:** `pruebas/cuadroTorneo.spec.js` cubre estados y representación de rondas.

## 23/9 [3.3.4, 6.1] Sala, detalle y generación automática de cruces

PR #9, merge `3d3b49a`, y PR #10, merge `c9f21ea`; implementaciones `0d32e12` y `b4eb5da`.

- **Rutas protegidas:** `/torneos/:idTorneo/sala` y `/torneos/:idTorneo` presentan código de acceso, creador, participantes, cupos y estado. El botón de copia usa el portapapeles y confirma el resultado.
- **Modelo visual:** la sala contempla espera y cupo completo para 4, 8 y 16 jugadores; muestra carga, errores e ID inexistente. Los nombres y cantidades del prototipo de Figma eran ejemplos.
- **Corrección de flujo:** el backend genera cruces automáticamente al llenarse el cupo. La interfaz dejó de presentar una acción manual de inicio y se alineó con la transición a `EN_CURSO`.
- **Testing:** `pruebas/salaTorneo.spec.js` y `detalleTorneo.spec.js` ejercitan estados y navegación.

## 23/9 [3.3.3, 6.1] Ingreso a torneo por código

PR #7, merge `df3c39c`; implementación `4150bc1`.

- **Formulario:** `PaginaUnirseTorneo.jsx` permite ingresar código de seis caracteres, lo normaliza a mayúsculas y contempla contraseña para torneos privados. Evita envíos duplicados y muestra mensajes de error.
- **Navegación:** al recibir una respuesta válida dirige al detalle o a la sala correspondiente según el flujo posteriormente integrado. `pruebas/unirseTorneo.spec.js` cubre validaciones, errores y diseño móvil.

## 23/9 [3.3.1, 6.1] Pantalla principal y listado de torneos

PR #6, merge `3fbd91b`; implementación `ecd72d3`.

- **Presentación:** `PaginaTorneos.jsx` crea las vistas «Mis torneos», «Disponibles» y «Finalizados», el acceso a creación y las acciones según el estado de cada torneo. `TarjetaTorneo.jsx` adapta filas de escritorio a tarjetas móviles.
- **Estados:** contempla carga, error y listas vacías. La pantalla se integró con `GET /api/torneos` en el PR #12; las correcciones de sala por fila llegaron en el PR #14.
- **Testing:** `pruebas/torneos.spec.js` cubre filtros, acciones y responsive.

## 23/9 [3.3.2] Creación de torneos

PR #5, merge `3b36e12`; implementación `5426fbf`.

- **Formulario:** `PaginaCrearTorneo.jsx` permite nombre, cupo de 4, 8 o 16 personas y contraseña opcional. Presenta validación, errores y composición de escritorio y móvil.
- **Evolución:** comenzó como pantalla frontend, después se conectó a `POST /api/torneos` y finalmente se ajustó la redirección a la sala del torneo creado. `pruebas/crearTorneo.spec.js` acompaña el flujo.

## 18/9 [1.2.5, 6.1] Sesión JWT y rutas protegidas

PR #4, merge `c29bd61`; implementación `2d1e5b7`.

- **Estado de sesión:** `ContextoSesion.jsx` y `servicioSesion.js` guardan y restauran el token. `sessionStorage` es la opción predeterminada; «Mantener sesión iniciada» usa `localStorage`. Cerrar sesión elimina el token local.
- **Protección de navegación:** `RutaProtegida.jsx` exige sesión para Home, Perfil, juego, torneos y administración; `RutaPublica.jsx` redirige a usuarios ya autenticados. Tokens malformados o vencidos se descartan. La decodificación local no sustituye la verificación del backend.
- **Testing:** `pruebas/sesion.spec.js` cubre persistencia, redirección, vencimiento y cierre.

## 18/9 [1.2.4, 6.1] Pantalla de perfil

PR #3, merge `cb73881`; implementación `54a13ba`.

- **Pantalla:** `PaginaPerfil.jsx` crea la edición de datos básicos en escritorio y móvil, con validación y estados de solicitud.
- **Evolución:** la lectura y actualización reales del usuario llegaron en el PR #13. Campos sin contrato de API, como biografía y avatar, no se envían como cambios reales. `pruebas/perfil.spec.js` verifica la vista y las solicitudes compatibles.

## 18/9 [1.2.3, 6.1] Pantalla Home

PR #2, merge `6506ba9`; implementación `7d9dc75`.

- **Presentación:** `PaginaHome.jsx` incorpora navegación a modos de juego, torneos, ranking, perfil y administración cuando corresponde. Reutiliza componentes visuales y diseño responsive de Figma.
- **Evolución:** el PR #13 sustituyó los datos de identidad por `GET /api/usuarios/me`; los indicadores sin endpoint permanecen como demostración o pendientes. `pruebas/inicio.spec.js` cubre navegación, respuesta de usuario y celular.

## 16–17/9 [1.2.1, 1.2.2, 1.3.1, 6.1, 6.2] Registro y login

PR #1, merge `32cfeee`; commits de componentes, pantallas, conexión y pruebas entre el 16 y el 17/9.

- **Arquitectura de interfaz:** `MarcoAutenticacion.jsx`, `CampoEntrada.jsx`, `Boton.jsx` y estilos compartidos establecen las pantallas de acceso y registro en escritorio y móvil, con recursos locales exportados de Figma.
- **Registro:** `PaginaRegistro.jsx` comprueba nombre, email, contraseña de al menos ocho caracteres y confirmación; `servicioAuth.js` envía `POST /api/auth/registro` y presenta los errores recibidos.
- **Login:** `PaginaLogin.jsx` y `servicioAuth.js` usan `POST /api/auth/login`; el mock inicial fue reemplazado por la respuesta real `{ access_token, token_type }`. El token se conecta con la sesión JWT incorporada después.
- **Testing:** `pruebas/autenticacion.spec.js` comprueba validaciones, errores, peticiones, navegación y vistas móviles mediante peticiones interceptadas para no crear usuarios reales durante las pruebas.

## 16/9 [Configuración inicial] Aplicación React

Commits `1566055`, `353fe02` y `556bb5a`.

- **Proyecto:** React y Vite con `Aplicacion.jsx` como mapa de rutas, `principal.jsx` como entrada y `src/` separado en componentes, páginas, servicios, estilos y utilidades.
- **Configuración y pruebas:** `package.json` define `npm run dev`, `npm run build` y `npm test`; Playwright ejecuta pruebas de navegador con backend ficticio/interceptado. `.env.example` documenta `VITE_API_URL`.
- **Convenciones:** nombres de componentes en PascalCase, funciones en camelCase, ramas `feature/` o `fix/` y commits descriptivos. Los títulos de PR referencian actividades del EDT.

## Estado del alcance y pendientes al 25/9

- **Referencia funcional:** el documento de alcance del ZIP exige cuatro opciones y una respuesta correcta por pregunta, edición y eliminación del banco, creación y edición de categorías, y administración de usuarios sin perder su historial. Figma se usa como referencia visual. Sus nombres, participantes, puntajes y estados de muestra no se tratan como información real.
- **Contratos del backend:** el changelog del backend en `TP/CHANGELOG.md` documenta el 25/9 rutas bajo `/api/admin` para preguntas, categorías y usuarios, con autenticación y autorización. **Este frontend todavía usa datos temporales en el panel admin**; integrar y probar esos contratos en el cliente es trabajo pendiente. El changelog del backend no prueba por sí solo que la versión desplegada en Render ya los incluya.
- **Módulo 5 pendiente:** `5.2.7` habilitación/deshabilitación con confirmación y `5.2.8` completar la protección y navegación administrativa. La cuenta administrativa simulada funciona solo en desarrollo.
- **Torneos y juego:** el progreso de partidas y los resultados del cuadro requieren completar la integración con el módulo 2. Los puntajes, premios y resúmenes que no devuelve el contrato de torneo no deben inventarse en la interfaz.
- **Planificación:** se propuso ampliar las pruebas de torneos en EDT/Gantt con pruebas de endpoints e integración responsive; no se encontró una modificación confirmada de esos archivos en este repositorio. `docs/figma.md` es una referencia local, pero `docs/` está en `.gitignore` y no se incluye automáticamente en un commit.
- **Historial Git:** un PR de torneos se abrió inicialmente contra `main` por error y luego se continuó el trabajo contra `develop`. El commit de merge de `5.2.2` conserva el texto literal `#N`; no se debe reutilizar ese marcador al nombrar merges futuros.
