# 10. Workspaces - Requerimiento Esencial

*Agregado: 2026-02-22*

---

## 🎯 Concepto

CloverBI necesita un sistema de **Workspaces** para organizar dashboards y optimizar el consumo de tokens.

### Jerarquía

```
Workspace (ej: "Digital Flow Analytics")
  ├── Dashboard 1: "Ranking Choferes"
  │   ├── Card 1: Top 10 choferes (SQL + HTML guardados)
  │   ├── Card 2: KM recorridos (SQL + HTML guardados)
  │   └── Card 3: Eficiencia combustible (SQL + HTML guardados)
  │
  ├── Dashboard 2: "Ventas por Región"
  │   ├── Card 1: Mapa de calor (SQL + HTML guardados)
  │   └── Card 2: Tabla comparativa (SQL + HTML guardados)
  │
  └── Dashboard 3: "Inventario"
      └── Card 1: Stock crítico (SQL + HTML guardados)
```

---

## 🔄 Flujo de Trabajo

### 1. Crear Card (Con Ivy - Consume Tokens)

```
Usuario: "Dame los top 10 choferes por km recorridos este mes"
  ↓ (consume tokens - Ivy genera)
Ivy: 
  - Genera SQL query
  - Genera HTML de la card (gráfico/tabla/pie/etc.)
  ↓
Usuario: Ve preview de la card
  ↓ (si le gusta)
Usuario: Arrastra la card al dashboard
  ↓
Card guardada en DB con:
  - SQL query
  - HTML/configuración de visualización
  - Asociada al dashboard
```

### 2. Refresh Dashboard (Sin Ivy - Zero Tokens)

```
Usuario: Refresca dashboard
  ↓ (SIN consumir tokens)
Sistema: 
  - Lee cards del dashboard
  - Ejecuta SQLs guardadas
  - Renderiza HTML guardado con datos frescos
  ↓
Dashboard actualizado
```

---

## ⚡ Beneficio Clave

**Tokens solo se gastan al crear/editar cards.**

**Los refreshes NO consumen tokens** - solo ejecutan SQL y renderizan.

---

## 📊 Modelo de Datos

### Workspace

```typescript
interface Workspace {
  id: string;
  name: string;
  description?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Dashboard

```typescript
interface Dashboard {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  layout?: any; // Grid layout config
  createdAt: Date;
  updatedAt: Date;
}
```

### Card

```typescript
interface Card {
  id: string;
  dashboardId: string;
  name: string;
  sqlQuery: string;           // Query SQL guardada
  visualization: {
    type: 'table' | 'chart' | 'pie' | 'map' | 'kpi';
    config: any;              // Configuración específica
    html?: string;            // HTML template guardado
  };
  position?: {                // Posición en el dashboard
    x: number;
    y: number;
    w: number;
    h: number;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🚀 Flujo de Implementación

### Fase 1: Estructura básica
- [ ] Crear modelo Workspace
- [ ] Crear modelo Dashboard
- [ ] Crear modelo Card
- [ ] CRUD básico de workspaces
- [ ] CRUD básico de dashboards

### Fase 2: Creación de Cards
- [ ] Endpoint para generar card con Ivy (lenguaje natural)
- [ ] Preview de card generada
- [ ] Drag & drop para agregar card a dashboard
- [ ] Guardar SQL + HTML/config en DB

### Fase 3: Visualización
- [ ] Renderizar dashboard con cards guardadas
- [ ] Ejecutar SQLs y poblar datos
- [ ] Refresh automático/manual
- [ ] Grid layout drag & drop

### Fase 4: Optimizaciones
- [ ] Cache de resultados SQL
- [ ] Refresh parcial (solo cards visibles)
- [ ] Editar/eliminar cards existentes
- [ ] Duplicar cards entre dashboards

---

## 💡 Casos de Uso

### Ejemplo: Dashboard "Ranking Choferes"

**Card 1: Top 10 Choferes**
- Usuario pide: "Top 10 choferes por KM recorridos este mes"
- Ivy genera SQL: `SELECT nombre, SUM(km) FROM viajes WHERE mes=2 GROUP BY nombre ORDER BY SUM(km) DESC LIMIT 10`
- Ivy genera: Tabla HTML con ranking
- Usuario arrastra al dashboard
- Cada refresh ejecuta la SQL con datos frescos (sin tokens)

**Card 2: Eficiencia Combustible**
- Usuario pide: "Consumo promedio de combustible por chofer"
- Ivy genera SQL + gráfico de barras
- Usuario arrastra al dashboard
- Refresh automático sin tokens

---

## 🎨 UI/UX Propuesta

### Sidebar
```
📁 Workspaces
  └─ Digital Flow Analytics
      ├─ 📊 Ranking Choferes
      ├─ 📊 Ventas por Región
      └─ 📊 Inventario
```

### Vista Dashboard
```
┌─────────────────────────────────────┐
│  Ranking Choferes          [+ Card] │
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

### Flujo de Creación de Card
```
[+ Card] → Modal con input de lenguaje natural
  ↓
"Top 10 choferes por KM este mes"
  ↓
[Preview] → Muestra card generada
  ↓
[Arrastrar al dashboard]
  ↓
Card guardada ✅
```

---

## 📈 Impacto en Costos

### Sin Workspaces (estado actual)
- Cada refresh = llamada a Ivy = tokens gastados
- 100 refreshes/día × dashboards = 1620132$ insostenible

### Con Workspaces (propuesto)
- Creación de card = tokens (una sola vez)
- 1000 refreshes = /bin/sh en tokens (solo queries SQL)
- **Reducción de costos: ~95%+**

---

## 🔗 Relación con Docs Existentes

- **[02-arquitectura.md](02-arquitectura.md)** - Actualizar flujos para incluir workspaces
- **[03-frontend.md](03-frontend.md)** - Agregar páginas de workspaces/dashboards
- **[04-mvp.md](04-mvp.md)** - Incluir workspaces en scope MVP
- **[05-roadmap.md](05-roadmap.md)** - Agregar fases de implementación

---

*Requerimiento esencial identificado: 2026-02-22 07:09 GMT-3*
*Documentado por: Cloe 💜*
