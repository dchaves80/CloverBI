'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface QueryResult {
  id: string
  query: string
  html: string
  timestamp: Date
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function Home() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<QueryResult[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [darkMode, setDarkMode] = useState(true)

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.add('light')
    }
  }, [darkMode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError(null)
    const currentQuery = query
    setQuery('')

    try {
      const res = await fetch(`${API_URL}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: currentQuery, darkMode }),
      })

      if (!res.ok) throw new Error('Error en la consulta')

      const data = await res.json()

      const newResult: QueryResult = {
        id: Date.now().toString(),
        query: currentQuery,
        timestamp: new Date(),
        html: data.html,
      }
      
      setResults(prev => [newResult, ...prev])
      setActiveTab(newResult.id)
    } catch (err) {
      setError('No se pudo conectar con el servidor. ¿Está corriendo el backend?')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const activeResult = results.find(r => r.id === activeTab)

  return (
    <div className="h-screen flex flex-col bg-bg-primary transition-colors duration-300">
      {/* Header */}
      <header className="bg-bg-secondary border-b border-bg-card px-6 py-3 flex-shrink-0 transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🍀</span>
            <h1 className="text-xl font-bold text-clover">Clover BI</h1>
          </div>
          <nav className="flex items-center gap-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-bg-card hover:bg-border transition-colors"
              title={darkMode ? 'Cambiar a Light Mode' : 'Cambiar a Dark Mode'}
            >
              {darkMode ? '🌙' : '☀️'}
            </button>
            <Link 
              href="/training"
              className="text-text-secondary hover:text-text-primary transition text-sm px-3 py-2 bg-bg-card hover:bg-border rounded-lg"
            >
              🌿 Training
            </Link>
            <div className="w-8 h-8 rounded-full bg-clover flex items-center justify-center text-white text-sm font-bold">
              D
            </div>
          </nav>
        </div>
      </header>

      {/* Tabs */}
      {results.length > 0 && (
        <div className="bg-bg-secondary border-b border-bg-card px-6 py-2 flex-shrink-0 overflow-x-auto transition-colors duration-300">
          <div className="max-w-7xl mx-auto flex gap-2">
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
          </div>
        </div>
      )}

      {/* Main Result Area */}
      <main className="flex-1 overflow-hidden transition-colors duration-300">
        {activeResult ? (
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
                  Pensando...
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
    </div>
  )
}
