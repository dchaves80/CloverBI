// Cliente WebSocket para conexión con Ivy
// Usa configuración dinámica desde DOM

import { getConfig } from './config'

export interface IvyMessage {
  type: string
  data?: any
  [key: string]: any
}

export interface IvyClientOptions {
  onMessage?: (message: IvyMessage) => void
  onOpen?: () => void
  onClose?: () => void
  onError?: (error: Event) => void
}

/**
 * Conecta a Ivy usando la configuración del DOM
 */
export function connectToIvy(options: IvyClientOptions = {}): WebSocket {
  const config = getConfig()
  const { gateway_url, gateway_token } = config.ivy

  console.log('🌿 Conectando a Ivy:', gateway_url)

  const ws = new WebSocket(gateway_url)

  ws.onopen = () => {
    console.log('✅ Conexión establecida con Ivy')

    // Autenticar con el token si es necesario
    if (gateway_token) {
      ws.send(JSON.stringify({
        type: 'auth',
        token: gateway_token,
      }))
    }

    options.onOpen?.()
  }

  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data)
      options.onMessage?.(message)
    } catch (err) {
      console.error('Error parsing message from Ivy:', err)
    }
  }

  ws.onclose = () => {
    console.log('🔌 Conexión cerrada con Ivy')
    options.onClose?.()
  }

  ws.onerror = (error) => {
    console.error('❌ Error en conexión con Ivy:', error)
    options.onError?.(error)
  }

  return ws
}

/**
 * Envía un mensaje a Ivy
 */
export function sendToIvy(ws: WebSocket, message: IvyMessage) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message))
  } else {
    console.warn('WebSocket no está conectado')
  }
}
