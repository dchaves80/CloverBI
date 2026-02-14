# ⚠️ CloverBI - Known Issues & Propuestas

## 1. Timeout en consultas largas

### Problema

Las consultas de dashboard pueden tardar **hasta 10 minutos** cuando Ivy:
- Analiza bases de datos grandes
- Genera múltiples gráficos
- Ejecuta queries complejas

### Solución actual (workaround)

Aumentamos timeouts a 10 minutos:

| Componente | Configuración | Valor |
|------------|---------------|-------|
| Nginx | `proxy_read_timeout` | 600s |
| Backend | `CloverClient.timeout` | 600000ms |

**Problema:** Mala UX - el usuario espera sin feedback visual.

### Propuestas de mejora

| # | Solución | Esfuerzo | UX | Descripción |
|---|----------|----------|-----|-------------|
| 1 | **WebSocket** | Medio | ⭐⭐⭐ | Dashboard usa WS como Training. Streaming real del progreso |
| 2 | **SSE (Server-Sent Events)** | Medio | ⭐⭐⭐ | Backend envía eventos de progreso. Más simple que WS |
| 3 | **Polling con Job ID** | Alto | ⭐⭐ | Backend devuelve job ID, frontend hace polling. Robusto pero complejo |
| 4 | **Progress indicators** | Bajo | ⭐⭐ | Agregar mensajes "Conectando...", "Ejecutando SQL...", "Generando gráficos..." |

### Recomendación

**Fase 1 (quick win):** Opción 4 - Progress indicators en frontend
- Mostrar spinner con etapas
- "Ivy está pensando..." → "Consultando datos..." → "Generando dashboard..."

**Fase 2 (ideal):** Opción 1 - WebSocket
- Ya tenemos infra funcionando en Training
- Reutilizar `CloverClient` pero con streaming
- Frontend recibe chunks y muestra progreso real

---

## 2. [Próximo issue aquí]

*Documentar issues a medida que aparezcan*

---

*Actualizado: 2026-02-14*
*CloverBI - Digital Flow*
