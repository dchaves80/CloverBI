'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import { getConfig, getCurrentUser, getUserRoles, getAuthToken, type CloverBIConfig } from '@/lib/config'

interface UserInfo {
  uid: string
  name: string
  email: string
  organization_name: string
  organization_uid: string
}

export default function ConfiguracionPage() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [roles, setRoles] = useState<string[]>([])
  const [config, setConfig] = useState<CloverBIConfig | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    const userData = getCurrentUser()
    const userRoles = getUserRoles()
    const configData = getConfig()

    setUser(userData)
    setRoles(userRoles)
    setConfig(configData)
  }

  const handleRefreshConfig = async () => {
    if (!user) return

    setRefreshing(true)
    try {
      const token = getAuthToken()
      const res = await fetch(
        `/api/config?organization_uid=${user.organization_uid}`,
        {
          headers: {
            'knockknock': token || '',
          },
        }
      )

      if (res.ok) {
        const newConfig = await res.json()
        localStorage.setItem('cloverbi_config', JSON.stringify(newConfig))
        setConfig(newConfig)
        alert('✅ Configuración actualizada')
      } else {
        alert('❌ Error al actualizar configuración')
      }
    } catch (err) {
      console.error('Error refreshing config:', err)
      alert('❌ Error de conexión')
    } finally {
      setRefreshing(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('cloverbi_user')
    localStorage.removeItem('cloverbi_roles')
    localStorage.removeItem('cloverbi_token')
    localStorage.removeItem('cloverbi_config')
    router.push('/login')
  }

  const InfoCard = ({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) => (
    <div className="bg-surface-secondary border border-border-primary rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">{icon}</span>
        <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
      </div>
      {children}
    </div>
  )

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between items-center py-2 border-b border-border-primary/30 last:border-0">
      <span className="text-text-secondary text-sm font-mono">{label}</span>
      <span className="text-text-primary text-sm font-mono break-all text-right ml-4">{value}</span>
    </div>
  )

  return (
    <AppLayout>
      <div className="h-full overflow-auto p-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-emerald-500"></div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">Configuración</h1>
                <p className="text-text-secondary text-sm">Información del sistema y usuario</p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleRefreshConfig}
                disabled={refreshing}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white text-sm font-mono rounded transition-colors"
              >
                {refreshing ? '🔄 Refrescando...' : '🔄 Refrescar Config'}
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-mono rounded transition-colors"
              >
                🚪 Cerrar Sesión
              </button>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Info */}
            <InfoCard title="Usuario" icon="👤">
              {user ? (
                <>
                  <InfoRow label="NOMBRE" value={user.name} />
                  <InfoRow label="EMAIL" value={user.email} />
                  <InfoRow label="UID" value={user.uid.slice(0, 18) + '...'} />
                </>
              ) : (
                <p className="text-text-secondary text-sm">No hay información de usuario</p>
              )}
            </InfoCard>

            {/* Organization Info */}
            <InfoCard title="Organización" icon="🏢">
              {user ? (
                <>
                  <InfoRow label="NOMBRE" value={user.organization_name} />
                  <InfoRow label="UID" value={user.organization_uid.slice(0, 18) + '...'} />
                </>
              ) : (
                <p className="text-text-secondary text-sm">No hay información de organización</p>
              )}
            </InfoCard>

            {/* Roles */}
            <InfoCard title="Roles Asignados" icon="🎭">
              {roles.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {roles.map((role) => (
                    <span
                      key={role}
                      className="px-3 py-1 bg-emerald-900/30 border border-emerald-700 text-emerald-400 text-xs font-mono rounded-full"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-text-secondary text-sm">No hay roles asignados</p>
              )}
            </InfoCard>

            {/* Backend Config */}
            <InfoCard title="Backend" icon="⚙️">
              {config?.backend ? (
                <InfoRow label="URL" value={config.backend.url} />
              ) : (
                <p className="text-text-secondary text-sm">No configurado</p>
              )}
            </InfoCard>

            {/* Ivy Config */}
            <InfoCard title="Ivy Agent" icon="🌿">
              {config?.ivy ? (
                <>
                  <InfoRow label="GATEWAY" value={config.ivy.gateway_url} />
                  <InfoRow 
                    label="TOKEN" 
                    value={config.ivy.gateway_token ? '••••••••••••' : 'No configurado'} 
                  />
                </>
              ) : (
                <p className="text-text-secondary text-sm">No configurado</p>
              )}
            </InfoCard>

            {/* System Info */}
            <InfoCard title="Sistema" icon="📡">
              <InfoRow label="VERSION" value="v1.0.0" />
              <InfoRow label="ENVIRONMENT" value="production" />
              <div className="flex items-center justify-between py-2">
                <span className="text-text-secondary text-sm font-mono">STATUS</span>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span className="text-emerald-400 text-sm font-mono">ONLINE</span>
                </span>
              </div>
            </InfoCard>
          </div>

          {/* Footer Note */}
          <div className="mt-6 p-4 bg-surface-secondary border border-border-primary rounded-lg">
            <p className="text-text-secondary text-xs font-mono text-center">
              💡 Esta configuración se obtiene desde el DOM al iniciar sesión. 
              Los cambios deben realizarse en el panel de administración del DOM.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
