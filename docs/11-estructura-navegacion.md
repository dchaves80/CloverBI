# 11. Estructura de Navegación

*Agregado: 2026-02-22*

---

## 🎯 Sidebar Principal

```
Login
  ↓
┌─────────────────────────────────────┐
│ 🏠 Overview                          │
│ 🔍 Explorar                          │
│ 🎓 Training                          │
│ 📁 Workspaces                        │
│    └─ Digital Flow Analytics         │
│        ├─ 📊 Ranking Choferes        │
│        ├─ 📊 Ventas por Región       │
│        └─ 📊 Inventario              │
│                                      │
│ ⚙️ Configuración                     │
│ 👤 Perfil / Logout                   │
└─────────────────────────────────────┘
```

---

## 📄 Secciones

### 🏠 Overview

**Propósito:** Página de inicio con resumen de actividad.

**Contenido:**
- Actividad reciente (últimas queries, dashboards visitados)
- Logs de sistema
- Resumen de uso (queries realizadas, tokens consumidos)
- Accesos rápidos a dashboards favoritos

---

### 🔍 Explorar

**Propósito:** Queries ad-hoc con Ivy en lenguaje natural.

**Características:**
- ⚡ Consume tokens (cada query es en tiempo real)
- 💾 **Cada card generada tiene botón [Guardar como Card]**
- 📁 **Botón [Guardar Sesión] para guardar TODAS las cards de una vez**
- Ideal para exploración y análisis rápidos

**Flujo:**

```
┌─────────────────────────────────────┐
│  🔍 Explorar    [📁 Guardar Sesión] │ ← Botón nuevo
├─────────────────────────────────────┤
│  ┌────────────────────────────────┐ │
│  │ Preguntale a Ivy...            │ │
│  └────────────────────────────────┘ │
│             [Enviar]                │
└─────────────────────────────────────┘

Usuario: "Top 10 choferes por KM este mes"
  ↓ Ivy genera card (consume tokens)
  
┌─────────────────────────────────────┐
│  📊 Top 10 Choferes                 │
│  ┌────────────────────────────────┐ │
│  │  1. Juan - 1250 KM             │ │
│  │  2. Pedro - 1100 KM            │ │
│  │  3. María - 980 KM             │ │
│  │  ...                           │ │
│  └────────────────────────────────┘ │
│              [💾 Guardar como Card] │ ← Guardar individual
└─────────────────────────────────────┘

Usuario puede seguir preguntando...

Usuario: "Consumo promedio de combustible por chofer"
  ↓ Ivy genera otra card
  
┌─────────────────────────────────────┐
│  ⛽ Consumo Promedio                │
│  ┌────────────────────────────────┐ │
│  │  [Gráfico de barras]           │ │
│  │  Juan: 8.5 L/100km             │ │
│  │  Pedro: 9.2 L/100km            │ │
│  └────────────────────────────────┘ │
│              [💾 Guardar como Card] │ ← Guardar individual
└─────────────────────────────────────┘
```

**Al hacer click en [💾 Guardar como Card] (individual):**

```
┌──────────────────────────────────────┐
│  💾 Guardar Card                     │
│                                      │
│  Workspace:                          │
│  [Digital Flow Analytics ▼]          │
│                                      │
│  Dashboard:                          │
│  [Ranking Choferes ▼]                │
│                                      │
│  O crear nuevo dashboard:            │
│  [ Nuevo Dashboard... ]              │
│                                      │
│         [Cancelar]  [Guardar]        │
└──────────────────────────────────────┘
```

**Resultado:**
- Card se guarda en el dashboard seleccionado
- Con SQL + visualización + config
- Próximos refreshes del dashboard NO consumen tokens

---

### 🎓 Training

**Propósito:** Entrenar a Ivy con el esquema y contexto de la base de datos.

**Contenido:**
- Upload de esquemas SQL
- Ejemplos de queries comunes
- Definiciones de métricas de negocio
- Contexto específico del dominio

**Scope:** Global (afecta a todos los workspaces del usuario)

---

### 📁 Workspaces

**Propósito:** Organizar dashboards por contexto/proyecto.

**Jerarquía:**
```
Workspace
  └─ Dashboard
      └─ Card (SQL + visualización guardada)
```

**Vista de Dashboard:**

```
┌─────────────────────────────────────┐
│  📊 Ranking Choferes    [+ Card]    │
├──────────────┬──────────────────────┤
│              │                      │
│  Card 1      │     Card 2           │
│  Top 10      │     KM Recorridos    │
│              │                      │
├──────────────┴──────────────────────┤
│                                     │
│  Card 3: Eficiencia Combustible     │
│                                     │
└─────────────────────────────────────┘
```

**Click en [+ Card]:**

```
┌──────────────────────────────────────┐
│  🤖 Agregar Card                     │
│  ┌────────────────────────────────┐  │
│  │ Preguntale a Ivy...            │  │
│  └────────────────────────────────┘  │
│                          [Generar]   │
└──────────────────────────────────────┘
```

Ivy genera preview, usuario confirma, card se agrega al dashboard.

**Características:**
- ✅ Refreshes automáticos (sin tokens)
- ✅ Grid layout con drag & drop
- ✅ Editar/eliminar cards existentes

---

## 🔄 Tres Caminos para Crear Cards

### Camino 1: Card Individual desde Explorar

```
Explorar → Query en lenguaje natural → Preview card
  ↓ (si te gusta)
[💾 Guardar como Card] → Seleccionar workspace/dashboard
  ↓
Una card guardada
```

**Ventaja:** Control granular, probás antes de guardar  
**Uso típico:** "Esta métrica específica me sirve"

---

### Camino 2: Card Directa desde Dashboard

```
Dashboard → [+ Card] → Query en lenguaje natural → Preview
  ↓ (si te gusta)
[Agregar] → Card se agrega al dashboard
  ↓
Card creada en contexto
```

**Ventaja:** Creación directa en el lugar correcto  
**Uso típico:** "Necesito agregar esto al dashboard de ventas"

---

### Camino 3: Sesión Completa ⭐ NUEVO

```
Explorar → Múltiples queries → Múltiples cards generadas
  ↓ (todas te sirven)
[📁 Guardar Sesión] → Crear/seleccionar workspace
  ↓
Dashboard completo creado con todas las cards
```

**Ventaja:** Análisis exploratorio → Dashboard permanente en un click  
**Uso típico:** "Toda esta exploración me sirve, quiero guardarla completa"

---

## 🆕 Guardar Sesión Completa como Dashboard

**Funcionalidad:** Convertir todo el panel de Explorar en un dashboard de un solo click.

### Escenario de Uso

```
Usuario en Explorar hace varias queries exploratorias:
  ├─ Card 1: Top 10 choferes por KM
  ├─ Card 2: Consumo promedio de combustible
  ├─ Card 3: KM totales por región
  └─ Card 4: Eficiencia por tipo de vehículo

Usuario ve que TODAS las cards le sirven
  ↓
[📁 Guardar Sesión como Dashboard]
  ↓
Todas las cards se guardan juntas en un nuevo dashboard ✅
```

### Modal de Guardado Completo

**Al hacer click en [📁 Guardar Sesión]:**

```
┌──────────────────────────────────────┐
│  📁 Guardar Sesión como Dashboard    │
│                                      │
│  Se guardarán 4 cards                │
│                                      │
│  Workspace:                          │
│  ( ) Usar existente:                 │
│      [Digital Flow Analytics ▼]      │
│                                      │
│  (•) Crear nuevo workspace:          │
│      [Análisis Febrero 2026______]   │
│                                      │
│  Nombre del Dashboard:               │
│  [Dashboard Exploración 22/02____]   │
│                                      │
│  Layout:                             │
│  ( ) Grid automático (2 columnas)    │
│  (•) Lista vertical                  │
│  ( ) Grid personalizado              │
│                                      │
│         [Cancelar]  [Guardar Todo]   │
└──────────────────────────────────────┘
```

### Opciones de Guardado

**Workspace:**
- **Usar existente:** Agrega el dashboard a un workspace ya creado
- **Crear nuevo:** Crea workspace + dashboard en un solo paso

**Layout:**
- **Grid automático (2 columnas):** Cards organizadas en 2 columnas
- **Lista vertical:** Cards apiladas verticalmente
- **Grid personalizado:** Usuario ajusta después con drag & drop

### Comportamiento

**Después de guardar:**
1. Sistema crea workspace (si es nuevo)
2. Sistema crea dashboard
3. Todas las cards de la sesión se copian al dashboard
4. Cada card mantiene su SQL + visualización
5. Usuario es redirigido al nuevo dashboard
6. La sesión de Explorar se limpia (opcional: preguntar antes)

---

## 💡 Casos de Uso Reales

### Caso 1: Análisis de Fin de Mes

**Escenario:** Cierre de febrero, necesitás métricas rápidas

```
Explorar:
  - "Ventas totales febrero"
  - "Top productos vendidos"
  - "Clientes nuevos vs recurrentes"
  - "Comparativa febrero vs enero"
  
Usuario: [📁 Guardar Sesión]
  Workspace: "Reportes Mensuales"
  Dashboard: "Febrero 2026"
  
→ Dashboard creado con 4 cards
→ El mes que viene repetís para "Marzo 2026"
```

---

### Caso 2: Investigación Ad-Hoc

**Escenario:** Algo raro en los números, investigás

```
Explorar:
  - "Ventas por día última semana"
  - "Anomalías en inventario"
  - "Devoluciones por producto"
  - "Transacciones fallidas"
  
Si encontrás insights valiosos:
  [📁 Guardar Sesión] → "Análisis Anomalías Feb"
  
Si no sirve:
  Descartás todo (no guardás nada)
```

---

### Caso 3: Onboarding de Cliente Nuevo

**Escenario:** Cliente nuevo, necesita dashboards básicos rápido

```
Explorar (generar ejemplos):
  - "Ventas últimos 30 días"
  - "Productos más vendidos"
  - "Clientes top 20"
  - "Inventario actual"
  
[📁 Guardar Sesión]
  Workspace: "Cliente - {Nombre}"
  Dashboard: "Overview General"
  
→ Dashboard starter listo en minutos
→ Cliente puede iterar desde ahí
```

---

## 💡 Diferencias Clave

| Aspecto | Explorar | Workspaces |
|---------|----------|------------|
| **Propósito** | Exploración ad-hoc | Reportes recurrentes |
| **Tokens** | Consume en cada query | Solo al crear/editar |
| **Persistencia** | Temporal (se puede guardar) | Permanente |
| **Refresh** | No aplica | Automático sin tokens |
| **Uso típico** | "¿Qué pasó ayer?" | "Dashboard de ventas diario" |
| **Guardar sesión** | ✅ Todas las cards de una vez | N/A |

---

## 🎨 Flujo de Trabajo Mejorado

```
1. Training: Subir esquema + contexto de la DB
   ↓
2. Explorar: Hacer múltiples queries exploratorias
   "Top 10 choferes"
   "Consumo por región"
   "Eficiencia por vehículo"
   "Tendencia últimos 30 días"
   ↓
3. Revisar cards generadas
   ↓
4a. [💾 Individual] si solo algunas te sirven
    O
4b. [📁 Guardar Sesión] si todas te sirven
   ↓
5. Dashboard creado automáticamente
   ↓
6. Refreshes diarios/por hora sin gastar tokens ✅
```

---

## 🔧 Consideraciones de Implementación

### Backend

**Endpoint nuevo:**
```typescript
POST /api/sessions/save-as-dashboard

Body:
{
  "sessionId": "uuid",              // ID de la sesión de Explorar
  "workspaceId": "uuid" | null,     // null = crear nuevo
  "workspaceName": "string" | null, // Solo si workspaceId es null
  "dashboardName": "string",
  "layout": "grid-2col" | "vertical" | "custom",
  "clearSession": boolean           // Limpiar sesión después de guardar
}

Response:
{
  "workspaceId": "uuid",
  "dashboardId": "uuid",
  "cardsCreated": 4,
  "redirectUrl": "/workspaces/{id}/dashboards/{id}"
}
```

### Frontend

**Estado de Explorar:**
```typescript
interface ExplorarSession {
  id: string;
  cards: Card[];        // Cards generadas en esta sesión
  createdAt: Date;
  updatedAt: Date;
}
```

**Persistencia temporal:**
- Sesión de Explorar persiste en localStorage o sessionStorage
- Se limpia al guardar como dashboard (opcional)
- O se mantiene para seguir explorando

---

## ⚠️ Edge Cases

### ¿Qué pasa si la sesión está vacía?

**Botón [📁 Guardar Sesión] deshabilitado** si no hay cards generadas.

```typescript
<button 
  disabled={session.cards.length === 0}
  onClick={handleSaveSession}
>
  📁 Guardar Sesión ({session.cards.length})
</button>
```

---

### ¿Qué pasa si solo hay 1 card?

**El botón sigue disponible** pero muestra advertencia:

```
┌──────────────────────────────────────┐
│  📁 Guardar Sesión como Dashboard    │
│                                      │
│  Se guardará 1 card                  │
│                                      │
│  💡 Recomendación:                   │
│  Si es una sola card, considera usar │
│  [💾 Guardar como Card] en vez de    │
│  crear un dashboard completo.        │
│                                      │
│  ¿Continuar de todas formas?         │
│         [Cancelar]  [Sí, Guardar]    │
└──────────────────────────────────────┘
```

---

### ¿Limpiar sesión después de guardar?

**Prompt al usuario:**

```
✅ Dashboard creado exitosamente!

¿Qué querés hacer con la sesión de Explorar?

( ) Mantener cards (seguir explorando)
(•) Limpiar sesión (empezar de cero)

[Ir al Dashboard]  [Seguir Explorando]
```

---

## ⚙️ Configuración

**Contenido:**
- Conexiones a bases de datos
- Tokens/API keys
- Preferencias de visualización
- Configuración de refresh automático

---

## 👤 Perfil

**Contenido:**
- Datos de usuario
- Estadísticas de uso
- Logout

---

*Estructura definida: 2026-02-22 08:22 GMT-3*
*Funcionalidad "Guardar Sesión" agregada: 2026-02-22 08:50 GMT-3*
*Documentado por: Cloe 💜*
