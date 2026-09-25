# Swagger del backend

- **Documentación interactiva:** https://futbolquiz-backend.onrender.com/docs
- **Contrato OpenAPI (JSON):** https://futbolquiz-backend.onrender.com/openapi.json
- **URL base para `VITE_API_URL`:** `https://futbolquiz-backend.onrender.com` (sin `/api`)

Contrato consultado en el despliegue el **25/09/2026**. Swagger puede cambiar después: verificar la versión actual antes de conectar nuevas pantallas. Las rutas administrativas requieren un JWT Bearer de una cuenta con rol `ADMINISTRADOR`; la cuenta admin simulada del frontend solo sirve para ver datos de ejemplo en desarrollo.

## Usuarios del panel — 5.2.6 y 5.2.7

| Método y ruta | Uso | Estado en frontend |
| --- | --- | --- |
| `GET /api/admin/usuarios` | Listar usuarios | Conectado en 5.2.6 para sesiones admin reales |
| `GET /api/admin/usuarios/{usuario_id}` | Consultar un usuario | Pendiente de una pantalla que lo necesite |
| `PATCH /api/admin/usuarios/{usuario_id}/estado` | Habilitar/deshabilitar | Pendiente de 5.2.7 |

`GET /api/admin/usuarios` admite filtros opcionales en la query:

- `buscar`: coincidencia en `nombre` o `email`.
- `rol`: `JUGADOR` o `ADMINISTRADOR`.
- `esta_habilitado`: `true` o `false`.

La respuesta `200` es un **array**, sin envoltorio de paginación. Cada usuario incluye `id`, `nombre`, `email`, `rol`, `puntaje_total`, `esta_habilitado` y `fecha_alta`; el frontend no debe esperar contraseña ni hash. Las respuestas `401` indican token ausente/inválido y `403` indican falta de rol administrador. El cambio de estado recibe `{ "esta_habilitado": true|false }`; también puede devolver `400` al intentar deshabilitar la propia cuenta.

## Otras rutas relevantes del Swagger actual

| Área | Rutas |
| --- | --- |
| Autenticación | `POST /api/auth/registro`, `POST /api/auth/login`, `POST /api/auth/logout` |
| Usuario autenticado | `GET/PATCH /api/usuarios/me`, `PATCH /api/usuarios/me/password` |
| Categorías para jugar | `GET /api/categorias`, `GET /api/partidas/categorias` |
| Torneos | `POST/GET /api/torneos`, `POST /api/torneos/unirse`, `GET /api/torneos/{torneo_id}`, `DELETE /api/torneos/{torneo_id}/salir` |
| Partida individual | `POST /api/partidas/individual`, `POST /api/partidas/preguntas/{pregunta_partida_id}/respuesta`, `GET /api/partidas/{partida_id}/resultado` |
| Duelos | `POST /api/duelos/online`, `POST /api/duelos/local`, `POST /api/duelos/preguntas/{pregunta_partida_id}/respuesta`, `GET /api/duelos/{duelo_id}` |
| Administración de preguntas | `POST/GET /api/admin/preguntas`, `GET/PATCH/DELETE /api/admin/preguntas/{pregunta_id}`, `POST /api/admin/preguntas/{pregunta_id}/duplicar`, `PATCH /api/admin/preguntas/{pregunta_id}/estado` |
| Administración de categorías | `POST/GET /api/admin/categorias`, `GET/PATCH/DELETE /api/admin/categorias/{categoria_id}`, `PATCH /api/admin/categorias/{categoria_id}/estado` |
| Datos iniciales | `POST /api/admin/sistema/sembrar` |

Preguntas y categorías usan estas rutas para cuentas administradoras reales. La vista previa y la cuenta admin local de desarrollo conservan datos de ejemplo. El listado de preguntas llega paginado en `{ items, total, page, total_paginas }` (seis por página); el frontend solicita solo la página visible y envía `buscar`, `categoria_id` y `estado` como filtros. La categoría recibe `nombre` y `estado`, sin descripción. La respuesta de preguntas usa `categoria_id`, `opcion_a` a `opcion_d` y `respuesta_correcta` como letra de A a D.
