// Cliente HTTP para llamadas al backend
// Usa configuración dinámica desde DOM

import { getConfig, getAuthToken } from './config'

export interface QueryRequest {
  question: string
  mode: 'training' | 'dashboard'
  // ... otros campos según la API
}

/**
 * Envía una query al backend de CloverBI
 * Usa la URL del backend desde la config del DOM
 */
export async function sendQuery(request: QueryRequest): Promise<any> {
  const config = getConfig()
  const token = getAuthToken()

  const response = await fetch(`${config.backend.url}/api/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'knockknock': token }), // 🔥 ATR si existe
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(`Query failed: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Obtiene el estado del backend
 */
export async function getBackendStatus(): Promise<any> {
  const config = getConfig()

  const response = await fetch(`${config.backend.url}/api/status`)

  if (!response.ok) {
    throw new Error('Backend no disponible')
  }

  return response.json()
}

/**
 * Helper genérico para llamadas al backend
 */
export async function fetchBackend(
  endpoint: string,
  options?: RequestInit
): Promise<Response> {
  const config = getConfig()
  const token = getAuthToken()

  const url = `${config.backend.url}${endpoint}`

  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'knockknock': token }), // 🔥 ATR automático
      ...options?.headers,
    },
  })
}
