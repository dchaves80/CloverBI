# Plan de Integración DOM + CloverBI

## 🎯 Objetivo
Implementar login en CloverBI usando DOM (DataOilManager) como backend de autenticación.

**Alcance inicial:** Solo login básico, sin ATR.

---

## 📊 Estado Actual

### CloverBI Frontend
- **Stack:** Next.js 15 + React 19 + TypeScript + Tailwind 4
- **Auth actual:** Ninguna
- **Ubicación:** E:\Projects\CloverBI\frontend

### DOM Backend (DataOilManager API)
- **Stack:** Node.js + Express + SQL Server 2022
- **Versión imagen:** dataoilmanager-api:1.5
- **Server:** 167.99.190.70 (cosotroco)
- **Estado:** ✅ **OPERATIVO** (cosotroco 😂)
- **Puerto esperado:** 3000 (interno) → exponer vía nginx
- **DB:** SQL Server en 167.99.190.70 (cosotroco):1440, database: dataoilmanager_test

### DOM Frontend
- **Versión:** dataoil-manager-front:1.6
- **URL:** https://dom.proyectolibertador.app
- **Puerto:** 60201
- **Estado:** ✅ Up

---

## 🔌 Endpoint de Login

**URL:** `POST /api/users/knockknock`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response exitosa:**
```json
{
  "success": true,
  "data": {
    "user": {
      "uid": "USER-UID-HERE",
      "name": "User Name",
      "email": "user@example.com",
      "organization_uid": "ORG-UID-HERE",
      "organization_name": "Org Name"
    },
    "token": "token_xxx" 
  }
}
```

**Nota:** Por ahora ignoramos el token ATR, solo usamos los datos del user/org.

---

## 📋 Tareas de Implementación

### Fase 0: Infraestructura ✅ COMPLETADO
- [x] **DOM backend operativo** - https://multit-back.digitalflow.ar
- [x] **API expuesta** - multit-back.digitalflow.ar (cosotroco 😂)
- [x] **CORS configurado** - En nginx con Access-Control-Allow-Origin: *

### Fase 1: CloverBI Frontend - Login UI
- [ ] Crear página `/login` con form (email + password)
- [ ] Crear componente `LoginForm.tsx`
- [ ] Estilo consistente con el resto de la app (dark mode, colores verdes)

### Fase 2: CloverBI Frontend - Auth Logic
- [ ] Crear `/api/auth/login` (API route interna)
- [ ] Llamar a DOM backend desde server-side (evita CORS)
- [ ] Guardar sesión (cookie httpOnly o localStorage básico)
- [ ] Crear context de auth (`AuthContext.tsx`)

### Fase 3: Protección de Rutas
- [ ] Middleware o wrapper para rutas protegidas
- [ ] Redirect a /login si no hay sesión
- [ ] Mostrar datos de usuario/org en la UI

### Fase 4: Pasar org_uid a Ivy
- [ ] Incluir organization_uid en requests al agente
- [ ] Ivy usa org_uid para cargar configs de DB de ese cliente

---

## 🔧 Decisiones Técnicas

| Decisión | Opción elegida | Razón |
|----------|----------------|-------|
| Dónde llamar a DOM | Server-side (API Route) | Evita CORS, oculta URL de DOM |
| Storage de sesión | Cookie httpOnly | Más seguro que localStorage |
| State management | React Context | Simple, sin deps extras |
| ATR | NO por ahora | Simplicidad, lo agregamos después |

---

## 🚧 Bloqueantes ✅ RESUELTOS

1. **DOM Backend ✅ OK** - Funcionando en multit-back.digitalflow.ar
2. **Endpoint público** - Necesitamos URL accesible para la API de DOM

---

## 📁 Archivos a Crear

```
frontend/src/
├── app/
│   ├── login/
│   │   └── page.tsx          # Página de login
│   └── api/
│       └── auth/
│           └── login/
│               └── route.ts  # API route para auth
├── components/
│   └── LoginForm.tsx         # Form component
├── contexts/
│   └── AuthContext.tsx       # Auth state
└── lib/
    └── auth.ts               # Helper functions
```

---

## ⏱️ Estimación

| Fase | Tiempo |
|------|--------|
| Fase 0 (Infra) | 30 min |
| Fase 1 (UI) | 1-2 hrs |
| Fase 2 (Logic) | 2-3 hrs |
| Fase 3 (Protect) | 1 hr |
| Fase 4 (Ivy) | 1 hr |
| **Total** | **~6-8 hrs** |

---

*Documento creado: 2026-02-15*
*Autores: David + Cloe*

---

## 🧪 Credenciales de Testing (dev_cloverbi)

**Organización:** dev_cloverbi  
**Org UID:** 325321A7-29F2-4DBC-9D85-205AAD745E8C

### Usuarios de Prueba

| Usuario | Email | Password | Roles |
|---------|-------|----------|-------|
| Admin | admin@cloverbi.dev | SeaLab2021 | data_trainer + data_analyst |
| Analyst | analyst.cloverbi@digitalflow.ar | SeaLab2021 | data_analyst |
| Trainer | trainer.cloverbi@digitalflow.ar | SeaLab2021 | data_trainer |

### Login Endpoint
```bash
POST https://multit-back.digitalflow.ar/api/users/knockknock
Content-Type: application/json

{
  "email": "admin@cloverbi.dev",
  "password": "SeaLab2021"
}
```

### Response Exitosa
```json
{
  "success": true,
  "data": {
    "user": {
      "uid": "...",
      "email": "admin@cloverbi.dev",
      "organization_name": "dev_cloverbi",
      "organization_uid": "325321A7-29F2-4DBC-9D85-205AAD745E8C"
    },
    "roles": [{"role_name": "data_trainer"}, {"role_name": "data_analyst"}],
    "token": "token_xxx..."
  }
}
```

---

*Credenciales creadas: 2026-02-15*
*Testeadas y funcionando ✅*
