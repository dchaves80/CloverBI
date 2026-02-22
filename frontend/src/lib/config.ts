// Utilidad para obtener configuración desde localStorage
// La config se carga desde DOM al hacer login

import { logger } from './logger'

export interface CloverBIConfig {
  backend: {
    url: string
  }
  frontend?: {
    url: string
  }
  ivy: {
    gateway_url: string
    gateway_token: string
  }
}

// Defaults (fallback si no hay config en DOM)
const DEFAULT_CONFIG: CloverBIConfig = {
  backend: {
    url: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002',
  },
  ivy: {
    gateway_url: process.env.NEXT_PUBLIC_GATEWAY_URL || 'ws://localhost:19002/',
    gateway_token: process.env.NEXT_PUBLIC_GATEWAY_TOKEN || '',
  },
}

/**
 * Obtiene la configuración de CloverBI desde localStorage
 * Si no existe, retorna defaults
 */
export function getConfig(): CloverBIConfig {
  if (typeof window === 'undefined') {
    logger.debug('getConfig: SSR context, usando defaults')
    return DEFAULT_CONFIG
  }

  try {
    const stored = localStorage.getItem('cloverbi_config')
    if (stored) {
      const config = JSON.parse(stored) as CloverBIConfig
      logger.config('load', { 
        backend: config.backend.url,
        gateway: config.ivy.gateway_url 
      })
      return config
    } else {
      logger.warn('Config no encontrada en localStorage, usando defaults')
    }
  } catch (err) {
    logger.error('Error parsing cloverbi_config', { data: err })
  }

  return DEFAULT_CONFIG
}

/**
 * Obtiene el token ATR desde localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  const token = localStorage.getItem('cloverbi_token')
  if (token) {
    logger.debug('ATR token encontrado', { component: 'Auth' })
  } else {
    logger.warn('ATR token NO encontrado', { component: 'Auth' })
  }
  return token
}

/**
 * Obtiene el usuario actual desde localStorage
 */
export function getCurrentUser() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const stored = localStorage.getItem('cloverbi_user')
    if (stored) {
      const user = JSON.parse(stored)
      logger.debug('Usuario cargado desde localStorage', { 
        component: 'Auth',
        data: { 
          email: user.email, 
          organization: user.organization_name 
        }
      })
      return user
    } else {
      logger.warn('Usuario NO encontrado en localStorage', { component: 'Auth' })
    }
  } catch (err) {
    logger.error('Error parsing cloverbi_user', { component: 'Auth', data: err })
  }

  return null
}

/**
 * Obtiene los roles del usuario actual
 */
export function getUserRoles(): string[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const stored = localStorage.getItem('cloverbi_roles')
    if (stored) {
      const roles = JSON.parse(stored)
      return roles.map((r: any) => r.name)
    }
  } catch (err) {
    console.warn('Error parsing cloverbi_roles:', err)
  }

  return []
}

/**
 * Verifica si el usuario tiene un rol específico
 */
export function hasRole(roleName: string): boolean {
  return getUserRoles().includes(roleName)
}
