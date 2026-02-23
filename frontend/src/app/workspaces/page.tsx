'use client'

import AppLayout from '@/components/AppLayout'

export default function WorkspacesPage() {
  return (
    <AppLayout requireRole="data_analyst">
      <div className="h-full flex flex-col">
        {/* Header */}
        <header className="bg-bg-secondary border-b border-bg-card px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📁</span>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Workspaces</h1>
              <p className="text-sm text-text-secondary">Organiza tus dashboards por proyecto</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto">
            {/* Empty State */}
            <div className="text-center py-20">
              <div className="text-8xl mb-6">📁</div>
              <h2 className="text-2xl font-bold text-text-primary mb-3">
                No hay workspaces todavía
              </h2>
              <p className="text-text-secondary max-w-lg mx-auto mb-8">
                Los workspaces te permiten organizar dashboards por proyecto o contexto.
                Cada workspace puede contener múltiples dashboards con cards guardadas.
              </p>
              
              <button
                className="px-6 py-3 bg-clover hover:bg-clover-dark rounded-xl font-medium text-white transition inline-flex items-center gap-2"
              >
                <span>➕</span>
                Crear Mi Primer Workspace
              </button>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
              <div className="bg-bg-secondary border border-bg-card rounded-xl p-6">
                <div className="text-3xl mb-3">🎯</div>
                <h3 className="font-bold text-text-primary mb-2">Organización</h3>
                <p className="text-sm text-text-secondary">
                  Separa dashboards por cliente, proyecto o departamento
                </p>
              </div>

              <div className="bg-bg-secondary border border-bg-card rounded-xl p-6">
                <div className="text-3xl mb-3">💾</div>
                <h3 className="font-bold text-text-primary mb-2">Cards Guardadas</h3>
                <p className="text-sm text-text-secondary">
                  Queries SQL guardadas que no consumen tokens al actualizar
                </p>
              </div>

              <div className="bg-bg-secondary border border-bg-card rounded-xl p-6">
                <div className="text-3xl mb-3">🔄</div>
                <h3 className="font-bold text-text-primary mb-2">Auto-refresh</h3>
                <p className="text-sm text-text-secondary">
                  Dashboards que se actualizan automáticamente sin gastar tokens
                </p>
              </div>
            </div>

            {/* How it Works */}
            <div className="mt-12 bg-bg-secondary border border-bg-card rounded-xl p-6">
              <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                <span>💡</span>
                ¿Cómo funciona?
              </h3>
              <div className="space-y-3 text-sm text-text-secondary">
                <div className="flex gap-3">
                  <span className="text-clover font-bold">1.</span>
                  <div>
                    <span className="font-medium text-text-primary">Crea un Workspace</span>
                    <br />
                    Por ejemplo: "Ventas Q1 2026" o "Cliente Acme"
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-clover font-bold">2.</span>
                  <div>
                    <span className="font-medium text-text-primary">Agrega Dashboards</span>
                    <br />
                    Dentro del workspace, crea dashboards temáticos
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-clover font-bold">3.</span>
                  <div>
                    <span className="font-medium text-text-primary">Guarda Cards desde Explorar</span>
                    <br />
                    Cuando hagas queries en Explorar, podes guardarlas como cards en tus dashboards
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-clover font-bold">4.</span>
                  <div>
                    <span className="font-medium text-text-primary">Refresh sin tokens</span>
                    <br />
                    Las cards guardadas ejecutan la SQL directamente, sin consumir tokens de IA
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
