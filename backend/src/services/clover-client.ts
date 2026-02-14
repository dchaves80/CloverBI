import { WebSocket } from 'ws'
import { randomUUID } from 'crypto'

interface CloverConfig {
  url: string
  token: string
  timeout?: number
}

interface AgentResponse {
  text: string
  html?: string
}

export class CloverClient {
  private config: CloverConfig

  constructor(config: CloverConfig) {
    this.config = {
      timeout: 600000, // 10 minutos para consultas complejas
      ...config
    }
  }

  async query(prompt: string, context?: {
    darkMode?: boolean
    sessionKey?: string
  }): Promise<AgentResponse> {
    const sessionKey = context?.sessionKey || 'agent:main:bi-api'
    const theme = context?.darkMode !== false ? 'dark' : 'light'
    const fullPrompt = `[DASHBOARD] Theme: ${theme}. ${prompt}`

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.config.url)
      let reqId = 1
      let responseText = ''
      let resolved = false

      const cleanup = () => {
        if (!resolved) {
          resolved = true
          ws.close()
        }
      }

      const timeout = setTimeout(() => {
        console.log('⏰ TIMEOUT - no response in 2 min')
        cleanup()
        reject(new Error('Timeout: Agent did not respond in time'))
      }, this.config.timeout)

      ws.on('open', () => {
        console.log('🌿 Connected to Ivy')
      })

      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString())
          
          // DEBUG: Log all events
          console.log('📨 Event:', msg.event || msg.type, msg.payload?.data?.phase || '')

          if (msg.event === 'connect.challenge') {
            console.log('🔑 Authenticating...')
            ws.send(JSON.stringify({
              type: 'req',
              id: String(reqId++),
              method: 'connect',
              params: {
                minProtocol: 3,
                maxProtocol: 3,
                client: { id: 'cli', version: '1.0.0', platform: 'linux', mode: 'cli' },
                role: 'operator',
                scopes: ['operator.read', 'operator.write', 'operator.admin'],
                caps: [], commands: [], permissions: {},
                auth: { token: this.config.token },
                locale: 'es-AR',
                userAgent: 'clover-bi-backend/1.0'
              }
            }))
          }

          if (msg.type === 'res' && msg.ok && msg.payload?.type === 'hello-ok') {
            console.log('✅ Sending query to Ivy...')
            ws.send(JSON.stringify({
              type: 'req',
              id: String(reqId++),
              method: 'chat.send',
              params: {
                sessionKey,
                idempotencyKey: randomUUID(),
                message: fullPrompt
              }
            }))
          }

          // Accumulate responses
          if (msg.event === 'agent' && msg.payload?.stream === 'assistant') {
            responseText = msg.payload.data.text || responseText
            console.log('📝 Got text chunk (' + responseText.length + ' chars)')
          }

          // Check for end phase
          if (msg.event === 'agent' && msg.payload?.data?.phase === 'end') {
            console.log('🏁 Phase END detected!')
            clearTimeout(timeout)
            cleanup()
            const html = this.extractHtml(responseText)
            console.log('📊 Extracted HTML:', html ? html.length + ' chars' : 'NONE')
            resolve({ text: responseText, html: html || undefined })
          }

          // Alternative: lifecycle event
          if (msg.event === 'agent' && msg.payload?.stream === 'lifecycle' && msg.payload?.data?.phase === 'end') {
            console.log('🏁 Lifecycle END detected!')
            clearTimeout(timeout)
            cleanup()
            const html = this.extractHtml(responseText)
            resolve({ text: responseText, html: html || undefined })
          }

          if (msg.type === 'res' && !msg.ok) {
            console.error('❌ Error:', msg.payload)
            clearTimeout(timeout)
            cleanup()
            reject(new Error(msg.payload?.message || 'Agent error'))
          }

        } catch (err) {
          console.error('Parse error:', err)
        }
      })

      ws.on('error', (err) => {
        console.error('❌ WebSocket error:', err)
        clearTimeout(timeout)
        cleanup()
        reject(err)
      })

      ws.on('close', () => {
        console.log('🔌 WebSocket closed')
        clearTimeout(timeout)
        if (!resolved) {
          resolved = true
          if (responseText) {
            console.log('📊 Resolving on close with text')
            const html = this.extractHtml(responseText)
            resolve({ text: responseText, html: html || undefined })
          } else {
            reject(new Error('Connection closed without response'))
          }
        }
      })
    })
  }

  private extractHtml(text: string): string | null {
    const htmlMatch = text.match(/<!DOCTYPE html>[\s\S]*<\/html>/i)
    if (htmlMatch) return htmlMatch[0]

    const htmlMatch2 = text.match(/<html[\s\S]*<\/html>/i)
    if (htmlMatch2) return '<!DOCTYPE html>' + htmlMatch2[0]

    if (text.includes('<div') || text.includes('<canvas') || text.includes('<table')) {
      return `<!DOCTYPE html><html><head>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>* { margin: 0; padding: 0; box-sizing: border-box; } body { font-family: system-ui; }</style>
      </head><body>${text}</body></html>`
    }

    return null
  }
}

export const ivy = new CloverClient({
  url: process.env.CLOVER_URL || 'wss://clover.neosolutions.com.ar/',
  token: process.env.CLOVER_TOKEN || 'b7de372ef0d3a2edd5b5411ad5e4561c516090456ec50950'
})
