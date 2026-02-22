# 📋 Plan de Implementación: Templates y Guardado de Consultas

> **Estado:** 🔴 URGENT  
> **Responsable:** @David  
> **Fecha:** 2026-02-16  
> **Estimación:** 3-5 días

---

## 🎯 Objetivo

Permitir a los usuarios guardar dashboards como templates reutilizables, tokenizando la data para poder re-ejecutar con datos actualizados.

---

## 🧠 Concepto

```
Usuario hace consulta
        ↓
Ivy genera dashboard HTML
        ↓
"Me gusta" → Guardar como template
        ↓
Extraer template:
  - HTML estructura (layout, charts)
  - Reemplazar data → {{placeholders}}
  - Vincular al prompt original
        ↓
Usuario elige template después
        ↓
Sistema ejecuta query, inyecta data nueva
        ↓
Dashboard actualizado con misma estética
```

---

## 📊 Modelo de Datos

### Tabla: `templates`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| org_id | UUID | FK → organizations |
| user_id | UUID | FK → users (creador) |
| name | VARCHAR(255) | Nombre del template |
| description | TEXT | Descripción opcional |
| original_prompt | TEXT | Consulta original que generó el dashboard |
| html_template | TEXT | HTML con placeholders |
| placeholder_schema | JSONB | Schema de placeholders y sus tipos |
| thumbnail | TEXT | Preview en base64 o URL |
| is_public | BOOLEAN | Compartido con la org |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### Tabla: `saved_queries`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| org_id | UUID | FK → organizations |
| user_id | UUID | FK → users |
| template_id | UUID | FK → templates (opcional) |
| name | VARCHAR(255) | Nombre de la consulta |
| prompt | TEXT | Consulta en español |
| last_result_html | TEXT | Último resultado generado |
| last_executed_at | TIMESTAMP | |
| execution_count | INT | Veces ejecutada |
| created_at | TIMESTAMP | |

### Ejemplo `placeholder_schema`:

```json
{
  "placeholders": [
    {
      "key": "{{total_ventas}}",
      "type": "currency",
      "source": "query_result.totals.ventas"
    },
    {
      "key": "{{chart_data}}",
      "type": "chart_array",
      "source": "query_result.charts[0].data"
    },
    {
      "key": "{{periodo}}",
      "type": "date_range",
      "source": "query_params.date_range"
    }
  ]
}
```

---

## 🔌 API Endpoints

### Templates

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/templates` | Listar templates del usuario/org |
| GET | `/api/templates/:id` | Obtener template específico |
| POST | `/api/templates` | Crear template desde dashboard |
| PUT | `/api/templates/:id` | Actualizar template |
| DELETE | `/api/templates/:id` | Eliminar template |
| POST | `/api/templates/:id/execute` | Ejecutar template con data fresca |

### Saved Queries

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/queries` | Listar consultas guardadas |
| GET | `/api/queries/:id` | Obtener consulta |
| POST | `/api/queries` | Guardar consulta |
| DELETE | `/api/queries/:id` | Eliminar consulta |
| POST | `/api/queries/:id/rerun` | Re-ejecutar consulta |

---

## 🎨 UI Components

### 1. Botón "Guardar como Template" (post-dashboard)

```
[💾 Guardar] [📋 Template] [📤 Compartir]
```

### 2. Modal "Guardar Template"

- Campo: Nombre
- Campo: Descripción
- Checkbox: Compartir con mi organización
- Preview: Thumbnail del dashboard
- Botones: Cancelar / Guardar Template

### 3. Galería de Templates (sidebar o home)

- Mis Templates (grid de cards)
- Templates de la Organización (si hay públicos)

---

## 🔧 Algoritmo de Tokenización

### Paso 1: Identificar elementos de data en el HTML

```javascript
function extractDataElements(html, queryResult) {
  const dataPoints = [];
  
  // Buscar valores numéricos que coincidan con resultados
  for (const [key, value] of Object.entries(flattenObject(queryResult))) {
    if (html.includes(String(value))) {
      dataPoints.push({
        value: value,
        path: key,
        type: detectType(value)
      });
    }
  }
  
  return dataPoints;
}
```

### Paso 2: Reemplazar por placeholders

```javascript
function tokenizeHtml(html, dataPoints) {
  let template = html;
  const schema = { placeholders: [] };
  
  for (const dp of dataPoints) {
    const placeholder = `{{${dp.path}}}`;
    template = template.replaceAll(String(dp.value), placeholder);
    schema.placeholders.push({
      key: placeholder,
      type: dp.type,
      source: dp.path
    });
  }
  
  return { template, schema };
}
```

### Paso 3: Re-hidratar template

```javascript
function hydrateTemplate(template, schema, newData) {
  let html = template;
  
  for (const ph of schema.placeholders) {
    const value = getValueByPath(newData, ph.source);
    const formatted = formatByType(value, ph.type);
    html = html.replaceAll(ph.key, formatted);
  }
  
  return html;
}
```

---

## 📅 Plan de Ejecución

### Día 1-2: Backend

- [ ] Crear migraciones para tablas `templates` y `saved_queries`
- [ ] Implementar modelo y repositorio
- [ ] Crear endpoints CRUD básicos
- [ ] Tests unitarios

### Día 3: Algoritmo de Tokenización

- [ ] Implementar `extractDataElements()`
- [ ] Implementar `tokenizeHtml()`
- [ ] Implementar `hydrateTemplate()`
- [ ] Tests con HTMLs reales de Ivy

### Día 4: UI

- [ ] Componente botón "Guardar como Template"
- [ ] Modal de guardado
- [ ] Galería de templates
- [ ] Integración con flujo existente

### Día 5: Testing & Polish

- [ ] Tests e2e del flujo completo
- [ ] Manejo de errores
- [ ] Loading states
- [ ] Deploy a staging

---

## ⚠️ Consideraciones

### Edge Cases

1. **Charts dinámicos**: Los datos de Chart.js están en `<script>`. Hay que tokenizar también el JS.
2. **Fechas relativas**: "Este mes" debe recalcularse, no hardcodearse.
3. **Múltiples valores iguales**: Si aparece "100" varias veces, ¿cuál tokenizar?
4. **HTML muy largo**: Considerar compresión para storage.

### Decisiones Pendientes

- [ ] ¿Templates públicos entre organizaciones? (marketplace)
- [ ] ¿Versionado de templates?
- [ ] ¿Límite de templates por plan?

---

## 🔗 Referencias

- Backlog item: `05-roadmap.md` → Sprint Febrero 2026
- Ivy agent: `clovers/base:v4`
- Frontend repo: `/cloverbi-frontend`
- Backend repo: `/cloverbi-backend`

---

*Documento creado: 2026-02-16*  
*Última actualización: 2026-02-16*
