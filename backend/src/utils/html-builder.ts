/**
 * html-builder.ts — Genera HTML fresco a partir de resultados de queries
 *
 * Cuando el usuario re-ejecuta un template con nuevos params,
 * generamos una página nueva con los datos frescos, manteniendo
 * el estilo CloverBI (dark theme, verde clover).
 */

export interface BuildHtmlOptions {
  name: string
  params: Record<string, string>
  results: Record<string, any[]>
  errors: Record<string, string>
  componentTypeMap: Record<string, string>   // queryId → 'kpi' | 'table' | 'chart' | 'text'
  queryOrder: string[]
}

// ─── helpers ────────────────────────────────────────────────

function formatValue(val: any): string {
  if (val === null || val === undefined) return '—'
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return val.toLocaleString('es-AR')
    return val.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  if (val instanceof Date || (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val))) {
    try {
      return new Date(val).toLocaleDateString('es-AR')
    } catch { return String(val) }
  }
  return String(val)
}

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, c => c.toUpperCase())
}

// ─── renderers ──────────────────────────────────────────────

function renderKpi(id: string, rows: any[]): string {
  if (rows.length === 0) {
    return `<div class="kpi-card"><div class="kpi-label">${formatLabel(id)}</div><div class="kpi-value">—</div></div>`
  }
  const row = rows[0]
  // Si hay una sola columna "value", usarla; si no, primera columna
  const valueKey = Object.keys(row).find(k => k.toLowerCase() === 'value') || Object.keys(row)[0]
  const value = row[valueKey]
  return `
    <div class="kpi-card">
      <div class="kpi-label">${formatLabel(id)}</div>
      <div class="kpi-value">${formatValue(value)}</div>
    </div>`
}

function renderTable(id: string, rows: any[]): string {
  if (rows.length === 0) {
    return `
      <div class="section">
        <h3 class="section-title">${formatLabel(id)}</h3>
        <div class="empty">Sin resultados</div>
      </div>`
  }
  const cols = Object.keys(rows[0])
  const header = cols.map(c => `<th>${escapeHtml(formatLabel(c))}</th>`).join('')
  const body = rows.map(row =>
    `<tr>${cols.map(c => `<td>${escapeHtml(formatValue(row[c]))}</td>`).join('')}</tr>`
  ).join('')

  return `
    <div class="section">
      <h3 class="section-title">${formatLabel(id)} <span class="count">${rows.length} registros</span></h3>
      <div class="table-wrap">
        <table>
          <thead><tr>${header}</tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    </div>`
}

function renderChart(id: string, rows: any[], chartType: string = "bar"): string {
  // Si tiene pocos campos (≤ 2 cols), renderizamos un bar chart con Chart.js
  if (rows.length === 0) {
    return `<div class="section"><h3 class="section-title">${formatLabel(id)}</h3><div class="empty">Sin datos</div></div>`
  }

  const cols = Object.keys(rows[0])
  if (cols.length >= 2) {
    const labelKey = cols[0]
    const valueKey = cols[1]
    const labels = rows.map(r => formatValue(r[labelKey]))
    const values = rows.map(r => r[valueKey])
    const canvasId = `chart_${id}`
    const labelsJson = JSON.stringify(labels)
    const valuesJson = JSON.stringify(values)

    return `
    <div class="section">
      <h3 class="section-title">${formatLabel(id)}</h3>
      <canvas id="${canvasId}" height="80"></canvas>
      <script>
        (function() {
          var ctx = document.getElementById('${canvasId}');
          new Chart(ctx, {
            type: chartType,
            data: {
              labels: ${labelsJson},
              datasets: [{
                label: '${escapeHtml(formatLabel(valueKey))}',
                data: ${valuesJson},
                backgroundColor: 'rgba(52, 211, 153, 0.6)',
                borderColor: 'rgb(52, 211, 153)',
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              plugins: { legend: { labels: { color: '#e2e8f0' } } },
              scales: {
                x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
                y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } }
              }
            }
          });
        })();
      </script>
    </div>`
  }

  // fallback: tabla
  return renderTable(id, rows)
}

function renderError(id: string, error: string): string {
  return `
    <div class="section error-section">
      <h3 class="section-title">${formatLabel(id)}</h3>
      <div class="error-msg">⚠️ ${escapeHtml(error)}</div>
    </div>`
}

// ─── main ────────────────────────────────────────────────────

export function buildFreshHtml(opts: BuildHtmlOptions): string {
  const { name, params, results, errors, componentTypeMap, queryOrder } = opts

  // Separar KPIs de lo demás para layout
  const kpiIds = queryOrder.filter(id => componentTypeMap[id] === 'kpi' && !errors[id])
  const restIds = queryOrder.filter(id => componentTypeMap[id] !== 'kpi' || errors[id])

  const kpiHtml = kpiIds.length > 0
    ? `<div class="kpi-grid">${kpiIds.map(id => renderKpi(id, results[id] || [])).join('')}</div>`
    : ''

  const sectionsHtml = restIds.map(id => {
    if (errors[id]) return renderError(id, errors[id])
    const type = componentTypeMap[id] || 'table'
    const rows = results[id] || []
    if (type === 'chart' || type.startsWith('chart:')) {
      const subtype = type.includes(':') ? type.split(':')[1] : 'bar'
      return renderChart(id, rows, subtype)
    }
    if (type === 'kpi') return renderKpi(id, rows)   // fallback (error path)
    return renderTable(id, rows)
  }).join('')

  // Param badges
  const paramBadges = Object.entries(params).map(([k, v]) =>
    `<span class="param-badge"><span class="param-key">${escapeHtml(k)}</span><span class="param-val">${escapeHtml(v)}</span></span>`
  ).join('')

  const now = new Date().toLocaleString('es-AR')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(name)}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      min-height: 100vh;
      padding: 24px;
    }

    /* Header */
    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .title { font-size: 1.4rem; font-weight: 700; color: #f8fafc; }
    .subtitle { font-size: 0.8rem; color: #64748b; margin-top: 4px; }
    .params-row { display: flex; flex-wrap: wrap; gap: 8px; }
    .param-badge {
      display: inline-flex;
      border-radius: 6px;
      overflow: hidden;
      font-size: 0.75rem;
    }
    .param-key {
      background: #1e293b;
      color: #94a3b8;
      padding: 4px 8px;
    }
    .param-val {
      background: #34d399;
      color: #0f172a;
      font-weight: 600;
      padding: 4px 10px;
    }

    /* KPI grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .kpi-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 20px 16px;
      text-align: center;
    }
    .kpi-label { font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
    .kpi-value { font-size: 2rem; font-weight: 700; color: #34d399; }

    /* Sections */
    .section { margin-bottom: 24px; }
    .section-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .count {
      font-size: 0.7rem;
      background: #334155;
      color: #64748b;
      padding: 2px 8px;
      border-radius: 9999px;
      text-transform: none;
      letter-spacing: 0;
    }

    /* Table */
    .table-wrap { overflow-x: auto; border-radius: 8px; border: 1px solid #334155; }
    table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
    thead { background: #1e293b; }
    th { padding: 10px 14px; text-align: left; color: #94a3b8; font-weight: 600; white-space: nowrap; border-bottom: 1px solid #334155; }
    td { padding: 8px 14px; color: #cbd5e1; border-bottom: 1px solid #1e293b; white-space: nowrap; }
    tbody tr:last-child td { border-bottom: none; }
    tbody tr:hover td { background: #1e293b; }

    /* Canvas */
    canvas { background: #1e293b; border-radius: 8px; border: 1px solid #334155; padding: 12px; }

    /* States */
    .empty { color: #475569; font-size: 0.85rem; padding: 20px 0; text-align: center; }
    .error-section { opacity: 0.8; }
    .error-msg { background: #450a0a; border: 1px solid #7f1d1d; color: #fca5a5; padding: 10px 14px; border-radius: 8px; font-size: 0.82rem; }

    /* Footer */
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #1e293b; font-size: 0.72rem; color: #334155; text-align: right; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">📊 ${escapeHtml(name)}</div>
      <div class="subtitle">Datos actualizados · ${now}</div>
    </div>
    ${paramBadges ? `<div class="params-row">${paramBadges}</div>` : ''}
  </div>

  ${kpiHtml}
  ${sectionsHtml}

  <div class="footer">CloverBI · ejecutado ${now}</div>
</body>
</html>`
}
