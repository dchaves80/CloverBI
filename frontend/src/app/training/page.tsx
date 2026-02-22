'use client'

import { useState, useEffect, useRef } from 'react'
import AppLayout from '@/components/AppLayout'
import { getConfig } from '@/lib/config'
import { logger } from '@/lib/logger'

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
  const [config, setConfig] = useState<GatewayConfig | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reqIdRef = useRef(1)
  const messageIdRef = useRef(1) // 🔥 Contador único para IDs de mensajes
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load config from localStorage on mount
  useEffect(() => {
    loadConfig()
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

  const loadConfig = () => {
    logger.group('⚙️ Training: Cargando config', () => {
      try {
        const configData = getConfig() // 🔥 Lee desde localStorage, no hace fetch
        if (configData?.ivy) {
          logger.info('Config Ivy cargada', {
            component: 'Training',
            data: {
              gateway: configData.ivy.gateway_url,
              hasToken: !!configData.ivy.gateway_token
            }
          })
          setConfig({
            gatewayUrl: configData.ivy.gateway_url,
            gatewayToken: configData.ivy.gateway_token,
          })
        } else {
          logger.error('Config Ivy no disponible', { component: 'Training' })
          addMessage('system', '⚠️ No hay configuración disponible. Volvé a iniciar sesión.')
          setConnecting(false)
        }
      } catch (error) {
        logger.error('Error cargando config', { component: 'Training', data: error })
        addMessage('system', '❌ Error cargando configuración')
        setConnecting(false)
      }
    })
  }

  const connectWebSocket = (cfg: GatewayConfig) => {
    setConnecting(true)
    
    logger.group('🌿 Conectando a Ivy (WebSocket)', () => {
      logger.ws('connect', { 
        url: cfg.gatewayUrl,
        hasToken: !!cfg.gatewayToken,
        protocol: cfg.gatewayUrl.startsWith('wss') ? 'WSS (secure)' : 'WS (insecure)'
      })
    })
    
    const ws = new WebSocket(cfg.gatewayUrl)
    wsRef.current = ws

    ws.onopen = () => {
      logger.ws('open', { 
        readyState: 'OPEN',
        protocol: ws.protocol || 'default',
        extensions: ws.extensions || 'none'
      })
      addMessage('system', '🔌 Socket abierto, esperando challenge...')
    }

    ws.onmessage = (event) => {
      let msg
      try {
        msg = JSON.parse(event.data)
      } catch (err) {
        logger.error('Error parseando mensaje del WebSocket', { component: 'Training', data: event.data })
        return
      }

      const messageType = msg.event || msg.type || 'unknown'
      logger.ws('receive', { 
        type: messageType,
        size: event.data.length + ' bytes',
        data: msg
      })

      if (msg.event === 'connect.challenge') {
        logger.group('🔐 Autenticando con Ivy', () => {
          logger.ws('auth', {
            action: 'Enviando credenciales',
            role: 'operator',
            scopes: ['operator.read', 'operator.write', 'operator.admin'],
            hasToken: !!cfg.gatewayToken
          })
        })
        
        const authMessage = {
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
        }
        
        logger.ws('send', {
          method: 'connect',
          size: JSON.stringify(authMessage).length + ' bytes'
        })
        
        ws.send(JSON.stringify(authMessage))
      }

      if (msg.type === 'res' && msg.ok && msg.payload?.type === 'hello-ok') {
        logger.group('✅ Conexión establecida con Ivy', () => {
          logger.info('Handshake completado', {
            component: 'Training',
            data: {
              sessionId: msg.payload?.sessionId || 'N/A',
              protocol: msg.payload?.protocol || 'N/A',
              capabilities: msg.payload?.caps || []
            }
          })
        })
        
        setConnected(true)
        setConnecting(false)
        addMessage('system', '✅ Conectado con Ivy. Podés empezar a entrenarla.')
      }

      if (msg.event === 'agent' && msg.payload?.stream === 'assistant') {
        const text = msg.payload.data.text || ''
        
        // Solo loguear el primer chunk y el último para no saturar
        setMessages(prev => {
          const last = prev[prev.length - 1]
          const isFirstChunk = !last || last.role !== 'assistant'
          
          if (isFirstChunk) {
            logger.debug('Stream iniciado (assistant)', { component: 'Training' })
          }
          
          if (last?.role === 'assistant') {
            return [...prev.slice(0, -1), { ...last, content: text }]
          }
          return prev
        })
      }

      if (msg.event === 'agent' && msg.payload?.data?.phase === 'end') {
        logger.info('Respuesta completada', { 
          component: 'Training',
          data: {
            tokensUsed: msg.payload?.data?.tokensUsed || 'N/A',
            duration: msg.payload?.data?.duration || 'N/A'
          }
        })
      }
    }

    ws.onclose = (event) => {
      logger.ws('disconnect', { 
        code: event.code,
        reason: event.reason || 'No reason provided',
        wasClean: event.wasClean,
        willReconnect: !!config
      })
      
      setConnected(false)
      setConnecting(false)
      addMessage('system', `🔌 Desconectado (code: ${event.code}). Reconectando en 3s...`)
      
      if (config) {
        setTimeout(() => {
          logger.info('Intentando reconectar...', { component: 'Training' })
          connectWebSocket(config)
        }, 3000)
      }
    }

    ws.onerror = (error) => {
      logger.ws('error', { 
        error: error,
        readyState: ws.readyState,
        readyStateText: ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][ws.readyState]
      })
      addMessage('system', '❌ Error de conexión con Ivy')
    }
  }

  const addMessage = (role: Message['role'], content: string) => {
    setMessages(prev => [...prev, {
      id: `msg-${messageIdRef.current++}`, // 🔥 ID único incremental
      role,
      content,
      timestamp: new Date()
    }])
  }

  const sendMessage = (text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !text.trim()) {
      logger.warn('No se puede enviar mensaje', {
        component: 'Training',
        data: {
          wsExists: !!wsRef.current,
          readyState: wsRef.current?.readyState,
          hasText: !!text.trim()
        }
      })
      return
    }

    addMessage('user', text)
    addMessage('assistant', '...')

    const message = {
      type: 'req',
      id: String(reqIdRef.current++),
      method: 'chat.send',
      params: {
        sessionKey: 'agent:main:training',
        idempotencyKey: crypto.randomUUID(),
        message: "[TRAINING] " + text
      }
    }

    logger.ws('send', {
      method: 'chat.send',
      messageLength: text.length,
      sessionKey: 'agent:main:training'
    })

    wsRef.current.send(JSON.stringify(message))
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
    <AppLayout requireRole="data_trainer">
      <div className="h-full flex flex-col bg-bg-primary transition-colors duration-300">
        {/* Header */}
        <header className="bg-bg-secondary border-b border-bg-card px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎓</span>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">Training</h1>
                <p className="text-sm text-text-secondary">Entrena a Ivy con tus datos</p>
              </div>
            </div>
            <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${
              connected ? 'bg-green-500/20 text-green-400' : 
              connecting ? 'bg-amber-500/20 text-amber-400' : 
              'bg-red-500/20 text-red-400'
            }`}>
              {connected ? '● Conectado' : connecting ? '○ Conectando...' : '● Desconectado'}
            </div>
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
    </AppLayout>
  )
}
