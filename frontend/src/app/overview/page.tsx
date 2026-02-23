'use client'

import AppLayout from '@/components/AppLayout'

export default function OverviewPage() {
  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <header className="bg-bg-secondary border-b border-bg-card px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏠</span>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Overview</h1>
              <p className="text-sm text-text-secondary">Resumen de actividad y estado del sistema</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-bg-secondary border border-bg-card rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-text-muted text-sm">Queries Hoy</span>
                  <span className="text-2xl">🔍</span>
                </div>
                <div className="text-3xl font-bold text-text-primary">0</div>
                <div className="text-xs text-text-muted mt-1">Sin actividad reciente</div>
              </div>

              <div className="bg-bg-secondary border border-bg-card rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-text-muted text-sm">Dashboards</span>
                  <span className="text-2xl">📊</span>
                </div>
                <div className="text-3xl font-bold text-text-primary">0</div>
                <div className="text-xs text-text-muted mt-1">Ningún dashboard creado</div>
              </div>

              <div className="bg-bg-secondary border border-bg-card rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-text-muted text-sm">Workspaces</span>
                  <span className="text-2xl">📁</span>
                </div>
                <div className="text-3xl font-bold text-text-primary">0</div>
                <div className="text-xs text-text-muted mt-1">Crear tu primer workspace</div>
              </div>

              <div className="bg-bg-secondary border border-bg-card rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-text-muted text-sm">Sistema</span>
                  <span className="text-2xl">✅</span>
                </div>
                <div className="text-lg font-bold text-clover">Operativo</div>
                <div className="text-xs text-text-muted mt-1">Todos los servicios OK</div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-bg-secondary border border-bg-card rounded-xl p-6">
              <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                <span>📝</span>
                Actividad Reciente
              </h2>
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🌱</div>
                <p className="text-text-muted">
                  Aún no hay actividad registrada.
                  <br />
                  Empezá explorando datos o creando dashboards.
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-bg-secondary border border-bg-card rounded-xl p-6">
              <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                <span>⚡</span>
                Acciones Rápidas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <a
                  href="/explorar"
                  className="flex items-center gap-3 p-4 bg-bg-primary hover:bg-bg-card border border-bg-card rounded-lg transition-colors group"
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform">🔍</span>
                  <div>
                    <div className="font-medium text-text-primary">Explorar Datos</div>
                    <div className="text-xs text-text-muted">Queries en lenguaje natural</div>
                  </div>
                </a>

                <a
                  href="/training"
                  className="flex items-center gap-3 p-4 bg-bg-primary hover:bg-bg-card border border-bg-card rounded-lg transition-colors group"
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform">🎓</span>
                  <div>
                    <div className="font-medium text-text-primary">Entrenar a Ivy</div>
                    <div className="text-xs text-text-muted">Enseñale sobre tus datos</div>
                  </div>
                </a>

                <a
                  href="/workspaces"
                  className="flex items-center gap-3 p-4 bg-bg-primary hover:bg-bg-card border border-bg-card rounded-lg transition-colors group"
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform">📁</span>
                  <div>
                    <div className="font-medium text-text-primary">Crear Workspace</div>
                    <div className="text-xs text-text-muted">Organiza tus dashboards</div>
                  </div>
                </a>
              </div>
            </div>

            {/* System Logs */}
            <div className="bg-bg-secondary border border-bg-card rounded-xl p-6">
              <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                <span>📋</span>
                Logs del Sistema
              </h2>
              <div className="space-y-2 font-mono text-xs">
                <div className="flex items-start gap-3 text-text-muted">
                  <span className="text-clover">✓</span>
                  <span className="text-text-muted opacity-60">[{new Date().toLocaleTimeString()}]</span>
                  <span>Sistema iniciado correctamente</span>
                </div>
                <div className="flex items-start gap-3 text-text-muted">
                  <span className="text-clover">✓</span>
                  <span className="text-text-muted opacity-60">[{new Date().toLocaleTimeString()}]</span>
                  <span>Conexión con base de datos establecida</span>
                </div>
                <div className="flex items-start gap-3 text-text-muted">
                  <span className="text-clover">✓</span>
                  <span className="text-text-muted opacity-60">[{new Date().toLocaleTimeString()}]</span>
                  <span>Ivy agent ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
