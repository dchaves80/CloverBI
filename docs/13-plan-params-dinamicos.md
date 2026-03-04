# 📋 Plan: Templates con Parámetros Dinámicos de Fecha

> **Estado:** 🚧 En progreso — Fase 1 ✅ Fase 2 ✅  
> **Autor:** Cloe Cloverfield  
> **Fecha:** 2026-03-03  

---

## 🎯 Objetivo

Permitir que los templates guardados sean **reutilizables con rangos de fecha dinámicos**, sin consumir tokens de IA en cada re-ejecución.

**Primera vez (tokens):**
`Usuario pregunta → Ivy genera HTML + SQL con {{fecha_inicio}}/{{fecha_fin}} → Template guardado`

**Todas las veces siguientes (cero tokens):**
`Usuario abre template → elige rango de fechas → sistema sustituye params → ejecuta SQL → HTML fresco`

---

## Fase 1 — SOUL de Ivy ✅
- [x] Definir cuándo Ivy usa placeholders: cuando el dashboard involucra rangos de tiempo (últimos N días, mes específico, trimestre, etc.)
- [x] Agregar al SOUL el formato `CLOVER:PARAMS` — bloque al inicio del HTML
- [x] Agregar instrucción: queries con fechas deben usar `{{fecha_inicio}}` / `{{fecha_fin}}` en lugar de fechas hardcodeadas
- [x] Agregar CONCEPTO FUNDAMENTAL: dashboards son templates reutilizables (clave para que el modelo entienda el propósito)
- [x] Actualizar el ejemplo de estructura completa en el SOUL
- [x] Reiniciar Ivy y probar que genera placeholders correctamente

**Formato CLOVER:PARAMS:**
```html
<!--CLOVER:PARAMS-->
<!--fecha_inicio:date:Desde:2026-01-01-->
<!--fecha_fin:date:Hasta:2026-03-03-->
<!--CLOVER:PARAMS:END-->
```

**Queries con placeholders:**
```sql
SELECT fecha, SUM(produccion) FROM tabla 
WHERE fecha BETWEEN '{{fecha_inicio}}' AND '{{fecha_fin}}'
```

---

## Fase 2 — Backend Parser ✅

- [x] Agregar función `parseCloverParams(html)` → detecta y extrae el bloque `CLOVER:PARAMS`
- [x] Retorna `{ fecha_inicio: { type: 'date', label: 'Desde', default: '...' }, ... }`
- [x] Guardar params en columna `binding_schema` de la tabla `templates` (ya existe)
- [x] Agregar `stripCloverParams()` → limpia el bloque de params del HTML guardado (metadata interna, no visual)

**Estructura del binding_schema:**
```json
{
  "version": "2.0",
  "params": {
    "fecha_inicio": { "type": "date", "label": "Desde", "default": "2026-01-01" },
    "fecha_fin":    { "type": "date", "label": "Hasta",  "default": "2026-03-03" }
  },
  "components": [
    { "id": "produccionMensual", "type": "chart" }
  ]
}
```

---

## Fase 3 — Backend Execute Endpoint

- [ ] Implementar `POST /api/templates/:id/execute` (hoy tiene TODO)
- [ ] Recibe `{ parameters: { fecha_inicio: '2026-01-01', fecha_fin: '2026-03-03' } }`
- [ ] Lee queries del template desde DB
- [ ] Sustituye `{{fecha_inicio}}` / `{{fecha_fin}}` en cada SQL
- [ ] Ejecuta queries contra la DB del cliente
- [ ] Inyecta datos frescos en el HTML guardado
- [ ] Devuelve HTML con datos actualizados

**Endpoint:**
```
POST /api/templates/:id/execute
Body: { parameters: { fecha_inicio: string, fecha_fin: string } }
Response: { success: true, html: string }
```

---

## Fase 4 — Frontend Workspaces

- [ ] Al abrir template: detectar si tiene params (`binding_schema.params` no vacío)
- [ ] Si tiene params → mostrar `DateRangePanel` antes de renderizar
- [ ] `DateRangePanel`: date picker "Desde" / "Hasta" + botón "🔄 Ejecutar"
- [ ] Llamar a `POST /api/templates/:id/execute` con los params elegidos
- [ ] Mostrar HTML resultado en iframe
- [ ] Si no tiene params → abrir directo con HTML guardado (comportamiento actual)

---

## Orden de implementación

```
Fase 1 → Fase 2 → Fase 3 → Fase 4
```

Cada fase es testeable de forma independiente.

---

*Planificado: 2026-03-03*  
*Cloe Cloverfield — CloverBI / Digital Flow*
