'use client'

import AppLayout from '@/components/AppLayout'

export default function ConfiguracionPage() {
  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <header className="bg-bg-secondary border-b border-bg-card px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚙️</span>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Configuración</h1>
              <p className="text-sm text-text-secondary">Ajustes del sistema y preferencias</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Database Connection */}
            <div className="bg-bg-secondary border border-bg-card rounded-xl p-6">
              <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                <span>🗄️</span>
                Conexión a Base de Datos
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Servidor
                  </label>
                  <input
                    type="text"
                    defaultValue="localhost:2433"
                    className="w-full px-4 py-2 bg-bg-primary border border-bg-card rounded-lg text-text-primary focus:outline-none focus:border-clover"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Base de Datos
                  </label>
                  <input
                    type="text"
                    defaultValue="demo_bi"
                    className="w-full px-4 py-2 bg-bg-primary border border-bg-card rounded-lg text-text-primary focus:outline-none focus:border-clover"
                    disabled
                  />
                </div>
                <div className="text-xs text-text-muted">
                  ℹ️ La configuración de base de datos se gestiona desde el backend
                </div>
              </div>
            </div>

            {/* Ivy Configuration */}
            <div className="bg-bg-secondary border border-bg-card rounded-xl p-6">
              <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                <span>🌿</span>
                Configuración de Ivy
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Gateway URL
                  </label>
                  <input
                    type="text"
                    placeholder="wss://clover.neosolutions.com.ar/"
                    className="w-full px-4 py-2 bg-bg-primary border border-bg-card rounded-lg text-text-primary focus:outline-none focus:border-clover"
                    disabled
                  />
                </div>
                <div className="text-xs text-text-muted">
                  ℹ️ La configuración de Ivy se gestiona desde el backend
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="bg-bg-secondary border border-bg-card rounded-xl p-6">
              <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                <span>🎨</span>
                Preferencias
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-text-primary">Modo Oscuro</div>
                    <div className="text-sm text-text-muted">Usar tema oscuro en la interfaz</div>
                  </div>
                  <button className="w-12 h-6 bg-clover rounded-full relative">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                  </button>
                </div>
                
                <div className="flex items-center justify-between opacity-50">
                  <div>
                    <div className="font-medium text-text-primary">Auto-refresh</div>
                    <div className="text-sm text-text-muted">Actualizar dashboards automáticamente</div>
                  </div>
                  <button className="w-12 h-6 bg-bg-card rounded-full relative" disabled>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-text-muted rounded-full"></div>
                  </button>
                </div>

                <div className="opacity-50">
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Intervalo de refresh (minutos)
                  </label>
                  <input
                    type="number"
                    defaultValue="5"
                    min="1"
                    max="60"
                    className="w-32 px-4 py-2 bg-bg-primary border border-bg-card rounded-lg text-text-primary focus:outline-none focus:border-clover"
                    disabled
                  />
                </div>

                <div className="text-xs text-text-muted mt-4">
                  💡 Funcionalidades de preferencias próximamente
                </div>
              </div>
            </div>

            {/* Account */}
            <div className="bg-bg-secondary border border-bg-card rounded-xl p-6">
              <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                <span>👤</span>
                Cuenta
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Usuario
                  </label>
                  <div className="px-4 py-2 bg-bg-primary border border-bg-card rounded-lg text-text-primary">
                    {typeof window !== 'undefined' && JSON.parse(localStorage.getItem('cloverbi_user') || '{}').email}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Roles
                  </label>
                  <div className="px-4 py-2 bg-bg-primary border border-bg-card rounded-lg text-text-primary">
                    {typeof window !== 'undefined' && JSON.parse(localStorage.getItem('cloverbi_roles') || '[]').map((r: any) => r.name).join(', ')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
