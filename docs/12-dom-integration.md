# 12. Integración con DOM (DataOilManager)

*Agregado: 2026-02-22*

---

## 🎯 ¿Qué es el DOM?

**DOM (DataOilManager)** es el sistema centralizado de autenticación y configuración multi-tenant para las aplicaciones de Digital Flow.

**URL:** https://multit-back.digitalflow.ar  
**Frontend:** https://multit.digitalflow.ar  
**Documentación API:** https://multit-back.digitalflow.ar/api-docs/

---

## 🔑 Rol del DOM en CloverBI

El DOM es el **punto de partida** de CloverBI. Define:

1. **Autenticación** - Usuarios y roles
2. **Organización** - Multi-tenant (cada cliente tiene su org)
3. **Configuración** - URLs, tokens, features por organización
4. **Permisos** - Roles (data_analyst, data_trainer)

---

## 🏢 Multi-Tenant: Una instancia, múltiples clientes

```
CloverBI (único deployment)
  ├─ Organización A (Cliente ACME)
  │   ├─ Config: backend → https://api-acme.cloverbi.com
  │   ├─ Config: database → SQL Server ACME
  │   └─ Usuarios: 10 analistas
  │
  ├─ Organización B (Cliente XYZ)
  │   ├─ Config: backend → https://api-xyz.cloverbi.com
  │   ├─ Config: database → SQL Server XYZ
  │   └─ Usuarios: 5 analistas
  │
  └─ Organización dev_cloverbi (Testing)
      ├─ Config: backend → https://api.cloverbi.neosolutions.com.ar
      └─ Usuarios: 3 usuarios de prueba
```

---

## 🔄 Flujo de Autenticación y Configuración

### Paso 1: Login al DOM

```
Usuario ingresa email + password en CloverBI
  ↓
POST https://multit-back.digitalflow.ar/api/users/knockknock
  Body: { email, password }
  ↓
Response:
{
  "success": true,
  "data": {
    "user": {
      "uid": "7b6d4202-...",
      "email": "admin@cloverbi.dev",
      "organization_uid": "325321A7-29F2-4DBC-9D85-205AAD745E8C",
      "organization_name": "dev_cloverbi"
    },
    "roles": [
      { "role_name": "data_analyst", ... },
      { "role_name": "data_trainer", ... }
    ],
    "token": "token_1771765759244_..."
  }
}
```

**El usuario queda autenticado y asociado a su organización.**

---

### Paso 2: Obtener Configuración de la Organización

```
GET https://multit-back.digitalflow.ar/api/organization-configs
  Query: ?organization_uid=325321A7-29F2-4DBC-9D85-205AAD745E8C
  Header: knockknock: token_1771765759244_...
  ↓
Response:
{
  "success": true,
  "data": {
    "configs": [
      {
        "config_key": "cloverbi",
        "config_data": {
          "backend": {
            "url": "https://api.cloverbi.neosolutions.com.ar"
          },
          "frontend": {
            "url": "https://cloverbi.neosolutions.com.ar"
          },
          "ivy": {
            "gateway_url": "wss://clover.neosolutions.com.ar/",
            "gateway_token": "clover-bi-2026-secret"
          }
        },
        "environment": "production"
      }
    ]
  }
}
```

**CloverBI obtiene TODA su configuración desde el DOM.**

---

### Paso 3: Usar la Configuración

```typescript
// Frontend guarda la config
localStorage.setItem('cloverbi_config', JSON.stringify(config.cloverbi))

// Luego la usa en queries
const backendUrl = config.cloverbi.backend.url
fetch(`${backendUrl}/api/query`, ...)

// Y para conectar a Ivy
const ws = new WebSocket(config.cloverbi.ivy.gateway_url)
```

---

## 📊 Estructura de Configuración en el DOM

### Registro completo en el DOM:

```json
{
  "organization_uid": "325321A7-29F2-4DBC-9D85-205AAD745E8C",
  "config_key": "cloverbi",
  "config_data": {
    "backend": {
      "url": "https://api.cloverbi.neosolutions.com.ar"
    },
    "frontend": {
      "url": "https://cloverbi.neosolutions.com.ar"
    },
    "ivy": {
      "gateway_url": "wss://clover.neosolutions.com.ar/",
      "gateway_token": "clover-bi-2026-secret"
    }
  },
  "description": "Configuración de CloverBI - Production",
  "environment": "production",
  "is_active": true,
  "tags": ["cloverbi", "production"]
}
```

---

## 🌍 Configuración por Ambiente

Cada organización puede tener múltiples configuraciones según el ambiente:

### Production

```json
{
  "config_key": "cloverbi",
  "environment": "production",
  "config_data": {
    "backend": { "url": "https://api.cloverbi.neosolutions.com.ar" },
    "ivy": { "gateway_url": "wss://clover.neosolutions.com.ar/" }
  }
}
```

### Development

```json
{
  "config_key": "cloverbi",
  "environment": "development",
  "config_data": {
    "backend": { "url": "http://localhost:3002" },
    "ivy": { "gateway_url": "ws://localhost:19002/" }
  }
}
```

**El frontend puede seleccionar qué ambiente usar:**
```
?environment=production (default)
?environment=development
?environment=staging
```

---

## 🐳 Docker: Una sola variable de entorno

**Antes (muchas variables):**
```bash
docker run \
  -e BACKEND_URL=https://... \
  -e GATEWAY_URL=wss://... \
  -e GATEWAY_TOKEN=... \
  -e FEATURE_DARK_MODE=true \
  -e FEATURE_AUTO_REFRESH=false \
  frontend
```

**Ahora (una sola):**
```bash
docker run \
  -e DOM_API_URL=https://multit-back.digitalflow.ar \
  frontend
```

**Todo lo demás se obtiene del DOM al hacer login.**

---

## 🔒 Roles y Permisos

El DOM define roles que CloverBI usa para controlar acceso:

| Rol | Permisos en CloverBI |
|-----|---------------------|
| `data_analyst` | ✅ Explorar datos<br>✅ Ver dashboards<br>✅ Crear workspaces<br>❌ Training |
| `data_trainer` | ✅ Training de Ivy<br>✅ Configurar esquemas DB<br>❌ Explorar datos (opcional) |
| `admin` | ✅ Todo |

**Asignación en DOM:**
- Admin del DOM crea usuarios
- Asigna roles por usuario
- CloverBI respeta esos roles automáticamente

---

## 📝 Gestión de Configuración

### ¿Quién gestiona la config?

**Opción 1: Panel de Admin del DOM**
- Interface web en https://multit.digitalflow.ar
- Crear/editar configs por organización
- UI amigable

**Opción 2: API directa**
```bash
# Crear config
POST /api/organization-configs
Headers: { knockknock: <token> }
Body: {
  "organization_uid": "...",
  "config_key": "cloverbi",
  "config_data": { ... },
  "environment": "production"
}

# Actualizar config
PUT /api/organization-configs/:id
Body: { config_data: { ... } }
```

---

## 🔄 Actualizar Config sin Rebuild

**Escenario:** Cambiar la URL del backend de producción.

**Antes (sin DOM):**
1. Editar `.env.production`
2. `docker build` (rebuild completo)
3. `docker push`
4. Deploy

**Ahora (con DOM):**
1. Actualizar config en DOM (1 API call o desde panel)
2. Usuario refresca CloverBI
3. Obtiene nueva config automáticamente

**Sin rebuild. Sin deploy. Instantáneo.** ✅

---

## 🎯 Ventajas del Modelo DOM

### 1. Multi-Tenant Real
Múltiples organizaciones usan la misma instancia de CloverBI, cada una con su config.

### 2. Centralización
Una sola fuente de verdad para autenticación y configuración.

### 3. Flexibilidad
Cambiar config sin tocar código o contenedores.

### 4. Seguridad
Tokens y credenciales no están hardcodeadas en el código.

### 5. Auditoría
El DOM registra quién cambió qué y cuándo.

---

## 🛠️ Implementación en CloverBI

### Frontend

**Login:**
```typescript
// src/app/api/auth/login/route.ts
const DOM_API_URL = process.env.DOM_API_URL || 'https://multit-back.digitalflow.ar'

const response = await fetch(`${DOM_API_URL}/api/users/knockknock`, {
  method: 'POST',
  body: JSON.stringify({ email, password })
})

const { user, roles, token } = await response.json()

// Guardar en localStorage
localStorage.setItem('cloverbi_user', JSON.stringify(user))
localStorage.setItem('cloverbi_roles', JSON.stringify(roles))
localStorage.setItem('cloverbi_token', token)
```

**Obtener Config:**
```typescript
// src/app/api/config/route.ts
export async function GET() {
  const DOM_API_URL = process.env.DOM_API_URL
  const token = // ... obtener del header o cookie
  const orgUid = // ... obtener del usuario logueado

  const response = await fetch(
    `${DOM_API_URL}/api/organization-configs?organization_uid=${orgUid}`,
    { headers: { knockknock: token } }
  )

  const data = await response.json()
  const cloverbiConfig = data.configs.find(c => c.config_key === 'cloverbi')

  return Response.json(cloverbiConfig.config_data)
}
```

**Uso en cliente:**
```typescript
// Al iniciar la app
const config = await fetch('/api/config').then(r => r.json())
// config = { backend: {...}, ivy: {...} }

// Usar en queries
fetch(`${config.backend.url}/api/query`, ...)

// Conectar a Ivy
const ws = new WebSocket(config.ivy.gateway_url)
```

---

## 🔗 Endpoints del DOM Relevantes

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/users/knockknock` | POST | Login (retorna token + user + roles) |
| `/api/organization-configs` | GET | Obtener configs de una org |
| `/api/organization-configs` | POST | Crear config (requiere admin) |
| `/api/organization-configs/:id` | PUT | Actualizar config |
| `/api/organization-configs/:id` | DELETE | Eliminar config |

**Documentación completa:**  
https://multit-back.digitalflow.ar/api-docs/

---

## 📋 Checklist de Integración

- [x] Documentar rol del DOM
- [x] Implementar obtención de config desde DOM en frontend
- [x] Reemplazar variables de entorno hardcodeadas por config dinámica
- [x] Actualizar `/api/config` para consultar DOM
- [x] Guardar token del DOM (ATR) en localStorage
- [x] Crear utilidad `lib/config.ts` para acceso centralizado
- [ ] Implementar refresh de config (polling o manual)
- [ ] Documentar en README cómo configurar una nueva organización
- [ ] Testing con múltiples organizaciones
- [ ] Manejo de errores si DOM no está disponible

---

## 🚀 Próximos Pasos

1. **Implementar código** que consume config del DOM
2. **Crear segunda organización** de prueba para validar multi-tenant
3. **Documentar** proceso de onboarding de nueva organización
4. **Agregar features** en config (dark_mode, auto_refresh, etc.) cuando sea necesario

---

## ✅ Implementación Completada

*Actualizado: 2026-02-22 22:00 GMT-3*

### Flujo de Autenticación Implementado

```
1. Usuario ingresa email + password en /login
   ↓
2. POST /api/auth/login
   - Llama a DOM /api/users/knockknock
   - Retorna: user, roles, token (ATR)
   ↓
3. Frontend guarda en localStorage:
   - cloverbi_user
   - cloverbi_roles
   - cloverbi_token (🔥 ATR)
   ↓
4. GET /api/config?organization_uid=...
   - Header: knockknock: <ATR>
   - Llama a DOM /api/organization-configs
   - Retorna config de cloverbi
   ↓
5. Frontend guarda en localStorage:
   - cloverbi_config
   ↓
6. Redirect a /overview o /training según roles
```

### Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `/api/auth/login/route.ts` | ✅ Retorna `token` (ATR) en response |
| `/app/login/page.tsx` | ✅ Guarda ATR + obtiene config desde DOM |
| `/api/config/route.ts` | ✅ Reescrito para obtener config desde DOM usando ATR |
| `/components/AppLayout.tsx` | ✅ Limpia ATR y config en logout |
| `/lib/config.ts` | ✅ Creado - Utilidades para acceder a config/user/roles/token |

### Uso de la Configuración Dinámica

**En componentes cliente:**
```typescript
import { getConfig, getAuthToken } from '@/lib/config'

const config = getConfig()
const backendUrl = config.backend.url
const ivyUrl = config.ivy.gateway_url

// Hacer queries al backend dinámico
fetch(`${backendUrl}/api/query`, {
  headers: {
    'knockknock': getAuthToken()!,
  },
  body: JSON.stringify(query)
})
```

**En WebSocket (conexión a Ivy):**
```typescript
import { getConfig } from '@/lib/config'

const config = getConfig()
const ws = new WebSocket(config.ivy.gateway_url)
```

### Variables de Entorno Requeridas

**Solo una:**
```bash
DOM_API_URL=https://multit-back.digitalflow.ar
```

**Todo lo demás viene del DOM.**

### Testing

**Usuarios de prueba (organización `dev_cloverbi`):**
- `admin@cloverbi.dev` / `SeaLab2021` (roles: data_analyst + data_trainer)
- `analyst.cloverbi@digitalflow.ar` / `SeaLab2021` (rol: data_analyst)
- `trainer.cloverbi@digitalflow.ar` / `SeaLab2021` (rol: data_trainer)

---

*Documentado por: Cloe 💜*
*Fecha: 2026-02-22 10:15 GMT-3*
*Implementado: 2026-02-22 22:00 GMT-3*
