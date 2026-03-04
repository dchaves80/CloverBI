import Fastify from 'fastify'
import cors from '@fastify/cors'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import 'dotenv/config'
import { ivy } from './services/clover-client.js'
import { templatesRoutes } from './routes/templates.js'
import { getPool } from './services/db.js'

const fastify = Fastify({ logger: true })

// ============== CORS ==============
await fastify.register(cors, {
  origin: true,
})

// ============== SWAGGER ==============
await fastify.register(swagger, {
  openapi: {
    info: {
      title: 'Clover BI API',
      description: 'API para Clover BI - Business Intelligence con IA',
      version: '1.0.0',
    },
    servers: [
      { url: 'http://localhost:3001', description: 'Development' },
      { url: 'https://clover-api.neosolutions.com.ar', description: 'Production' },
    ],
    tags: [
      { name: 'templates', description: 'Gestión de templates' },
      { name: 'query', description: 'Consultas a Ivy' },
      { name: 'health', description: 'Health checks' },
    ],
  },
})

await fastify.register(swaggerUi, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: true,
  },
})

// ============== REGISTER ROUTES ==============
await templatesRoutes(fastify)

// ============== CONFIG ENDPOINT ==============
fastify.get('/api/config', {
  schema: {
    description: 'Obtener configuración del gateway',
    tags: ['config'],
    response: {
      200: {
        type: 'object',
        properties: {
          gatewayUrl: { type: 'string' },
          gatewayToken: { type: 'string' },
        },
      },
    },
  },
}, async () => {
  return {
    gatewayUrl: process.env.PUBLIC_CLOVER_URL || 'wss://clover.neosolutions.com.ar/ws',
    gatewayToken: process.env.CLOVER_TOKEN || '',
  }
})

// ============== ENV ENDPOINT ==============
fastify.get('/api/env', {
  schema: {
    description: 'Listar todas las variables de entorno del backend (passwords enmascaradas)',
    tags: ['health'],
  },
}, async () => {
  const mask = (val?: string) => {
    if (!val) return '❌ no configurada'
    if (val.length <= 4) return '✅ ****'
    return `✅ ${val.slice(0, 2)}${'*'.repeat(Math.min(val.length - 4, 8))}${val.slice(-2)}`
  }
  const show = (val?: string) => val ? `✅ ${val}` : '❌ no configurada'

  return {
    server: {
      PORT: show(process.env.PORT),
      NODE_ENV: show(process.env.NODE_ENV),
    },
    cloverbi_db: {
      description: 'Base de datos interna de CloverBI (templates, usuarios)',
      DB_SERVER:   show(process.env.DB_SERVER),
      DB_PORT:     show(process.env.DB_PORT),
      DB_USER:     show(process.env.DB_USER),
      DB_PASSWORD: mask(process.env.DB_PASSWORD),
      DB_NAME:     show(process.env.DB_NAME),
    },
    client_db: {
      description: 'Base de datos del cliente (donde viven los datos de los dashboards)',
      CLIENT_DB_TYPE: show(process.env.CLIENT_DB_TYPE),
      CLIENT_DB_HOST: show(process.env.CLIENT_DB_HOST),
      CLIENT_DB_PORT: show(process.env.CLIENT_DB_PORT),
      CLIENT_DB_USER: show(process.env.CLIENT_DB_USER),
      CLIENT_DB_PASS: mask(process.env.CLIENT_DB_PASS),
      CLIENT_DB_NAME: show(process.env.CLIENT_DB_NAME),
      status: (process.env.CLIENT_DB_HOST && process.env.CLIENT_DB_USER && process.env.CLIENT_DB_NAME)
        ? '✅ configurada'
        : '❌ incompleta — falta CLIENT_DB_HOST, CLIENT_DB_USER o CLIENT_DB_NAME',
    },
    ivy: {
      description: 'Agente Ivy (WebSocket)',
      CLOVER_URL:   show(process.env.CLOVER_URL),
      CLOVER_TOKEN: mask(process.env.CLOVER_TOKEN),
      PUBLIC_CLOVER_URL: show(process.env.PUBLIC_CLOVER_URL),
    },
  }
})

// ============== QUERY ENDPOINT ==============
fastify.post<{
  Body: { prompt: string; darkMode?: boolean }
}>('/api/query', {
  schema: {
    description: 'Enviar consulta a Ivy y obtener dashboard',
    tags: ['query'],
    body: {
      type: 'object',
      required: ['prompt'],
      properties: {
        prompt: { type: 'string', description: 'Consulta en lenguaje natural' },
        darkMode: { type: 'boolean', default: true, description: 'Modo oscuro' },
      },
    },
    response: {
      200: {
        type: 'object',
        properties: {
          html: { type: 'string', description: 'HTML del dashboard' },
          text: { type: 'string', description: 'Respuesta de texto (si no hay HTML)' },
          mode: { type: 'string', enum: ['ivy', 'ivy-text'] },
        },
      },
    },
  },
}, async (request, reply) => {
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
fastify.get('/health', {
  schema: {
    description: 'Health check del servidor',
    tags: ['health'],
    response: {
      200: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          timestamp: { type: 'string' },
        },
      },
    },
  },
}, async () => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

// ============== DB HEALTH ==============
fastify.get('/health/db', {
  schema: {
    description: 'Health check de la base de datos CloverBI',
    tags: ['health'],
    response: {
      200: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          database: { type: 'string' },
          connected: { type: 'boolean' },
        },
      },
      500: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          database: { type: 'string' },
          error: { type: 'string' },
        },
      },
    },
  },
}, async (request, reply) => {
  try {
    const pool = await getPool()
    await pool.request().query('SELECT 1 as ok')
    return { status: 'ok', database: 'CloverBI', connected: true }
  } catch (error: any) {
    return reply.status(500).send({ status: 'error', database: 'CloverBI', error: error.message })
  }
})

// ============== FALLBACK ==============
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
    const startTime = new Date()
    const startTimestamp = startTime.toLocaleString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
    
    // Test DB connection on startup
    try {
      await getPool()
      console.log('🗄️ Database connection OK')
    } catch (dbError: any) {
      console.warn('⚠️ Database connection failed:', dbError.message)
      console.warn('Templates API will not work until DB is available')
    }
    
    await fastify.listen({ port, host: '0.0.0.0' })

    const ok  = (v?: string) => v ? `✅ ${v}` : '❌ no configurada'
    const mask = (v?: string) => v ? `✅ ${'*'.repeat(Math.min(v.length, 8))}` : '❌ no configurada'
    const clientOk = process.env.CLIENT_DB_HOST && process.env.CLIENT_DB_USER && process.env.CLIENT_DB_NAME

    console.log(``)
    console.log(`🍀 ═══════════════════════════════════════════════`)
    console.log(`🍀 Clover BI Backend`)
    console.log(`🍀 Started: ${startTimestamp}`)
    console.log(`🍀 ═══════════════════════════════════════════════`)
    console.log(`📡 Server:     http://localhost:${port}`)
    console.log(`📚 Swagger:    http://localhost:${port}/docs`)
    console.log(`📋 Env:        http://localhost:${port}/api/env`)
    console.log(``)
    console.log(`🗄️  CloverBI DB (interna):`)
    console.log(`   DB_SERVER:   ${ok(process.env.DB_SERVER)}`)
    console.log(`   DB_PORT:     ${ok(process.env.DB_PORT)}`)
    console.log(`   DB_USER:     ${ok(process.env.DB_USER)}`)
    console.log(`   DB_PASSWORD: ${mask(process.env.DB_PASSWORD)}`)
    console.log(`   DB_NAME:     ${ok(process.env.DB_NAME)}`)
    console.log(``)
    console.log(`🔌 Client DB (datos de dashboards):`)
    console.log(`   CLIENT_DB_TYPE: ${ok(process.env.CLIENT_DB_TYPE)}`)
    console.log(`   CLIENT_DB_HOST: ${ok(process.env.CLIENT_DB_HOST)}`)
    console.log(`   CLIENT_DB_PORT: ${ok(process.env.CLIENT_DB_PORT)}`)
    console.log(`   CLIENT_DB_USER: ${ok(process.env.CLIENT_DB_USER)}`)
    console.log(`   CLIENT_DB_PASS: ${mask(process.env.CLIENT_DB_PASS)}`)
    console.log(`   CLIENT_DB_NAME: ${ok(process.env.CLIENT_DB_NAME)}`)
    console.log(`   Status: ${clientOk ? '✅ configurada' : '❌ incompleta — execute endpoint no funcionará'}`)
    console.log(``)
    console.log(`🌿 Ivy:        ${ok(process.env.CLOVER_URL)}`)
    console.log(`   Token:     ${mask(process.env.CLOVER_TOKEN)}`)
    console.log(``)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
