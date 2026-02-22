# 🔍 Debug Guide - CloverBI

## Sistema de Logging

CloverBI ahora incluye un sistema de logging centralizado que te ayuda a debuggear problemas durante desarrollo.

### 📊 Qué se loggea automáticamente:

#### 🔐 **Login Flow** (`/login`)
```
🔐 Login Flow
  ✅ Iniciando login
  ✅ POST /api/auth/login
  ✅ Login exitoso
    ✅ Guardando usuario en localStorage
    ✅ Obteniendo config desde DOM...
    ✅ GET /api/config?organization_uid=...
    ✅ Config save
    ✅ Redirigiendo a /overview
```

#### ⚙️ **Config Loading** (todas las páginas)
```
✅ Config load
  backend: https://api.cloverbi.neosolutions.com.ar
  gateway: wss://clover.neosolutions.com.ar/
```

#### 🔐 **Auth Check** (`AppLayout`)
```
🔐 AppLayout: Verificando auth
  🔍 Auth check
  ✅ Usuario cargado desde localStorage
  🔍 Role check
```

#### 🌿 **Training WebSocket** (`/training`)
```
⚙️ Training: Cargando config
  ✅ Config Ivy cargada
  🔍 WebSocket connect
  🔍 WebSocket receive (connect.challenge)
  🔍 WebSocket send (auth con token)
  🔍 WebSocket receive (hello-ok)
  ✅ Conexión con Ivy establecida
```

---

## 🎨 Formato de Logs

Los logs usan **colores** y **emojis** para fácil identificación:

| Nivel | Emoji | Color | Uso |
|-------|-------|-------|-----|
| `debug` | 🔍 | Indigo | Detalles técnicos |
| `info` | ✅ | Verde | Eventos exitosos |
| `warn` | ⚠️ | Amarillo | Advertencias |
| `error` | ❌ | Rojo | Errores |

---

## 🛠️ Usar el Logger en tu código

### Importar:
```typescript
import { logger } from '@/lib/logger'
```

### Métodos básicos:
```typescript
logger.debug('Mensaje de debug', { component: 'MiComponente', data: {...} })
logger.info('Todo OK')
logger.warn('Advertencia')
logger.error('Algo falló', { data: error })
```

### Helpers específicos:
```typescript
// Config
logger.config('load', { backend: '...', gateway: '...' })
logger.config('fetch')
logger.config('save', config)

// Auth
logger.auth('login', { email: '...' })
logger.auth('logout')
logger.auth('check', { roles: [...] })

// WebSocket
logger.ws('connect', { url: '...' })
logger.ws('disconnect')
logger.ws('send', { message: '...' })
logger.ws('receive', { event: '...' })

// API
logger.api('POST', '/api/auth/login', { email: '...' })
logger.api('GET', '/api/config')
```

### Groups (colapsables):
```typescript
logger.group('🔐 Login Flow', () => {
  logger.info('Paso 1')
  logger.info('Paso 2')
  logger.info('Paso 3')
})
```

---

## 🔧 Configuración

### Activar/Desactivar:
```typescript
import { logger } from '@/lib/logger'

// Desactivar todo logging
logger.setEnabled(false)

// Reactivar
logger.setEnabled(true)
```

**Por default:**
- ✅ **Activo en desarrollo** (`NODE_ENV=development`)
- ❌ **Inactivo en producción** (solo errores)

---

## 🐛 Debugging común

### Problema: "Config no encontrada"
**Buscar en consola:**
```
⚠️ Config no encontrada en localStorage, usando defaults
```
**Solución:** Volver a hacer login

### Problema: "ATR token no encontrado"
**Buscar en consola:**
```
⚠️ ATR token NO encontrado
```
**Solución:** Volver a hacer login

### Problema: "WebSocket no conecta"
**Buscar en consola:**
```
🔍 WebSocket connect
❌ Error en WebSocket
```
**Revisar:** Config de Ivy (gateway_url correcto?)

### Problema: "Usuario no autenticado"
**Buscar en consola:**
```
⚠️ Usuario no autenticado, redirigiendo a /login
```
**Solución:** Session expirada, hacer login de nuevo

---

## 📸 Capturar logs para reportar bugs

1. Abrir DevTools (F12)
2. Ir a la pestaña **Console**
3. Reproducir el problema
4. Click derecho en consola → **Save as...**
5. Enviar el archivo `.log` al equipo

---

## 🎯 Tips

- Los logs con 🔐 y 🌿 son los más importantes
- Si ves ❌ rojo = problema que necesita atención
- Si ves ⚠️ amarillo = advertencia, puede funcionar igual
- Los grupos `▶` se pueden expandir/colapsar

---

*Sistema de logging agregado: 2026-02-22*
*Documentado por: Cloe 💚*
