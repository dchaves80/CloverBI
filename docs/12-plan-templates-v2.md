# 📋 Plan de Templates v2: Ivy-Native Templating

> **Estado:** 🚧 En Progreso  
> **Autor:** Cloe  
> **Fecha:** 2026-02-17  
> **Última actualización:** 2026-02-17 17:00  
> **Supersede:** 11-plan-templates.md (approach anterior)

---

## 🎯 Resumen Ejecutivo

Templates permiten guardar dashboards generados y re-ejecutarlos con datos frescos sin necesidad de volver a consultar a Ivy (AI).

**Approach elegido:** Ivy genera HTML con **metadata comments** (`<!--CLOVER:*-->`) que incluyen las queries SQL. Un parser extrae esta metadata para crear templates reutilizables.

---

## ✅ Progreso Actual

### Completado Hoy (2026-02-17)

| Tarea | Status | Notas |
|-------|--------|-------|
| Base de datos CloverBI | ✅ | 154.12.252.27:2433 |
| Tabla `templates` | ✅ | Con multi-query support |
| Backend CRUD | ✅ | GET, POST, PUT, DELETE funcionando |
| Multi-query (`queries` JSON) | ✅ | Cambio de `required_query` a `queries` objeto |
| SOUL.md de Ivy actualizado | ✅ | Genera metadata CLOVER |
| Ivy genera metadata | ✅ | Probado y funcionando |

### Pendiente

| Tarea | Prioridad | Estimación |
|-------|-----------|------------|
| Parser de metadata (backend) | 🔴 Alta | 2-3 horas |
| Endpoint POST /api/templates/from-html | 🔴 Alta | 1 hora |
| Frontend: Botón "Guardar Template" | 🟠 Media | 2-3 horas |
| Frontend: Lista de templates | 🟠 Media | 2-3 horas |
| Endpoint POST /api/templates/:id/execute | 🟡 Baja | 3-4 horas |
| Frontend: Ejecutar template | 🟡 Baja | 2-3 horas |

---

## 🔄 Flujo Actualizado (Con Metadata)

### Guardado de Template

```
1. Usuario pide dashboard → Ivy genera HTML CON metadata
2. Usuario ve dashboard, le gusta, clickea "💾 Guardar Template"
3. Frontend envía HTML completo al backend
4. Backend parsea los comentarios <!--CLOVER:*-->
5. Extrae: queries, tipos de componentes, IDs
6. Guarda en tabla templates
```

### Formato de Metadata (ya implementado en Ivy)

```html
<!--CLOVER:BEGIN type="chart" id="ventasPorMes"-->
<!--CLOVER:SQL SELECT mes, SUM(total) FROM ventas GROUP BY mes-->
<div class="chart-container">
  <canvas id="chart_ventasPorMes"></canvas>
  <script>
    const data = {...};
    new Chart(...);
  </script>
</div>
<!--CLOVER:END-->

<!--CLOVER:BEGIN type="kpi" id="totalVentas"-->
<!--CLOVER:SQL SELECT SUM(total) as value FROM ventas-->
<div class="kpi-card">
  <span class="value">$46,000</span>
</div>
<!--CLOVER:END-->

<!--CLOVER:BEGIN type="table" id="topClientes"-->
<!--CLOVER:SQL SELECT TOP 10 cliente, total FROM ventas ORDER BY total DESC-->
<table>...</table>
<!--CLOVER:END-->
```

---

## 🔧 Próximo Paso: Parser de Metadata

### Endpoint Propuesto

```
POST /api/templates/from-html
Content-Type: application/json

{
  "name": "Top 5 Pozos",
  "description": "Dashboard de mejores pozos por producción",
  "html": "<!DOCTYPE html>...<!--CLOVER:BEGIN-->...<!--CLOVER:END-->...</html>",
  "base_prompt": "mostrame los top 5 pozos",
  "org_id": "xxx",
  "user_id": "xxx",
  "is_public": false,
  "tags": ["pozos", "produccion"]
}
```

### Lógica del Parser

```typescript
function parseCloverMetadata(html: string) {
  const regex = /<!--CLOVER:BEGIN type="(\w+)" id="(\w+)"-->\s*<!--CLOVER:SQL (.*?)-->/gs;
  const components: CloverComponent[] = [];
  const queries: Record<string, string> = {};
  
  let match;
  while ((match = regex.exec(html)) !== null) {
    const [_, type, id, sql] = match;
    components.push({ type, id, sql });
    queries[id] = sql;
  }
  
  // Generar binding_schema automáticamente
  const binding_schema = {
    version: "2.0",
    components: components.map(c => ({
      id: c.id,
      type: c.type,
      dataSource: c.id
    }))
  };
  
  // Generar template_html (HTML con datos reemplazados por placeholders)
  // Por ahora guardamos el HTML original
  const template_html = html;
  
  return { queries, binding_schema, template_html };
}
```

### Response

```json
{
  "success": true,
  "id": "uuid-del-template",
  "message": "Template creado",
  "extracted": {
    "components": 3,
    "queries": ["ventasPorMes", "totalVentas", "topClientes"]
  }
}
```

---

## 📊 Modelo de Datos (Actualizado)

### Tabla: `templates` (Ya creada)

| Campo | Tipo | Status | Descripción |
|-------|------|--------|-------------|
| id | UNIQUEIDENTIFIER | ✅ | PK |
| org_id | NVARCHAR(255) | ✅ | Organización |
| user_id | NVARCHAR(255) | ✅ | Usuario creador |
| name | NVARCHAR(255) | ✅ | Nombre |
| description | NVARCHAR(MAX) | ✅ | Descripción |
| base_prompt | NVARCHAR(MAX) | ✅ | Prompt original |
| template_html | NVARCHAR(MAX) | ✅ | HTML con metadata |
| binding_schema | NVARCHAR(MAX) | ✅ | JSON de binding |
| queries | VARCHAR(MAX) | ✅ | JSON de queries nombradas |
| thumbnail | NVARCHAR(MAX) | ✅ | Preview base64 |
| is_public | BIT | ✅ | Compartido |
| tags | NVARCHAR(MAX) | ✅ | Tags CSV |
| created_at | DATETIME | ✅ | Creación |
| updated_at | DATETIME | ✅ | Actualización |

---

## 🎨 UI (Propuesta Simplificada)

### Fase 1: Mínimo Viable

1. **Botón en el dashboard**: "💾 Guardar como Template"
2. **Modal simple**: Nombre + Descripción + Tags
3. **Lista básica**: Cards con nombre y fecha

### Fase 2: Features Completos

1. Galería con thumbnails
2. Búsqueda por tags
3. Filtro público/privado
4. Ejecución con parámetros
5. Preview antes de ejecutar

---

## 📅 Plan de Ejecución Actualizado

### ✅ Fase 1: Backend Base (COMPLETADO)

- [x] Crear base de datos CloverBI
- [x] Crear tabla templates
- [x] CRUD endpoints
- [x] Multi-query support
- [x] Ivy genera metadata CLOVER

### 🚧 Fase 2: Parser y Guardado (SIGUIENTE)

- [ ] Función `parseCloverMetadata()`
- [ ] Endpoint `POST /api/templates/from-html`
- [ ] Tests con HTML real de Ivy

### 📋 Fase 3: Frontend Básico

- [ ] Botón "Guardar Template" en dashboard
- [ ] Modal de creación
- [ ] Lista de templates
- [ ] Abrir/ver template guardado

### 📋 Fase 4: Ejecución

- [ ] Endpoint `POST /api/templates/:id/execute`
- [ ] Re-ejecutar queries
- [ ] Inyectar datos frescos en HTML
- [ ] UI de ejecución

---

## 🔗 Referencias

- Branch: `feature/templates-v2`
- Backend: `/mnt/e/Projects/CloverBI/backend/`
- Ivy SOUL: `/data/clovers/clover-bi/workspace/SOUL.md`
- DB: CloverBI @ 154.12.252.27:2433

---

*Documento actualizado: 2026-02-17 17:00*  
*Autor: Cloe Cloverfield*
