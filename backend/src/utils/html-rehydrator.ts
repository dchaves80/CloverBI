/**
 * html-rehydrator.ts — Rehidrata HTML de Ivy con datos frescos
 *
 * En vez de generar HTML nuevo desde cero, toma el template_html guardado
 * de Ivy y reemplaza solo los datos dentro de cada bloque CLOVER.
 * Preserva layout, CSS, estilos y estructura original.
 */

import type { CloverComponent } from './clover-parser.js'

// ─── helpers ──────────────────────────────────────────────────────

function formatDate(val: Date | string): string {
  try {
    const d = val instanceof Date ? val : new Date(val)
    if (isNaN(d.getTime())) return String(val)
    const day   = d.getDate().toString().padStart(2, '0')
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const year  = d.getFullYear()
    return `${day}/${month}/${year}`
  } catch {
    return String(val)
  }
}

function formatValue(val: any): string {
  if (val === null || val === undefined) return '—'
  if (val instanceof Date) return formatDate(val)
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return val.toLocaleString('es-AR')
    return val.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  if (typeof val === 'string') {
    // Fecha ISO
    if (/^\d{4}-\d{2}-\d{2}/.test(val)) return formatDate(val)
    // String numérico → formatear como número
    const n = parseFloat(val)
    if (!isNaN(n) && String(n) === val.trim()) {
      if (Number.isInteger(n)) return n.toLocaleString('es-AR')
      return n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }
  }
  return String(val)
}

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Encuentra los límites de un bloque CLOVER: [inicio, fin]
function findBlockBounds(html: string, type: string, id: string): [number, number] | null {
  const start = html.indexOf(`<!--CLOVER:BEGIN type="${type}" id="${id}"`)
  if (start === -1) return null
  const end = html.indexOf('<!--CLOVER:END-->', start)
  if (end === -1) return null
  return [start, end + 17] // 17 = '<!--CLOVER:END-->'.length
}

// Encuentra el índice del cierre de un array JSON '[...]' comenzando en startIdx
function findArrayEnd(str: string, startIdx: number): number {
  let depth = 0
  for (let i = startIdx; i < str.length; i++) {
    if (str[i] === '[') depth++
    else if (str[i] === ']') {
      depth--
      if (depth === 0) return i + 1
    }
  }
  return -1
}

// ─── KPI ──────────────────────────────────────────────────────────

function rehydrateKpi(html: string, id: string, rows: any[]): string {
  const bounds = findBlockBounds(html, 'kpi', id)
  if (!bounds || rows.length === 0) return html
  const [blockStart, blockEnd] = bounds

  const cols = Object.keys(rows[0])
  const valueKey = cols.find(k => k.toLowerCase() === 'value') || cols[0]
  const newValue = escapeHtml(formatValue(rows[0][valueKey]))

  let block = html.slice(blockStart, blockEnd)

  // Reemplazar contenido del primer elemento con class que contenga "value"
  block = block.replace(
    /(<(?:span|div|p|h[1-6])[^>]*class="[^"]*\bvalue\b[^"]*"[^>]*>)[^<]*/,
    `$1${newValue}`
  )

  return html.slice(0, blockStart) + block + html.slice(blockEnd)
}

// ─── Table ────────────────────────────────────────────────────────

function rehydrateTable(html: string, id: string, rows: any[]): string {
  const bounds = findBlockBounds(html, 'table', id)
  if (!bounds) return html
  const [blockStart, blockEnd] = bounds

  let block = html.slice(blockStart, blockEnd)

  if (rows.length === 0) {
    block = block.replace(
      /<tbody>[\s\S]*?<\/tbody>/,
      `<tbody><tr><td colspan="99" style="text-align:center;color:#475569;padding:20px">Sin resultados para el período seleccionado</td></tr></tbody>`
    )
    return html.slice(0, blockStart) + block + html.slice(blockEnd)
  }

  const cols = Object.keys(rows[0])
  const newTbody = `<tbody>${rows.map(row =>
    `<tr>${cols.map(c => `<td>${escapeHtml(formatValue(row[c]))}</td>`).join('')}</tr>`
  ).join('')}</tbody>`

  block = block.replace(/<tbody>[\s\S]*?<\/tbody>/, newTbody)
  return html.slice(0, blockStart) + block + html.slice(blockEnd)
}

// ─── Chart ────────────────────────────────────────────────────────

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']

function buildInlineTable(rows: any[]): string {
  const cols = Object.keys(rows[0])
  const header = cols.map(c => `<th style="padding:6px 10px;text-align:left;color:#94a3b8;font-size:0.8rem;border-bottom:1px solid #475569">${escapeHtml(c)}</th>`).join('')
  const body = rows.map(row =>
    `<tr>${cols.map(c => `<td style="padding:6px 10px;color:#cbd5e1;font-size:0.82rem;border-bottom:1px solid #1e293b">${escapeHtml(formatValue(row[c]))}</td>`).join('')}</tr>`
  ).join('')
  return `<div style="overflow-x:auto;margin-top:8px"><table style="width:100%;border-collapse:collapse"><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table></div>`
}

function removeChartScript(html: string, canvasId: string): string {
  // Elimina el bloque new Chart(document.getElementById('canvasId'), {...}) del script
  const re = new RegExp(`new Chart\\(\\s*document\\.getElementById\\(['"']${escapeRegex(canvasId)}['"']\\)[\\s\\S]*?\\}\\s*\\)\\s*;?`, '')
  return html.replace(re, `/* chart ${canvasId} degradado a tabla */`)
}

function rehydrateChart(html: string, id: string, rows: any[], chartType: string = 'bar'): string {
  const bounds = findBlockBounds(html, 'chart', id)
  if (!bounds) return html
  const [blockStart, blockEnd] = bounds

  const block = html.slice(blockStart, blockEnd)
  const canvasMatch = block.match(/<canvas[^>]+id="([^"]+)"/)
  if (!canvasMatch) return html
  const canvasId = canvasMatch[1]

  // Sin datos
  if (rows.length === 0) return html

  const cols = Object.keys(rows[0])
  const labelKey = cols[0]
  const valueKeys = cols.slice(1)
  if (valueKeys.length === 0) return html

  // < 2 filas y no es line → degrade a tabla inline
  if (chartType !== 'line' && rows.length < 2) {
    const tableHtml = buildInlineTable(rows)
    // Reemplazar el canvas (y su contenedor si existe) por la tabla
    let newBlock = block.replace(/<div[^>]*class="[^"]*chart-container[^"]*"[\s\S]*?<\/div>/, tableHtml)
    if (newBlock === block) {
      newBlock = block.replace(/<canvas[^>]*><\/canvas>/, tableHtml)
    }
    let result = html.slice(0, blockStart) + newBlock + html.slice(blockEnd)
    return removeChartScript(result, canvasId)
  }

  // ── Reemplazar el bloque entero new Chart(...) con código fresco ──
  // Esto evita bugs cuando el chart original usa variables (semanalData.map) en vez de arrays literales

  const isRadial = chartType === 'doughnut' || chartType === 'pie'
  const isHorizontal = chartType === 'bar-horizontal'
  const realType = isHorizontal ? 'bar' : chartType

  const labels = rows.map(r => formatValue(r[labelKey]))
  const datasets = valueKeys.map((key, i) => {
    const color = CHART_COLORS[i % CHART_COLORS.length]
    const data = rows.map(r => {
      const v = r[key]
      if (v === null || v === undefined) return null
      const n = parseFloat(String(v))
      return isNaN(n) ? v : n
    })
    return {
      label: key,
      data,
      backgroundColor: isRadial
        ? CHART_COLORS.map(c => c + 'b3')
        : color + '99',
      borderColor: isRadial ? CHART_COLORS : color,
      borderWidth: 2,
      ...(realType === 'line' ? { tension: 0.3, fill: true } : {}),
    }
  })

  const scalesConfig = isRadial ? '' : `
      scales: {
        ${isHorizontal ? 'y' : 'x'}: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
        ${isHorizontal ? 'x' : 'y'}: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: '#334155' } }
      }`

  const freshScript = `new Chart(document.getElementById('${canvasId}'), {
    type: '${realType}',
    data: {
      labels: ${JSON.stringify(labels)},
      datasets: ${JSON.stringify(datasets)}
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      ${isHorizontal ? "indexAxis: 'y'," : ''}
      plugins: {
        legend: { labels: { color: '#e2e8f0' }, display: ${isRadial || valueKeys.length > 1 ? 'true' : 'false'} }
      },${scalesConfig}
    }
  })`

  // Encontrar y reemplazar el bloque new Chart(...) completo
  const chartCallRe = new RegExp(`new Chart\\(\\s*document\\.getElementById\\(['"]${escapeRegex(canvasId)}['"]\\)`)
  const chartCallMatch = html.match(chartCallRe)
  if (!chartCallMatch || chartCallMatch.index === undefined) return html

  const chartStart = chartCallMatch.index
  let depth = 0
  let chartEnd = -1
  for (let i = chartStart; i < html.length; i++) {
    if (html[i] === '{') depth++
    else if (html[i] === '}') {
      depth--
      if (depth === 0) {
        // Buscar el ); de cierre
        let j = i + 1
        while (j < html.length && (html[j] === ' ' || html[j] === '\n' || html[j] === '\r')) j++
        if (html[j] === ')') {
          j++
          if (html[j] === ';') j++
          chartEnd = j
        } else {
          chartEnd = i + 1
        }
        break
      }
    }
  }

  if (chartEnd === -1) return html
  return html.slice(0, chartStart) + freshScript + html.slice(chartEnd)
}

// ─── Error ────────────────────────────────────────────────────────

function rehydrateError(html: string, type: string, id: string, error: string): string {
  const bounds = findBlockBounds(html, type, id)
  if (!bounds) return html
  const [blockStart, blockEnd] = bounds

  let block = html.slice(blockStart, blockEnd)
  const errorDiv = `<div style="background:#450a0a;border:1px solid #7f1d1d;color:#fca5a5;padding:10px 14px;border-radius:8px;font-size:0.82rem;margin-top:8px">⚠️ ${escapeHtml(error)}</div>`

  if (type === 'table') {
    block = block.replace(
      /<tbody>[\s\S]*?<\/tbody>/,
      `<tbody><tr><td colspan="99" style="padding:8px">${errorDiv}</td></tr></tbody>`
    )
  } else if (type === 'chart') {
    // Agregar error después del canvas
    block = block.replace(/(<canvas[^>]*>)/, `$1${errorDiv}`)
  } else if (type === 'kpi') {
    block = block.replace(
      /(<(?:span|div)[^>]*class="[^"]*\bvalue\b[^"]*"[^>]*>)[^<]*/,
      `$1—`
    )
  }

  return html.slice(0, blockStart) + block + html.slice(blockEnd)
}

// ─── Execution banner ─────────────────────────────────────────────

function injectExecutionBanner(html: string, params: Record<string, string>): string {
  const now = new Date().toLocaleString('es-AR')
  const paramBadges = Object.entries(params).map(([k, v]) =>
    `<span style="display:inline-flex;border-radius:6px;overflow:hidden;font-size:0.72rem;margin-right:4px">` +
    `<span style="background:#0f172a;color:#94a3b8;padding:3px 7px">${escapeHtml(k)}</span>` +
    `<span style="background:#34d399;color:#0f172a;font-weight:600;padding:3px 8px">${escapeHtml(v)}</span></span>`
  ).join('')

  const banner = `<div style="background:#1e293b;border-left:4px solid #34d399;padding:10px 16px;` +
    `border-radius:8px;margin-bottom:16px;font-size:0.78rem;color:#64748b;` +
    `display:flex;align-items:center;flex-wrap:wrap;gap:8px">` +
    `🔄 Datos actualizados · ${now} &nbsp;${paramBadges}</div>`

  // Intentar inyectar dentro de .container, sino después de <body>
  const containerMatch = html.match(/<div[^>]*class="[^"]*\bcontainer\b[^"]*"/)
  if (containerMatch && containerMatch.index !== undefined) {
    // Buscar el > de cierre del tag (no el fin del atributo class)
    const tagClose = html.indexOf('>', containerMatch.index + containerMatch[0].length)
    const insertAfter = tagClose !== -1 ? tagClose + 1 : containerMatch.index + containerMatch[0].length
    return html.slice(0, insertAfter) + '\n' + banner + html.slice(insertAfter)
  }

  return html.replace(/(<body[^>]*>)/, `$1\n${banner}`)
}

// ─── Main export ─────────────────────────────────────────────────

export function rehydrateHtml(
  templateHtml: string,
  components: CloverComponent[],
  results: Record<string, any[]>,
  errors: Record<string, string>,
  params: Record<string, string>
): string {
  let html = templateHtml

  for (const component of components) {
    if (errors[component.id]) {
      html = rehydrateError(html, component.type, component.id, errors[component.id])
    } else {
      const rows = results[component.id] || []
      switch (component.type) {
        case 'kpi':   html = rehydrateKpi(html, component.id, rows); break
        case 'chart': html = rehydrateChart(html, component.id, rows, component.chartType || 'bar'); break
        case 'table': html = rehydrateTable(html, component.id, rows); break
      }
    }
  }

  return injectExecutionBanner(html, params)
}
