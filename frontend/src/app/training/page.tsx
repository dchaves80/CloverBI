'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

interface GatewayConfig {
  gatewayUrl: string
  gatewayToken: string
}

export default function TrainingPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(true)
  const [darkMode, setDarkMode] = useState(true)
  const [config, setConfig] = useState<GatewayConfig | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reqIdRef = useRef(1)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.add('light')
    }
  }, [darkMode])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Fetch config from backend on mount
  useEffect(() => {
    fetchConfig()
  }, [])

  // Connect to WebSocket when config is available
  useEffect(() => {
    if (config) {
      connectWebSocket(config)
    }
    return () => {
      wsRef.current?.close()
    }
  }, [config])

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/config')
      if (!res.ok) throw new Error('Failed to fetch config')
      const data = await res.json()
      setConfig(data)
    } catch (error) {
      console.error('Error fetching config:', error)
      addMessage('system', '❌ Error obteniendo configuración del servidor')
      setConnecting(false)
    }
  }

  const connectWebSocket = (cfg: GatewayConfig) => {
    setConnecting(true)
    const ws = new WebSocket(cfg.gatewayUrl)
    wsRef.current = ws

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)

      if (msg.event === 'connect.challenge') {
        ws.send(JSON.stringify({
          type: 'req',
          id: String(reqIdRef.current++),
          method: 'connect',
          params: {
            minProtocol: 3, maxProtocol: 3,
            client: { id: 'cli', version: '1.0.0', platform: 'web', mode: 'cli' },
            role: 'operator',
            scopes: ['operator.read', 'operator.write', 'operator.admin'],
            caps: [], commands: [], permissions: {},
            auth: { token: cfg.gatewayToken },
            locale: 'es-AR',
            userAgent: 'clover-bi-training/1.0'
          }
        }))
      }

      if (msg.type === 'res' && msg.ok && msg.payload?.type === 'hello-ok') {
        setConnected(true)
        setConnecting(false)
        addMessage('system', '✅ Conectado con Ivy. Podés empezar a entrenarla.')
      }

      if (msg.event === 'agent' && msg.payload?.stream === 'assistant') {
        const text = msg.payload.data.text || ''
        setMessages(prev => {
          const last = prev[prev.length - 1]
          if (last?.role === 'assistant') {
            return [...prev.slice(0, -1), { ...last, content: text }]
          }
          return prev
        })
      }

      if (msg.event === 'agent' && msg.payload?.data?.phase === 'end') {
        // Response complete
      }
    }

    ws.onclose = () => {
      setConnected(false)
      setConnecting(false)
      if (config) {
        setTimeout(() => connectWebSocket(config), 3000)
      }
    }

    ws.onerror = () => {
      addMessage('system', '❌ Error de conexión')
    }
  }

  const addMessage = (role: Message['role'], content: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date()
    }])
  }

  const sendMessage = (text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !text.trim()) return

    addMessage('user', text)
    addMessage('assistant', '...')

    wsRef.current.send(JSON.stringify({
      type: 'req',
      id: String(reqIdRef.current++),
      method: 'chat.send',
      params: {
        sessionKey: 'agent:main:training',
        idempotencyKey: crypto.randomUUID(),
        message: "[TRAINING] " + text
      }
    }))

    setInput('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const quickActions = [
    { label: '🔍 Explorar DB', prompt: 'Explora la base de datos demo_bi y dime qué tablas hay' },
    { label: '📋 Ver ventas', prompt: 'Describe la tabla ventas con sus columnas' },
    { label: '📊 Ventas x sucursal', prompt: 'Dame un resumen de ventas por sucursal' },
    { label: '💰 Ventas del mes', prompt: '¿Cuántas ventas hubo este mes?' },
    { label: '📈 Dashboard KPIs', prompt: 'Genera un dashboard con KPIs de ventas' },
  ]

  return (
    <div className="h-screen flex flex-col bg-bg-primary transition-colors duration-300">
      {/* Header */}
      <header className="bg-bg-secondary border-b border-bg-card px-6 py-3 flex-shrink-0 transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-2xl hover:scale-110 transition-transform">🍀</Link>
            <h1 className="text-xl font-bold text-clover">Clover BI</h1>
            <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs font-bold rounded">
              🌿 TRAINING
            </span>
          </div>
          <nav className="flex items-center gap-4">
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
              connected ? 'bg-green-500/20 text-green-400' : 
              connecting ? 'bg-amber-500/20 text-amber-400' : 
              'bg-red-500/20 text-red-400'
            }`}>
              {connected ? '● Conectado' : connecting ? '○ Conectando...' : '● Desconectado'}
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-bg-card hover:bg-border transition-colors"
            >
              {darkMode ? '🌙' : '☀️'}
            </button>
            <Link 
              href="/"
              className="px-3 py-2 bg-bg-card hover:bg-border rounded-lg text-sm transition"
            >
              ← Dashboard
            </Link>
          </nav>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Area */}
        <main className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="text-6xl mb-4">🌿</div>
                <h2 className="text-2xl font-bold text-text-primary mb-2">Training Area</h2>
                <p className="text-text-secondary max-w-md">
                  Acá podés enseñarle a Ivy sobre tu base de datos. 
                  Explicale las tablas, corregí sus respuestas, y ella va a recordar.
                </p>
              </div>
            )}
            
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : msg.role === 'system' ? 'justify-center' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-clover text-white'
                      : msg.role === 'system'
                      ? 'bg-amber-500/20 text-amber-400 text-sm px-4 py-2'
                      : 'bg-bg-card text-text-primary'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 bg-bg-secondary border-t border-bg-card p-4">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enseñale algo a Ivy..."
                className="flex-1 px-4 py-3 bg-bg-primary border border-bg-card rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-clover transition"
                disabled={!connected}
              />
              <button
                type="submit"
                disabled={!connected || !input.trim()}
                className="px-6 py-3 bg-clover hover:bg-clover-dark disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium text-white transition"
              >
                Enviar
              </button>
            </form>
          </div>
        </main>

        {/* Sidebar */}
        <aside className="w-80 bg-bg-secondary border-l border-bg-card p-4 flex-shrink-0 overflow-y-auto">
          {/* Quick Actions */}
          <div className="mb-6">
            <h3 className="text-xs font-bold text-text-muted uppercase mb-3">Acciones Rápidas</h3>
            <div className="space-y-2">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(action.prompt)}
                  disabled={!connected}
                  className="w-full px-3 py-2 bg-bg-card hover:bg-border disabled:opacity-50 rounded-lg text-sm text-left transition"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          {/* DB Info */}
          <div className="mb-6">
            <h3 className="text-xs font-bold text-text-muted uppercase mb-3">Base de Datos</h3>
            <div className="bg-bg-card rounded-lg p-3 text-sm">
              <div className="text-text-secondary mb-2">SQL Server @ localhost:2433</div>
              <code className="block bg-bg-primary p-2 rounded text-xs text-text-muted">
                demo_bi<br/>
                ├── sucursales (6)<br/>
                ├── clientes (15)<br/>
                ├── productos (12)<br/>
                └── ventas (500)
              </code>
            </div>
          </div>

          {/* Tips */}
          <div>
            <h3 className="text-xs font-bold text-text-muted uppercase mb-3">Tips</h3>
            <ul className="text-xs text-text-secondary space-y-2">
              <li>• Explicá qué significa cada tabla</li>
              <li>• Da ejemplos de preguntas comunes</li>
              <li>• Corregí cuando la respuesta no sea ideal</li>
              <li>• Pedile que recuerde reglas específicas</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
