// Sistema de logging centralizado para CloverBI
// Ayuda a debuggear problemas en desarrollo

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogOptions {
  component?: string
  data?: any
}

const isDev = process.env.NODE_ENV === 'development'

// Colores para consola
const colors = {
  debug: '#6366f1', // indigo
  info: '#10b981',  // green
  warn: '#f59e0b',  // amber
  error: '#ef4444', // red
}

const emojis = {
  debug: '🔍',
  info: '✅',
  warn: '⚠️',
  error: '❌',
}

class Logger {
  private enabled = isDev

  private log(level: LogLevel, message: string, options: LogOptions = {}) {
    if (!this.enabled && level !== 'error') return

    const { component, data } = options
    const timestamp = new Date().toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    })

    const prefix = component ? `[${component}]` : '[CloverBI]'
    const emoji = emojis[level]
    const color = colors[level]

    // Log con estilo
    console.log(
      `%c${emoji} ${timestamp} ${prefix} %c${message}`,
      `color: ${color}; font-weight: bold`,
      'color: inherit'
    )

    // Si hay data, mostrarla
    if (data !== undefined) {
      console.log('%cData:', 'color: #8b5cf6; font-weight: bold', data)
    }
  }

  debug(message: string, options?: LogOptions) {
    this.log('debug', message, options)
  }

  info(message: string, options?: LogOptions) {
    this.log('info', message, options)
  }

  warn(message: string, options?: LogOptions) {
    this.log('warn', message, options)
  }

  error(message: string, options?: LogOptions) {
    this.log('error', message, options)
  }

  // Helpers específicos para CloverBI
  config(action: 'load' | 'fetch' | 'save', data?: any) {
    this.info(`Config ${action}`, { component: 'Config', data })
  }

  auth(action: 'login' | 'logout' | 'check', data?: any) {
    this.info(`Auth ${action}`, { component: 'Auth', data })
  }

  ws(action: 'connect' | 'disconnect' | 'send' | 'receive' | 'open' | 'error' | 'auth', data?: any) {
    const level = action === 'error' ? 'error' : action === 'disconnect' ? 'warn' : 'info'
    this.log(level, `WebSocket ${action}`, { component: 'WebSocket', data })
  }

  api(method: string, endpoint: string, data?: any) {
    this.debug(`${method} ${endpoint}`, { component: 'API', data })
  }

  // Group logs
  group(label: string, fn: () => void) {
    if (!this.enabled) {
      fn()
      return
    }
    console.group(`🔷 ${label}`)
    fn()
    console.groupEnd()
  }

  // Enable/disable logging
  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }
}

// Singleton instance
export const logger = new Logger()

// Tipos exportados
export type { LogLevel, LogOptions }
