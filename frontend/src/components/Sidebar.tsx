'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

interface SidebarProps {
  user: any
  roles: any[]
  onLogout: () => void
  darkMode: boolean
  onToggleDarkMode: () => void
}

export default function Sidebar({ user, roles, onLogout, darkMode, onToggleDarkMode }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  const hasRole = (roleName: string) => roles.some(r => r.name === roleName)

  const menuItems = [
    {
      id: 'overview',
      icon: '🏠',
      label: 'Overview',
      href: '/overview',
      show: true
    },
    {
      id: 'explorar',
      icon: '🔍',
      label: 'Explorar',
      href: '/explorar',
      show: hasRole('data_analyst')
    },
    {
      id: 'training',
      icon: '🎓',
      label: 'Training',
      href: '/training',
      show: hasRole('data_trainer')
    },
    {
      id: 'workspaces',
      icon: '📁',
      label: 'Workspaces',
      href: '/workspaces',
      show: hasRole('data_analyst')
    },
  ]

  return (
    <aside
      className={`flex flex-col bg-bg-secondary border-r border-bg-card transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-bg-card">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍀</span>
            <h1 className="text-lg font-bold text-clover">Clover BI</h1>
          </div>
        )}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="mx-auto text-2xl hover:scale-110 transition-transform"
          >
            🍀
          </button>
        )}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="p-1 hover:bg-bg-card rounded transition-colors text-text-muted"
          >
            ◂
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {menuItems.filter(item => item.show).map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-clover text-white'
                  : 'text-text-secondary hover:bg-bg-card hover:text-text-primary'
              } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? item.label : ''}
            >
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-bg-card p-2 space-y-1">
        {/* Dark Mode Toggle */}
        <button
          onClick={onToggleDarkMode}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-text-secondary hover:bg-bg-card hover:text-text-primary w-full ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? (darkMode ? 'Dark Mode' : 'Light Mode') : ''}
        >
          <span className="text-xl flex-shrink-0">{darkMode ? '🌙' : '☀️'}</span>
          {!collapsed && <span className="text-sm font-medium">
            {darkMode ? 'Dark Mode' : 'Light Mode'}
          </span>}
        </button>

        {/* Configuration */}
        <Link
          href="/configuracion"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-text-secondary hover:bg-bg-card hover:text-text-primary ${
            pathname === '/configuracion' ? 'bg-bg-card text-text-primary' : ''
          } ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Configuración' : ''}
        >
          <span className="text-xl flex-shrink-0">⚙️</span>
          {!collapsed && <span className="text-sm font-medium">Configuración</span>}
        </Link>

        {/* User Profile / Logout */}
        <div className={`flex items-center gap-3 px-3 py-2.5 ${collapsed ? 'justify-center' : ''}`}>
          {!collapsed ? (
            <div className="flex items-center gap-3 w-full">
              <div className="w-8 h-8 rounded-full bg-clover flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {(user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text-primary truncate">
                  {user?.name || user?.email || 'Usuario'}
                </div>
                <div className="text-xs text-text-muted truncate">
                  {roles.map(r => r.name).join(', ') || 'Sin roles'}
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded transition-colors flex-shrink-0"
                title="Cerrar sesión"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              onClick={onLogout}
              className="w-8 h-8 rounded-full bg-clover hover:bg-red-500 flex items-center justify-center text-white text-sm font-bold transition-colors"
              title="Cerrar sesión"
            >
              {(user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}
