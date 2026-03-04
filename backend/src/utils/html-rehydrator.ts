/**
 * html-rehydrator.ts — Rehidrata HTML de Ivy con datos frescos
 *
 * En vez de generar HTML nuevo desde cero, toma el template_html guardado
 * de Ivy y reemplaza solo los datos dentro de cada bloque CLOVER.
 * Preserva layout, CSS, estilos y estructura original.
 */

import type { CloverComponent } from './clover-parser.js'

// ─── helpers ──────────────────────────────────────────────────────

function formatValue(val: any): string {
  if (val === null || val === undefined) return '—'
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return val.toLocaleString('es-AR')
    return val.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
    try { return new Date(val).toLocaleDateString('es-AR') } catch { return String(val) }
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

function rehydrateChart(html: string, id: string, rows: any[]): string {
  const bounds = findBlockBounds(html, 'chart', id)
  if (!bounds || rows.length === 0) return html
  const [blockStart, blockEnd] = bounds

  const block = html.slice(blockStart, blockEnd)
  const canvasMatch = block.match(/<canvas[^>]+id="([^"]+)"/)
  if (!canvasMatch) return html
  const canvasId = canvasMatch[1]

  const cols = Object.keys(rows[0])
  const labelKey = cols[0]
  const valueKeys = cols.slice(1)
  if (valueKeys.length === 0) return html

  const newLabels = JSON.stringify(rows.map(r => formatValue(r[labelKey])))

  let result = html

  // Encontrar el script de este canvas en el HTML completo
  const scriptSearchRe = new RegExp(`getElementById\\(['"]${escapeRegex(canvasId)}['"]\\)`)
  const scriptMatch = result.match(scriptSearchRe)
  if (!scriptMatch || scriptMatch.index === undefined) return html
  const scriptIdx = scriptMatch.index

  // Buscar el bloque data: { ... } dentro del constructor Chart
  const dataBlockIdx = result.indexOf('data:', scriptIdx)
  if (dataBlockIdx === -1 || dataBlockIdx > scriptIdx + 3000) return html

  // 1. Reemplazar labels: [...]
  const labelsKeyIdx = result.indexOf('labels:', dataBlockIdx)
  if (labelsKeyIdx === -1 || labelsKeyIdx > dataBlockIdx + 1000) return html

  const labelsArrStart = result.indexOf('[', labelsKeyIdx)
  if (labelsArrStart === -1) return html
  const labelsArrEnd = findArrayEnd(result, labelsArrStart)
  if (labelsArrEnd === -1) return html

  result = result.slice(0, labelsArrStart) + newLabels + result.slice(labelsArrEnd)

  // 2. Reemplazar data: [...] de cada dataset
  // Re-encontrar el script después del reemplazo
  const scriptMatch2 = result.match(new RegExp(`getElementById\\(['"]${escapeRegex(canvasId)}['"]\\)`))
  if (!scriptMatch2 || scriptMatch2.index === undefined) return result

  const datasetsIdx = result.indexOf('datasets:', scriptMatch2.index)
  if (datasetsIdx === -1) return result

  let searchFrom = datasetsIdx
  for (let i = 0; i < valueKeys.length; i++) {
    const newData = JSON.stringify(rows.map(r => r[valueKeys[i]]))
    const dataIdx = result.indexOf('data:', searchFrom + 1)
    if (dataIdx === -1 || dataIdx > searchFrom + 5000) break

    const dataArrStart = result.indexOf('[', dataIdx)
    if (dataArrStart === -1) break
    const dataArrEnd = findArrayEnd(result, dataArrStart)
    if (dataArrEnd === -1) break

    result = result.slice(0, dataArrStart) + newData + result.slice(dataArrEnd)
    searchFrom = dataArrStart + newData.length
  }

  return result
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
    const insertAfter = containerMatch.index + containerMatch[0].length
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
        case 'chart': html = rehydrateChart(html, component.id, rows); break
        case 'table': html = rehydrateTable(html, component.id, rows); break
      }
    }
  }

  return injectExecutionBanner(html, params)
}
