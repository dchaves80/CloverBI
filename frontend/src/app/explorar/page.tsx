'use client'

import { useState, useEffect, useRef } from 'react'
import AppLayout from '@/components/AppLayout'
import SaveTemplateModal from '@/components/SaveTemplateModal'
import { getConfig } from '@/lib/config'
import { logger } from '@/lib/logger'

interface QueryResult {
  id: string
  query: string
  html: string
  timestamp: Date
}

type LoadingPhase = 'connecting' | 'querying' | 'generating' | null

export default function ExplorarPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<QueryResult[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>(null)
  const [currentQuery, setCurrentQuery] = useState('')
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [darkMode, setDarkMode] = useState(true)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const resultIdRef = useRef(1) // 🔥 Contador único para IDs de resultados

  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('cloverbi_user') || '{}') : {}

  useEffect(() => {
    if (!loading) {
      setLoadingPhase(null)
      return
    }
    
    setLoadingPhase('connecting')
    
    const timer1 = setTimeout(() => {
      if (loading) setLoadingPhase('querying')
    }, 2000)
    
    const timer2 = setTimeout(() => {
      if (loading) setLoadingPhase('generating')
    }, 5000)
    
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [loading])

  // Clear save success message after 3 seconds
  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => setSaveSuccess(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [saveSuccess])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError(null)
    const queryText = query
    setCurrentQuery(queryText)
    setQuery('')

    try {
      // 🔥 Obtener backend URL desde config del DOM (localStorage)
      const config = getConfig()
      const backendUrl = config.backend.url
      
      logger.group('📊 Explorar: Enviando query DIRECTA al backend', () => {
        logger.api('POST', `${backendUrl}/api/query`, { 
          prompt: queryText.substring(0, 50) + '...',
          backendUrl
        })
      })
      
      // 🔥 Llamar DIRECTAMENTE al backend (https://api.cloverbi.neosolutions.com.ar)
      // Sin proxy, sin API route - llamada directa desde el navegador
      const res = await fetch(`${backendUrl}/api/query`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: queryText, darkMode }),
      })

      if (!res.ok) throw new Error('Error en la consulta')

      const data = await res.json()
      
      logger.info('Query completada', { 
        component: 'Explorar',
        data: { htmlLength: data.html?.length || 0 }
      })

      const newResult: QueryResult = {
        id: `result-${resultIdRef.current++}`, // 🔥 ID único incremental
        query: queryText,
        timestamp: new Date(),
        html: data.html,
      }
      
      setResults(prev => [newResult, ...prev])
      setActiveTab(newResult.id)
    } catch (err) {
      logger.error('Error en query', { component: 'Explorar', data: err })
      setError('No se pudo conectar con el servidor. ¿Está corriendo el backend?')
      console.error(err)
    } finally {
      setLoading(false)
      setCurrentQuery('')
    }
  }

  const activeResult = results.find(r => r.id === activeTab)

  const getLoadingMessage = () => {
    switch (loadingPhase) {
      case 'connecting':
        return { emoji: '🔌', text: 'Conectando con Ivy...' }
      case 'querying':
        return { emoji: '🔍', text: 'Consultando la base de datos...' }
      case 'generating':
        return { emoji: '📊', text: 'Generando dashboard...' }
      default:
        return { emoji: '🍀', text: 'Iniciando...' }
    }
  }

  const handleSaveSuccess = (templateId: string) => {
    setSaveSuccess('Template guardado correctamente! ✅')
  }

  return (
    <AppLayout requireRole="data_analyst">
      <div className="h-full flex flex-col bg-bg-primary transition-colors duration-300">
        {/* Header */}
        <header className="bg-bg-secondary border-b border-bg-card px-6 py-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔍</span>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Explorar</h1>
              <p className="text-sm text-text-secondary">Queries en tiempo real con Ivy</p>
            </div>
          </div>
        </header>

      {/* Success Toast */}
      {saveSuccess && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 bg-clover text-white rounded-lg shadow-lg animate-pulse">
          {saveSuccess}
        </div>
      )}

      {/* Tabs */}
      {results.length > 0 && (
        <div className="bg-bg-secondary border-b border-bg-card px-6 py-2 flex-shrink-0 overflow-x-auto transition-colors duration-300">
          <div className="max-w-7xl mx-auto flex gap-2 items-center">
            {results.map((result) => (
              <button
                key={result.id}
                onClick={() => setActiveTab(result.id)}
                className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition flex items-center gap-2 ${
                  activeTab === result.id
                    ? 'bg-clover text-white'
                    : 'bg-bg-card text-text-secondary hover:text-text-primary'
                }`}
              >
                <span className="max-w-32 truncate">{result.query}</span>
                <span
                  onClick={(e) => {
                    e.stopPropagation()
                    setResults(prev => prev.filter(r => r.id !== result.id))
                    if (activeTab === result.id) {
                      const remaining = results.filter(r => r.id !== result.id)
                      setActiveTab(remaining[0]?.id || null)
                    }
                  }}
                  className="hover:text-red-400 transition"
                >
                  ✕
                </span>
              </button>
            ))}
            
            {/* Save Template Button - only show when there's an active result */}
            {activeResult && (
              <button
                onClick={() => setShowSaveModal(true)}
                className="px-3 py-2 rounded-lg text-sm bg-bg-card hover:bg-clover/20 text-text-secondary hover:text-clover transition flex items-center gap-1 ml-auto"
                title="Guardar como template"
              >
                💾 Guardar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Result Area */}
      <main className="flex-1 overflow-hidden transition-colors duration-300">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <div className="text-6xl mb-6 animate-bounce">{getLoadingMessage().emoji}</div>
            <h2 className="text-2xl font-bold text-text-primary mb-3">
              {getLoadingMessage().text}
            </h2>
            <div className="bg-bg-secondary border border-bg-card rounded-xl px-6 py-4 max-w-lg mb-6">
              <p className="text-text-muted text-sm mb-1">Tu consulta:</p>
              <p className="text-text-primary text-lg">{currentQuery}</p>
            </div>
            <div className="flex gap-2 items-center text-text-muted text-sm">
              <div className="w-2 h-2 bg-clover rounded-full animate-pulse"></div>
              <span>Esto puede tomar unos minutos para consultas complejas</span>
            </div>
          </div>
        ) : activeResult ? (
          <iframe
            srcDoc={activeResult.html}
            className="w-full h-full border-0"
            sandbox="allow-scripts"
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <div className="text-8xl mb-6">🍀</div>
            <h2 className="text-3xl font-bold text-text-primary mb-3">
              ¿Qué querés saber?
            </h2>
            <p className="text-text-secondary max-w-lg mb-8">
              Preguntá sobre tus datos en español. Clover los interpreta, 
              consulta tu base de datos, y te muestra el resultado.
            </p>
            
            {error && (
              <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                ⚠️ {error}
              </div>
            )}
            
            <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
              {[
                '¿Cuánto vendimos este mes?',
                'Top 10 clientes',
                'Ventas por categoría',
                'Comparar Q1 vs Q2',
                'Productos sin stock',
                'Ticket promedio por día'
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setQuery(suggestion)}
                  className="px-4 py-2 bg-bg-secondary hover:bg-bg-card text-text-secondary hover:text-text-primary rounded-full transition text-sm border border-bg-card"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Fixed Input at Bottom */}
      <div className="flex-shrink-0 bg-bg-secondary border-t border-bg-card px-6 py-4 transition-colors duration-300">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="relative flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Preguntá algo sobre tus datos..."
              className="flex-1 px-5 py-4 bg-bg-primary border border-bg-card rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-clover transition"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-8 py-4 bg-clover hover:bg-clover-dark disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium text-white transition flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin">🍀</span>
                  Procesando...
                </>
              ) : (
                <>
                  Consultar
                  <span>→</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Save Template Modal */}
      {activeResult && user && (
        <SaveTemplateModal
          isOpen={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          html={activeResult.html}
          basePrompt={activeResult.query}
          orgId={user.organization_uid || user.org_id || 'default'}
          userId={user.uid || user.id || 'default'}
          onSuccess={handleSaveSuccess}
        />
      )}
      </div>
    </AppLayout>
  )
}
