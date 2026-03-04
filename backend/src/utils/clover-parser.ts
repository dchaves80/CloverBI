/**
 * Parser de metadata CLOVER
 * Extrae queries y componentes de HTML generado por Ivy
 */

export interface CloverComponent {
  id: string
  type: 'chart' | 'kpi' | 'table' | 'text'
  sql: string
}

export interface ParseResult {
  queries: Record<string, string>
  components: CloverComponent[]
  componentCount: number
}

/**
 * Parsea HTML con comentarios CLOVER y extrae metadata
 * 
 * Formato esperado:
 * <!--CLOVER:BEGIN type="chart" id="ventasPorMes"-->
 * <!--CLOVER:SQL SELECT mes, SUM(total) FROM ventas GROUP BY mes-->
 * <div>...</div>
 * <!--CLOVER:END-->
 */
export function parseCloverMetadata(html: string): ParseResult {
  const components: CloverComponent[] = []
  const queries: Record<string, string> = {}

  // Regex para encontrar bloques CLOVER
  // Captura: type, id, y el SQL
  const blockRegex = /<!--CLOVER:BEGIN\s+type="(\w+)"\s+id="([^"]+)"-->\s*<!--CLOVER:SQL\s+([\s\S]*?)-->/g

  let match
  while ((match = blockRegex.exec(html)) !== null) {
    const [_, type, id, sql] = match
    
    // Limpiar el SQL (puede tener saltos de línea)
    const cleanSql = sql.trim().replace(/\s+/g, ' ')
    
    const component: CloverComponent = {
      id,
      type: type as CloverComponent['type'],
      sql: cleanSql
    }
    
    components.push(component)
    queries[id] = cleanSql
  }

  return {
    queries,
    components,
    componentCount: components.length
  }
}

/**
 * Valida que el HTML tenga metadata CLOVER válida
 */
export function hasCloverMetadata(html: string): boolean {
  return /<!--CLOVER:BEGIN/.test(html)
}

/**
 * Cuenta componentes CLOVER sin parsear completamente
 */
export function countCloverComponents(html: string): number {
  const matches = html.match(/<!--CLOVER:BEGIN/g)
  return matches ? matches.length : 0
}

/**
 * Elimina la sección de informe del HTML antes de guardar como template.
 * El informe se muestra al explorar pero no se persiste en el template.
 * 
 * Formato esperado:
 * <!--CLOVER:INFORME-->
 * <div class="informe">...</div>
 * <!--CLOVER:INFORME:END-->
 */
export function stripCloverInforme(html: string): string {
  return html.replace(/<!--CLOVER:INFORME-->[\s\S]*?<!--CLOVER:INFORME:END-->/g, '').trim()
}

/**
 * Verifica si el HTML tiene sección de informe marcada
 */
export function hasCloverInforme(html: string): boolean {
  return /<!--CLOVER:INFORME-->/.test(html)
}
