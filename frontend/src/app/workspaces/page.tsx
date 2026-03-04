'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/AppLayout'
import { getConfig, getAuthToken, getCurrentUser } from '@/lib/config'
import { logger } from '@/lib/logger'

interface Template {
  id: string
  name: string
  description?: string
  base_prompt?: string
  template_html?: string
  queries?: Record<string, string>
  binding_schema?: any
  tags: string[]
  is_public: boolean
  created_at: string
  updated_at: string
}

type View = 'list' | 'viewer'

// Helpers de fecha
function today(): string {
  return new Date().toISOString().split('T')[0]
}
function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

export default function WorkspacesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<View>('list')
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // Execute state
  const [fechaInicio, setFechaInicio] = useState(daysAgo(30))
  const [fechaFin, setFechaFin] = useState(today())
  const [executing, setExecuting] = useState(false)
  const [executeError, setExecuteError] = useState<string | null>(null)
  const [freshHtml, setFreshHtml] = useState<string | null>(null)

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const config = getConfig()
      const token = getAuthToken()
      const user = getCurrentUser()
      const orgId = user?.organization_uid || user?.org_id

      if (!orgId) {
        setError('No se encontró organización. Intentá volver a loguearte.')
        return
      }

      logger.api('GET', `${config.backend.url}/api/templates`, { org_id: orgId })

      const res = await fetch(
        `${config.backend.url}/api/templates?org_id=${orgId}&include_public=true`,
        {
          headers: {
            ...(token && { knockknock: token }),
          },
        }
      )

      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`)

      const data = await res.json()
      setTemplates(data.templates || [])

      logger.info(`${data.templates?.length || 0} templates cargados`, {
        component: 'Workspaces',
      })
    } catch (err: any) {
      logger.error('Error cargando templates', {
        component: 'Workspaces',
        data: err,
      })
      setError(err.message || 'No se pudo conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const handleOpen = (template: Template) => {
    setActiveTemplate(template)
    setFreshHtml(null)
    setExecuteError(null)
    setView('viewer')
  }

  const handleBack = () => {
    setView('list')
    setActiveTemplate(null)
    setFreshHtml(null)
    setExecuteError(null)
  }

  const handleExecute = async () => {
    if (!activeTemplate) return
    setExecuting(true)
    setExecuteError(null)

    try {
      const config = getConfig()
      const token = getAuthToken()

      const res = await fetch(`${config.backend.url}/api/templates/${activeTemplate.id}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { knockknock: token }),
        },
        body: JSON.stringify({
          params: {
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
          },
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || `Error ${res.status}`)
      }

      setFreshHtml(data.html)
      logger.info('Template ejecutado', { component: 'Workspaces', data: { id: activeTemplate.id } })
    } catch (err: any) {
      setExecuteError(err.message || 'Error ejecutando el dashboard')
      logger.error('Error ejecutando template', { component: 'Workspaces', data: err })
    } finally {
      setExecuting(false)
    }
  }

  const handleDeleteClick = (id: string) => {
    setDeleteConfirm(id)
  }

  const handleDeleteConfirm = async (id: string) => {
    setDeleting(id)
    setDeleteConfirm(null)

    try {
      const config = getConfig()
      const token = getAuthToken()

      const res = await fetch(`${config.backend.url}/api/templates/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token && { knockknock: token }),
        },
      })

      if (!res.ok) throw new Error('Error eliminando template')

      setTemplates((prev) => prev.filter((t) => t.id !== id))

      if (activeTemplate?.id === id) {
        handleBack()
      }

      logger.info('Template eliminado', { component: 'Workspaces', data: { id } })
    } catch (err: any) {
      logger.error('Error eliminando template', { component: 'Workspaces', data: err })
    } finally {
      setDeleting(null)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const filteredTemplates = templates.filter((t) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      t.name.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.base_prompt?.toLowerCase().includes(q) ||
      t.tags?.some((tag) => tag.toLowerCase().includes(q))
    )
  })

  // ============== VIEWER ==============
  if (view === 'viewer' && activeTemplate) {
    const hasParams = activeTemplate.binding_schema?.params &&
      Object.keys(activeTemplate.binding_schema.params).length > 0
    const displayHtml = freshHtml ?? activeTemplate.template_html

    return (
      <AppLayout requireRole="data_analyst">
        <div className="h-full flex flex-col">

          {/* Viewer Header */}
          <header className="bg-bg-secondary border-b border-bg-card px-6 py-3 flex items-center gap-4 flex-shrink-0">
            <button
              onClick={handleBack}
              className="px-3 py-2 bg-bg-card hover:bg-border rounded-lg text-text-secondary hover:text-text-primary transition text-sm flex items-center gap-2 flex-shrink-0"
            >
              ← Volver
            </button>

            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-text-primary truncate">
                {activeTemplate.name}
              </h1>
              {activeTemplate.base_prompt && (
                <p className="text-xs text-text-muted truncate italic">
                  "{activeTemplate.base_prompt}"
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {activeTemplate.tags?.length > 0 &&
                activeTemplate.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="px-2 py-1 bg-clover/20 text-clover rounded-full text-xs hidden sm:block">
                    {tag}
                  </span>
                ))}
              {activeTemplate.queries && Object.keys(activeTemplate.queries).length > 0 && (
                <span className="text-xs text-text-muted bg-bg-card px-3 py-1 rounded-full hidden md:block">
                  🔍 {Object.keys(activeTemplate.queries).length} queries
                </span>
              )}
              <button
                onClick={() => handleDeleteClick(activeTemplate.id)}
                className="p-2 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition"
                title="Eliminar template"
              >
                🗑️
              </button>
            </div>
          </header>

          {/* DateRangePanel — solo si el template tiene params */}
          {hasParams && (
            <div className="bg-bg-primary border-b border-bg-card px-6 py-3 flex-shrink-0">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs text-text-muted font-medium uppercase tracking-wide">Período</span>

                <div className="flex items-center gap-2">
                  <label className="text-xs text-text-muted">Desde</label>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={e => setFechaInicio(e.target.value)}
                    className="px-3 py-1.5 bg-bg-secondary border border-bg-card rounded-lg text-text-primary text-sm focus:outline-none focus:border-clover transition"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs text-text-muted">Hasta</label>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={e => setFechaFin(e.target.value)}
                    className="px-3 py-1.5 bg-bg-secondary border border-bg-card rounded-lg text-text-primary text-sm focus:outline-none focus:border-clover transition"
                  />
                </div>

                {/* Shortcuts */}
                <div className="flex items-center gap-1">
                  {[
                    { label: '7d', days: 7 },
                    { label: '30d', days: 30 },
                    { label: '90d', days: 90 },
                  ].map(({ label, days }) => (
                    <button
                      key={label}
                      onClick={() => { setFechaInicio(daysAgo(days)); setFechaFin(today()) }}
                      className="px-2 py-1 text-xs bg-bg-card hover:bg-border text-text-muted hover:text-text-primary rounded transition"
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleExecute}
                  disabled={executing || !fechaInicio || !fechaFin}
                  className="px-4 py-1.5 bg-clover hover:bg-clover-dark disabled:opacity-50 text-white text-sm font-medium rounded-lg transition flex items-center gap-2 ml-2"
                >
                  {executing ? (
                    <><span className="animate-spin">⏳</span> Ejecutando...</>
                  ) : (
                    <>⚡ Ejecutar</>
                  )}
                </button>

                {freshHtml && (
                  <button
                    onClick={() => setFreshHtml(null)}
                    className="text-xs text-text-muted hover:text-text-primary transition"
                    title="Ver versión guardada"
                  >
                    ↩ Original
                  </button>
                )}

                {executeError && (
                  <span className="text-xs text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg">
                    ⚠️ {executeError}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Iframe */}
          <div className="flex-1 overflow-hidden relative">
            {executing && (
              <div className="absolute inset-0 bg-bg-primary/70 flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="text-5xl mb-3 animate-bounce">🍀</div>
                  <p className="text-text-secondary text-sm">Ejecutando queries...</p>
                </div>
              </div>
            )}

            {displayHtml ? (
              <iframe
                key={freshHtml ? 'fresh' : 'stored'}
                srcDoc={displayHtml}
                className="w-full h-full border-0"
                sandbox="allow-scripts"
                title={activeTemplate.name}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-center">
                <div>
                  <div className="text-6xl mb-4">⚠️</div>
                  <p className="text-text-secondary">Este template no tiene HTML guardado</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Delete confirm modal */}
        {deleteConfirm === activeTemplate.id && (
          <DeleteConfirmModal
            name={activeTemplate.name}
            onConfirm={() => handleDeleteConfirm(activeTemplate.id)}
            onCancel={() => setDeleteConfirm(null)}
          />
        )}
      </AppLayout>
    )
  }

  // ============== LIST ==============
  return (
    <AppLayout requireRole="data_analyst">
      <div className="h-full flex flex-col">
        {/* Header */}
        <header className="bg-bg-secondary border-b border-bg-card px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📁</span>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">Workspaces</h1>
                <p className="text-sm text-text-secondary">
                  {loading
                    ? 'Cargando...'
                    : `${templates.length} dashboard${templates.length !== 1 ? 's' : ''} guardado${templates.length !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              {templates.length > 0 && (
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar..."
                  className="px-4 py-2 bg-bg-primary border border-bg-card rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-clover transition text-sm w-48"
                />
              )}

              <button
                onClick={fetchTemplates}
                disabled={loading}
                className="px-4 py-2 bg-bg-card hover:bg-border rounded-lg text-text-secondary text-sm transition flex items-center gap-2 disabled:opacity-50"
              >
                <span className={loading ? 'animate-spin' : ''}>🔄</span>
                Actualizar
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">

            {/* Loading */}
            {loading && (
              <div className="text-center py-24">
                <div className="text-6xl mb-4 animate-bounce">🍀</div>
                <p className="text-text-secondary">Cargando dashboards guardados...</p>
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="text-center py-24">
                <div className="text-6xl mb-4">⚠️</div>
                <p className="text-red-400 mb-4">{error}</p>
                <button
                  onClick={fetchTemplates}
                  className="px-4 py-2 bg-clover hover:bg-clover-dark rounded-lg text-white text-sm transition"
                >
                  Reintentar
                </button>
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && templates.length === 0 && (
              <div className="text-center py-24">
                <div className="text-8xl mb-6">📁</div>
                <h2 className="text-2xl font-bold text-text-primary mb-3">
                  No hay dashboards guardados
                </h2>
                <p className="text-text-secondary max-w-md mx-auto mb-8">
                  Hacé una consulta en{' '}
                  <a href="/explorar" className="text-clover hover:underline font-medium">
                    Explorar
                  </a>
                  , y cuando tengas un dashboard que te guste, usá el botón{' '}
                  <strong>💾 Guardar</strong> para guardarlo acá.
                </p>

                <a
                  href="/explorar"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-clover hover:bg-clover-dark rounded-xl font-medium text-white transition"
                >
                  🔍 Ir a Explorar
                </a>
              </div>
            )}

            {/* Search empty */}
            {!loading && !error && templates.length > 0 && filteredTemplates.length === 0 && (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">🔎</div>
                <p className="text-text-secondary">
                  No hay resultados para "{search}"
                </p>
                <button
                  onClick={() => setSearch('')}
                  className="mt-3 text-clover text-sm hover:underline"
                >
                  Limpiar búsqueda
                </button>
              </div>
            )}

            {/* Grid */}
            {!loading && !error && filteredTemplates.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    deleting={deleting === template.id}
                    confirmingDelete={deleteConfirm === template.id}
                    onOpen={() => handleOpen(template)}
                    onDeleteClick={() => handleDeleteClick(template.id)}
                    onDeleteConfirm={() => handleDeleteConfirm(template.id)}
                    onDeleteCancel={() => setDeleteConfirm(null)}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

// ============== TEMPLATE CARD ==============
interface TemplateCardProps {
  template: Template
  deleting: boolean
  confirmingDelete: boolean
  onOpen: () => void
  onDeleteClick: () => void
  onDeleteConfirm: () => void
  onDeleteCancel: () => void
  formatDate: (d: string) => string
}

function TemplateCard({
  template,
  deleting,
  confirmingDelete,
  onOpen,
  onDeleteClick,
  onDeleteConfirm,
  onDeleteCancel,
  formatDate,
}: TemplateCardProps) {
  const queryCount = template.queries ? Object.keys(template.queries).length : 0

  return (
    <div className="bg-bg-secondary border border-bg-card rounded-xl p-5 flex flex-col gap-3 hover:border-clover/40 transition-all duration-200 group">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-text-primary truncate text-base group-hover:text-clover transition-colors">
            {template.name}
          </h3>
          {template.description && (
            <p className="text-sm text-text-muted mt-0.5 line-clamp-2">
              {template.description}
            </p>
          )}
        </div>
        {template.is_public && (
          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full flex-shrink-0 border border-blue-500/30">
            Público
          </span>
        )}
      </div>

      {/* Base prompt */}
      {template.base_prompt && (
        <div className="bg-bg-primary rounded-lg px-3 py-2">
          <p className="text-xs text-text-muted italic line-clamp-2">
            "{template.base_prompt}"
          </p>
        </div>
      )}

      {/* Tags */}
      {template.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {template.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-clover/15 text-clover rounded-full text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Meta */}
      <div className="flex items-center gap-3 text-xs text-text-muted">
        {queryCount > 0 && (
          <span className="flex items-center gap-1">
            🔍 {queryCount} {queryCount === 1 ? 'query' : 'queries'}
          </span>
        )}
        <span className="flex items-center gap-1 ml-auto">
          🕒 {formatDate(template.updated_at)}
        </span>
      </div>

      {/* Actions */}
      <div className="pt-2 border-t border-bg-card flex items-center justify-between gap-2">
        {confirmingDelete ? (
          <div className="flex items-center gap-2 w-full">
            <span className="text-xs text-red-400 flex-1">¿Eliminar?</span>
            <button
              onClick={onDeleteCancel}
              className="px-3 py-1.5 text-xs rounded-lg bg-bg-card text-text-secondary hover:text-text-primary transition"
            >
              Cancelar
            </button>
            <button
              onClick={onDeleteConfirm}
              disabled={deleting}
              className="px-3 py-1.5 text-xs rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition"
            >
              {deleting ? '...' : 'Confirmar'}
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={onDeleteClick}
              disabled={deleting}
              className="p-2 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition text-sm"
              title="Eliminar"
            >
              {deleting ? '⏳' : '🗑️'}
            </button>
            <button
              onClick={onOpen}
              className="flex-1 px-4 py-2 bg-clover hover:bg-clover-dark rounded-lg text-white text-sm font-medium transition flex items-center justify-center gap-2"
            >
              📊 Abrir Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ============== DELETE CONFIRM MODAL ==============
function DeleteConfirmModal({
  name,
  onConfirm,
  onCancel,
}: {
  name: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-bg-secondary border border-bg-card rounded-xl p-6 w-full max-w-sm mx-4">
        <div className="text-4xl mb-3 text-center">🗑️</div>
        <h3 className="text-lg font-bold text-text-primary text-center mb-2">
          Eliminar template
        </h3>
        <p className="text-text-secondary text-sm text-center mb-6">
          ¿Seguro que querés eliminar <strong className="text-text-primary">"{name}"</strong>?
          Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-bg-card hover:bg-border rounded-lg text-text-secondary transition text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white transition text-sm font-medium"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}
