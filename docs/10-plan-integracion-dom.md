# Plan de Integración DOM + CloverBI

## 🎯 Objetivo
Implementar login en CloverBI usando DOM (DataOilManager) como backend de autenticación.

**Alcance:** Login + Logout + Control de acceso por roles.

---

## ✅ INTEGRACIÓN COMPLETADA

**Fecha:** 2026-02-15  
**Autores:** David + Cloe

---

## 📊 Arquitectura Final

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   CloverBI UI   │────▶│  CloverBI API   │────▶│   DOM Backend   │
│   (Next.js)     │     │  (API Routes)   │     │   (Express)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                                               │
        │           localStorage                        │
        │         ┌───────────┐                        │
        └────────▶│ user      │                        │
                  │ roles     │◀───────────────────────┘
                  └───────────┘
```

---

## 🔌 Endpoint de Login

**URL:** `POST https://multit-back.digitalflow.ar/api/users/knockknock`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "uid": "...",
      "name": "User Name",
      "email": "user@example.com",
      "organization_uid": "...",
      "organization_name": "Org Name"
    },
    "roles": [
      {"role_name": "data_analyst"},
      {"role_name": "data_trainer"}
    ]
  }
}
```

---

## 📋 Tareas Completadas

### Fase 0: Infraestructura ✅
- [x] DOM backend operativo (multit-back.digitalflow.ar)
- [x] CORS configurado en nginx
- [x] Credenciales de testing creadas

### Fase 1: Login UI ✅
- [x] Página `/login` con formulario
- [x] Estilo dark mode cyberpunk
- [x] Manejo de errores y loading

### Fase 2: Auth Logic ✅
- [x] API route `/api/auth/login` (server-side)
- [x] Llamada a DOM evitando CORS
- [x] Sesión en localStorage (`cloverbi_user`, `cloverbi_roles`)
- [x] Logout funcional en ambas páginas

### Fase 3: Lógica de Roles ✅
- [x] Redirect post-login según roles:
  - `data_analyst` → Dashboard
  - Solo `data_trainer` → Training
- [x] Dashboard protegido: requiere `data_analyst`
- [x] Training protegido: requiere `data_trainer`
- [x] Botón Training oculto si no tiene rol

---

## 🔐 Matriz de Acceso por Rol

| Rol | Dashboard | Training | Botón Training |
|-----|-----------|----------|----------------|
| `data_analyst` + `data_trainer` | ✅ | ✅ | ✅ Visible |
| Solo `data_analyst` | ✅ | ❌ Redirect | ❌ Oculto |
| Solo `data_trainer` | ❌ Redirect | ✅ | N/A |
| Sin roles | ❌ Login | ❌ Login | N/A |

---

## 📁 Archivos Modificados/Creados

```
frontend/src/app/
├── login/
│   └── page.tsx              ✅ Login con redirect por rol
├── page.tsx                  ✅ Dashboard con auth + role check
├── training/
│   └── page.tsx              ✅ Training con auth + role check
└── api/auth/login/
    └── route.ts              ✅ Proxy a DOM backend
```

---

## 🧪 Credenciales de Testing

**Organización:** dev_cloverbi  
**Org UID:** 325321A7-29F2-4DBC-9D85-205AAD745E8C

| Rol | Email | Password |
|-----|-------|----------|
| Ambos | `admin@cloverbi.dev` | `SeaLab2021` |
| Solo Analyst | `analyst.cloverbi@digitalflow.ar` | `SeaLab2021` |
| Solo Trainer | `trainer.cloverbi@digitalflow.ar` | `SeaLab2021` |

---

## 🔧 Decisiones Técnicas

| Decisión | Implementación | Razón |
|----------|----------------|-------|
| Auth storage | localStorage | Simple para MVP |
| API calls a DOM | Server-side (API Route) | Evita CORS, oculta URL |
| Role check | Client-side useEffect | UX inmediata |
| ATR tokens | No implementado | Fuera de alcance inicial |

---

## 🚀 Próximos Pasos (Futuro)

- [ ] Migrar de localStorage a cookies httpOnly
- [ ] Implementar refresh de sesión
- [ ] Agregar ATR token rotation
- [ ] Multi-tenant: pasar org_uid a Ivy para configs dinámicas

---

*Integración completada: 2026-02-15*  
*Documentación actualizada: 2026-02-15*
