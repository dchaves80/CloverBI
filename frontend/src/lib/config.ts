// Utilidad para obtener configuración desde localStorage
// La config se carga desde DOM al hacer login

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
    return DEFAULT_CONFIG
  }

  try {
    const stored = localStorage.getItem('cloverbi_config')
    if (stored) {
      return JSON.parse(stored) as CloverBIConfig
    }
  } catch (err) {
    console.warn('Error parsing cloverbi_config:', err)
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

  return localStorage.getItem('cloverbi_token')
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
      return JSON.parse(stored)
    }
  } catch (err) {
    console.warn('Error parsing cloverbi_user:', err)
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
