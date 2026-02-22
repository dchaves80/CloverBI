'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from './Sidebar'

interface AppLayoutProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireRole?: string
}

export default function AppLayout({ children, requireAuth = true, requireRole }: AppLayoutProps) {
  const [user, setUser] = useState<any>(null)
  const [roles, setRoles] = useState<any[]>([])
  const [authChecked, setAuthChecked] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.add('light')
    }
  }, [darkMode])

  useEffect(() => {
    const storedUser = localStorage.getItem('cloverbi_user')
    const storedRoles = localStorage.getItem('cloverbi_roles')
    
    if (requireAuth && !storedUser) {
      router.push('/login')
      return
    }

    if (storedUser) {
      const parsedUser = JSON.parse(storedUser)
      const parsedRoles = storedRoles ? JSON.parse(storedRoles) : []
      
      setUser(parsedUser)
      setRoles(parsedRoles)

      // Check required role
      if (requireRole) {
        const hasRequiredRole = parsedRoles.some((r: any) => r.name === requireRole)
        if (!hasRequiredRole) {
          router.push('/overview')
          return
        }
      }
    }
    
    setAuthChecked(true)
  }, [requireAuth, requireRole, router])

  const handleLogout = () => {
    localStorage.removeItem('cloverbi_user')
    localStorage.removeItem('cloverbi_roles')
    router.push('/login')
  }

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev)
  }

  if (requireAuth && !authChecked) {
    return (
      <div className="min-h-screen bg-[#0a0f0a] flex items-center justify-center">
        <div className="text-emerald-400 font-mono">Cargando...</div>
      </div>
    )
  }

  if (!requireAuth) {
    return <>{children}</>
  }

  return (
    <div className="h-screen flex overflow-hidden bg-bg-primary transition-colors duration-300">
      <Sidebar
        user={user}
        roles={roles}
        onLogout={handleLogout}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
      />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
