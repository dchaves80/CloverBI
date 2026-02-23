# CHANGELOG - CloverBI

## [Unreleased] - feature/sidebar-navigation

### 🏗️ Infraestructura
- **Subdominio `api.cloverbi.neosolutions.com.ar`** con SSL (Let's Encrypt) - backend accesible desde frontend
- **Nginx config** para proxy inverso al backend Fastify (:3002)
- **Fix dev**: `allowedDevOrigins` en `next.config.ts` para suprimir warnings cross-origin

### 🔐 Autenticación & Integración DOM
- **Login completo con DOM** - endpoint `knockknock` retorna ATR (token), org_uid, roles
- **ATR preservado en localStorage** - usado como header `knockknock` en todas las requests
- **Config dinámica** - al login se consulta `/api/organization-configs` del DOM y se guarda en localStorage
- **Config flexible** - acepta cualquier `config_key` activa (no solo `'cloverbi'`)
- **Logout limpio** - AppLayout limpia todo el localStorage al cerrar sesión

### 🧭 Navegación & UI
- **Sidebar collapsible** (264px ↔ 64px) con navegación basada en roles
- **AppLayout** - wrapper con autenticación automática y dark mode global
- **Páginas implementadas:**
  - `/` → redirect a `/overview`
  - `/overview` - Dashboard principal (placeholder)
  - `/explorar` - Consultas SQL interactivas ✅
  - `/training` - Chat con Ivy (WebSocket) ✅
  - `/workspaces` - Workspaces guardados (placeholder)
  - `/configuracion` - Info de config DOM (readonly) ✅

### 🔍 Explorar
- **Backend URL dinámica** desde config del DOM (`config.backend.url`)
- **Llamada directa al backend** - sin proxy Next.js (performance mejorada)
- **ATR en header** - todas las queries llevan el token del DOM

### 🤖 Training (Ivy)
- **WebSocket URL y token** desde config del DOM (`config.ivy.gateway_url` / `gateway_token`)
- **Usa localStorage** directamente (sin fetch innecesario a `/api/config`)
- **IDs incrementales** para mensajes (evita duplicados con React keys)
- **Reconexión limpia** - WebSocket se cierra correctamente al desmontar componente

### 🛠️ Utilidades
- **`lib/config.ts`** - Helpers para leer config/user/roles/token desde localStorage
- **`lib/api-client.ts`** - HTTP client con header ATR automático
- **`lib/ivy-client.ts`** - WebSocket client para Ivy
- **`lib/logger.ts`** - Sistema de logging centralizado (solo desarrollo)

### 📝 Debug & Logging
- **Logger con 4 niveles**: debug, info, warn, error
- **Helpers específicos**: `config()`, `auth()`, `ws()`, `api()`
- **WebSocket logging detallado**: URL, protocolo, handshake paso a paso, códigos de cierre
- **Documentación**: `DEBUG.md` con guía completa de troubleshooting

### 📚 Documentación
- `docs/10-workspaces.md` - Feature de Workspaces
- `docs/11-estructura-navegacion.md` - Estructura de navegación
- `docs/12-dom-integration.md` - Integración completa con DOM
- `DEBUG.md` - Guía de debugging y logging

---

## [Templates v2] - feature/templates-v2

- **Save Template UI** - guardar queries como templates
- **CLOVER metadata parser** - parseo de metadata de templates
- **Multi-query support** - soporte para múltiples queries en un template
- **from-html endpoint** - crear template desde HTML

---

## [Base] - main

- **Swagger UI** + documentación de API
- **Backend Fastify** con soporte MSSQL / PostgreSQL / MySQL
- **Docker** con healthcheck corregido (IPv6 fix)
- **WebSocket** a Ivy Agent con handshake y autenticación
