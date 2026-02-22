# 🔧 CloverBI WebSocket Troubleshooting Guide

*Documentación completa de problemas encontrados durante el deployment inicial*

**Sesión:** 2026-02-20 (19:00 - 19:55 GMT-3)  
**Resultado:** ✅ Completamente resuelto  
**Documentado por:** Cloe Cloverfield

---

## 📊 Resumen Ejecutivo

### Problema Principal
CloverBI **Training Mode** no funcionaba - el frontend mostraba múltiples errores de conexión WebSocket mientras que **Dashboard Mode** funcionaba correctamente.

### Causa Raíz
**Problema 1:** SSL Certificate mismatch en backend Docker  
**Problema 2:** Mixed Content Security Error (HTTPS → WS)  
**Problema 3:** HTTP/2 vs WebSocket incompatibilidad en nginx

### Solución Final
- ✅ Backend usa IP directa para conexiones internas
- ✅ WSS Tunnel dedicado en puerto 19443 para training mode
- ✅ Arquitectura dual: Dashboard (interno) + Training (WSS público)

---

## 🔍 Problemas Identificados (en orden cronológico)

### 1. SSL Certificate Hostname Mismatch

**🚨 Problema:**
```bash
"Hostname/IP does not match certificate's altnames: 
Host: clover.neosolutions.com.ar. is not in the cert's altnames: 
DNS:cigbyte.com, DNS:www.cigbyte.com"
```

**📍 Ubicación:** Backend Docker container  
**⚙️ Causa:** Backend intentando conectar via WSS a Ivy usando hostname público, pero recibiendo certificado incorrecto

**✅ Solución:**
- Cambiar backend de `wss://clover.neosolutions.com.ar/ws` → `ws://172.17.0.1:19002`
- Usar IP interna Docker para evitar SSL en conexiones backend→Ivy

### 2. Configuración Dual URL Faltante

**🚨 Problema:**
Backend devolvía URL interna (`ws://172.17.0.1:19002`) en `/api/config`, pero browsers no pueden conectar a IPs Docker internas.

**⚙️ Causa:** Falta de separación entre URLs internas vs públicas

**✅ Solución:**
- Modificar código backend: `process.env.PUBLIC_CLOVER_URL` para `/api/config`
- Mantener `process.env.CLOVER_URL` para conexiones internas
- Rebuild imagen Docker con nueva lógica

### 3. Mixed Content Security Error

**🚨 Problema:**
```javascript
Mixed Content: The page at 'https://cloverbi.neosolutions.com.ar/training' 
was loaded over HTTPS, but attempted to connect to the insecure WebSocket 
endpoint 'ws://clover.neosolutions.com.ar:19002/'. This request has been blocked.
```

**📍 Ubicación:** Browser security policy  
**⚙️ Causa:** HTTPS page cannot connect to WS (insecure) - requires WSS

**✅ Solución:**
- Crear WSS tunnel en nginx
- Configurar puerto SSL dedicado 19443 para WebSocket

### 4. HTTP/2 vs WebSocket Incompatibilidad

**🚨 Problema:**
Nginx con `http2` devolvía `HTTP/2 200` en lugar de `HTTP/1.1 101 Switching Protocols`

**📍 Ubicación:** Nginx configuration  
**⚙️ Causa:** WebSocket requires HTTP/1.1, pero nginx usaba HTTP/2 por defecto

**✅ Solución:**
- Crear server separado sin `http2` para WebSocket
- Puerto dedicado 19443 solo para WSS connections

### 5. Múltiples Nginx Instances Conflict

**🚨 Problema:**
- 50+ procesos nginx corriendo simultáneamente
- Docker containers con nginx propios
- Configuraciones conflictivas

**📍 Ubicación:** Sistema host + Docker containers  
**⚙️ Causa:** Reinicios fallidos dejaban procesos zombie

**✅ Solución:**
- Kill all nginx processes: `pkill -f nginx`
- Start clean nginx instance
- Verificar solo systemd nginx corriendo

---

## 🏗️ Arquitectura Final

### Antes (No funcionaba)
```
Training: Browser → nginx (HTTP/2) → Ivy ❌
Dashboard: Browser → nginx → Frontend → Backend → Ivy ✅
```

### Después (Funcionando)
```
Training:  Browser → wss://cloverbi.neosolutions.com.ar:19443 → nginx SSL → ws://127.0.0.1:19002 → Ivy ✅
Dashboard: Browser → https://cloverbi.neosolutions.com.ar → nginx → Frontend → Backend → ws://172.17.0.1:19002 → Ivy ✅
```

### Configuraciones Clave

**Backend Docker Variables:**
```bash
CLOVER_URL=ws://172.17.0.1:19002          # Interno
PUBLIC_CLOVER_URL=wss://cloverbi.neosolutions.com.ar:19443  # Público
CLOVER_TOKEN=b7de372ef0d3a2edd5b5411ad5e4561c516090456ec50950
```

**Nginx WSS Proxy:**
```nginx
# /etc/nginx/sites-available/cloverbi-wss
server {
    listen 19443 ssl;
    server_name cloverbi.neosolutions.com.ar;
    
    ssl_certificate /etc/letsencrypt/live/cloverbi.neosolutions.com.ar/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cloverbi.neosolutions.com.ar/privkey.pem;
    
    location / {
        proxy_pass http://127.0.0.1:19002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_buffering off;
        proxy_read_timeout 86400;
    }
}
```

---

## 🧪 Tests de Verificación

### Test WebSocket Directo
```bash
timeout 5 curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
  -H "Sec-WebSocket-Version: 13" \
  https://cloverbi.neosolutions.com.ar:19443/

# Respuesta esperada:
# HTTP/1.1 101 Switching Protocols
# Connection: upgrade
# Upgrade: websocket
```

### Test Node.js Completo
```javascript
const WebSocket = require('ws');
const ws = new WebSocket('wss://cloverbi.neosolutions.com.ar:19443');

ws.on('open', () => console.log('✅ Connected'));
ws.on('message', (data) => {
    const msg = JSON.parse(data);
    if (msg.event === 'connect.challenge') {
        ws.send(JSON.stringify({
            type: 'req', id: '1', method: 'connect',
            params: {
                auth: { token: 'CLOVER_TOKEN' },
                role: 'operator'
            }
        }));
    }
});
```

### Test Frontend Config
```bash
curl -s https://cloverbi.neosolutions.com.ar/api/config

# Respuesta esperada:
# {
#   "gatewayUrl": "wss://cloverbi.neosolutions.com.ar:19443",
#   "gatewayToken": "b7de372ef0d3a2edd5b5411ad5e4561c516090456ec50950"
# }
```

---

## ⚠️ Problemas Comunes y Soluciones

### "Connection refused" en WSS
**Causa:** Puerto 19443 no está escuchando  
**Solución:** 
```bash
systemctl start nginx
ss -tlnp | grep :19443  # Verificar puerto activo
```

### "HTTP/2 200" en lugar de "101 Switching Protocols"
**Causa:** Nginx usando HTTP/2 para WebSocket  
**Solución:** Configurar server sin `http2` para WebSocket

### Backend devuelve token incorrecto
**Causa:** Container Ivy reiniciado con nuevo token  
**Solución:**
```bash
# Obtener nuevo token
docker exec clover-bi cat /home/node/.openclaw/openclaw.json | grep token

# Recrear backend con nuevo token
docker run -d --name cloverbi-backend \
  -e CLOVER_TOKEN=NEW_TOKEN_HERE \
  cloverbi/backend:latest
```

### Frontend muestra "Desconectado"
**Causa:** Mixed Content error o bad gateway URL  
**Verificación:**
1. Abrir DevTools → Console
2. Buscar errores Mixed Content
3. Verificar config API response
4. Test WebSocket directo en console

### Dashboard funciona pero Training no
**Causa típica:** WSS tunnel mal configurado  
**Debug:**
```bash
# Verificar ambos modos
curl -s -X POST http://localhost:3002/api/query -H "Content-Type: application/json" -d '{"prompt":"test"}'  # Dashboard
curl -s https://cloverbi.neosolutions.com.ar/api/config  # Training
```

---

## 📈 Métricas de la Sesión

- **Duración total:** 55 minutos
- **Problemas identificados:** 5 principales
- **Recreaciones de containers:** 6
- **Modificaciones nginx:** 8
- **Tests realizados:** 15+
- **Soluciones intentadas:** 12
- **Solución final:** WSS Tunnel dedicado

---

## 🔄 Lecciones Aprendidas

### Para Deployments Futuros

1. **Separar URLs desde el inicio**
   - Interna: `ws://172.17.0.1:19002`
   - Pública: `wss://domain:puerto`

2. **WebSocket siempre requiere HTTP/1.1**
   - No usar `http2` en servers que manejan WebSocket
   - Configurar proxy específico para WS

3. **Mixed Content es crítico en producción**
   - HTTPS pages requieren WSS
   - No se puede usar WS inseguro desde HTTPS

4. **Docker networking vs SSL**
   - Containers deben usar IPs internas
   - SSL solo en edge (nginx)

5. **Debugging sistemático**
   - Test directo a backend primero
   - Test navegador por separado
   - Logs en tiempo real

### Herramientas Útiles
```bash
# WebSocket debugging
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket"

# Nginx process management
pkill -f nginx && systemctl start nginx

# Docker container network inspection
docker network inspect cloverbi-net

# SSL certificate verification
openssl s_client -servername domain -connect domain:443
```

---

## ✅ Checklist para Futuros WebSocket Deployments

- [ ] Backend tiene URLs separadas (interna/pública)
- [ ] SSL certificates válidos para dominio
- [ ] Nginx configurado sin http2 para WebSocket
- [ ] WSS tunnel configurado si se necesita HTTPS→WS
- [ ] Docker containers usan IPs internas
- [ ] Tests de conectividad directa funcionan
- [ ] Mixed Content errors resueltos
- [ ] Frontend recibe config correcta
- [ ] Dashboard y Training funcionan independientemente

---

*Documentado: 2026-02-20 19:55 GMT-3*  
*CloverBI - Digital Flow*  
*Status: ✅ Completamente funcional*