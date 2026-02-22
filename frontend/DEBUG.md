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
  
🌿 Conectando a Ivy (WebSocket)
  ✅ WebSocket connect
    url: wss://clover.neosolutions.com.ar/
    hasToken: true
    protocol: WSS (secure)
  ✅ WebSocket open
    readyState: OPEN
    protocol: default
    extensions: none
  ✅ WebSocket receive
    type: connect.challenge
    size: 234 bytes
    
🔐 Autenticando con Ivy
  ✅ WebSocket auth
    action: Enviando credenciales
    role: operator
    scopes: [operator.read, operator.write, operator.admin]
    hasToken: true
  ✅ WebSocket send
    method: connect
    size: 567 bytes
  ✅ WebSocket receive
    type: res
    size: 189 bytes
    
✅ Conexión establecida con Ivy
  ✅ Handshake completado
    sessionId: abc123...
    protocol: 3
    capabilities: [...]

// Cuando envías un mensaje:
✅ WebSocket send
  method: chat.send
  messageLength: 45
  sessionKey: agent:main:training

// Cuando recibes respuesta:
🔍 Stream iniciado (assistant)
✅ Respuesta completada
  tokensUsed: 234
  duration: 1234ms

// Si se desconecta:
⚠️ WebSocket disconnect
  code: 1006
  reason: Connection lost
  wasClean: false
  willReconnect: true
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
✅ WebSocket connect
  url: wss://...
  protocol: WSS (secure)
❌ WebSocket error
  readyState: 3 (CLOSED)
```

**Posibles causas:**
1. **URL incorrecta** - Revisar `gateway_url` en config
2. **Token inválido** - Revisar `gateway_token` en config  
3. **Firewall bloqueando WSS** - Verificar puerto 443/80 abierto
4. **Ivy no está corriendo** - Verificar que el servidor Ivy esté up

**Cómo diagnosticar:**
- Si ves `WebSocket connect` pero nunca `WebSocket open` → problema de red/firewall
- Si ves `WebSocket open` pero luego `error` → problema de auth/token
- Si ves `connect.challenge` pero nunca `hello-ok` → token inválido

### Problema: "WebSocket se desconecta constantemente"
**Buscar en consola:**
```
⚠️ WebSocket disconnect
  code: 1006
  reason: Abnormal closure
  wasClean: false
  willReconnect: true
```

**Códigos de cierre comunes:**
- `1000` - Normal closure (todo OK)
- `1001` - Going away (servidor cerrándose)
- `1006` - Abnormal closure (red cortada, timeout)
- `1008` - Policy violation (auth rechazada)
- `1011` - Server error (Ivy tuvo un error)

### Problema: "Usuario no autenticado"
**Buscar en consola:**
```
⚠️ Usuario no autenticado, redirigiendo a /login
```
**Solución:** Session expirada, hacer login de nuevo

---

## 🌐 Debugging Específico WSS

### Verificar handshake completo:

**Secuencia esperada:**
1. ✅ `WebSocket connect` - Iniciando conexión
2. ✅ `WebSocket open` - Socket abierto
3. ✅ `WebSocket receive (connect.challenge)` - Servidor pide auth
4. ✅ `WebSocket send (connect)` - Enviamos credenciales
5. ✅ `WebSocket receive (res)` - Respuesta del servidor
6. ✅ `Handshake completado` - ¡Conectado!

**Si falta algún paso**, ahí está el problema.

### Verificar datos de conexión:

```typescript
// En consola del navegador, durante la conexión:
// Deberías ver algo como:
{
  url: "wss://clover.neosolutions.com.ar/",
  hasToken: true,
  protocol: "WSS (secure)"
}
```

Si `hasToken: false` → Config de Ivy no tiene token (volver a login)
Si `protocol: "WS (insecure)"` → Usando HTTP en vez de HTTPS (problema de config)

### Ver mensajes en tiempo real:

Todos los mensajes enviados/recibidos se loguean con:
- **Tipo de mensaje** (connect.challenge, agent, etc.)
- **Tamaño en bytes** 
- **Data completa** (expandible en consola)

Ejemplo:
```
✅ WebSocket receive
  type: agent
  size: 1234 bytes
  ▶ data: {...}  ← Click para expandir
```

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
