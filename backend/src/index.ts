import Fastify from 'fastify'
import cors from '@fastify/cors'
import 'dotenv/config'
import { ivy } from './services/clover-client.js'

const fastify = Fastify({ logger: true })

await fastify.register(cors, {
  origin: true,
})

// ============== CONFIG ENDPOINT (for Frontend) ==============

fastify.get('/api/config', async () => {
  return {
    gatewayUrl: process.env.CLOVER_URL || 'wss://clover.neosolutions.com.ar/',
    gatewayToken: process.env.CLOVER_TOKEN || '',
  }
})

// ============== QUERY ENDPOINT (connected to Ivy) ==============

fastify.post<{
  Body: { prompt: string; darkMode?: boolean }
}>('/api/query', async (request, reply) => {
  const { prompt, darkMode = true } = request.body

  if (!prompt?.trim()) {
    return reply.status(400).send({ error: 'Prompt requerido' })
  }

  try {
    console.log('📊 Query:', prompt)
    const response = await ivy.query(prompt, { darkMode })
    
    if (response.html) {
      return { html: response.html, mode: 'ivy' }
    } else {
      return { 
        html: generateFallback(prompt, response.text, darkMode),
        text: response.text,
        mode: 'ivy-text'
      }
    }
  } catch (error: any) {
    fastify.log.error(error)
    return reply.status(500).send({ 
      error: 'Error procesando consulta',
      details: error.message 
    })
  }
})

// ============== HEALTH ==============

fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

// ============== FALLBACK (when Ivy responds without HTML) ==============

function generateFallback(prompt: string, agentText: string, darkMode: boolean): string {
  const t = darkMode 
    ? { bg: '#0f172a', card: '#1e293b', text: '#f8fafc', accent: '#10b981', muted: '#94a3b8' }
    : { bg: '#f8fafc', card: '#ffffff', text: '#0f172a', accent: '#059669', muted: '#64748b' }

  return `<!DOCTYPE html><html><head>
    <style>
      body { background: ${t.bg}; color: ${t.text}; font-family: system-ui; padding: 20px; }
      .card { background: ${t.card}; border-radius: 12px; padding: 20px; margin-bottom: 16px; }
      h2 { color: ${t.accent}; margin-bottom: 12px; }
      pre { background: ${t.bg}; padding: 12px; border-radius: 8px; overflow-x: auto; color: ${t.muted}; white-space: pre-wrap; }
    </style>
  </head><body>
    <div class=card>
      <h2>📊 ${prompt}</h2>
    </div>
    <div class=card>
      <h3>🌿 Respuesta de Ivy</h3>
      <pre>${agentText}</pre>
    </div>
  </body></html>`
}

// ============== START ==============

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3001')
    await fastify.listen({ port, host: '0.0.0.0' })
    console.log(`🍀 Clover BI Backend on http://localhost:${port}`)
    console.log(`🌿 Ivy: ${process.env.CLOVER_URL || 'wss://clover.neosolutions.com.ar/'}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
