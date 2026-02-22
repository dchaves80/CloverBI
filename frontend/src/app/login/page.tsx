'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (data.success) {
        // Guardar en localStorage
        localStorage.setItem('cloverbi_user', JSON.stringify(data.user))
        localStorage.setItem('cloverbi_roles', JSON.stringify(data.roles))
        localStorage.setItem('cloverbi_token', data.token) // 🔥 ATR guardado
        
        // Obtener configuración de la organización
        try {
          const configRes = await fetch(
            `/api/config?organization_uid=${data.user.organization_uid}`,
            {
              headers: {
                'knockknock': data.token, // 🔥 ATR en el header
              },
            }
          )
          
          if (configRes.ok) {
            const config = await configRes.json()
            localStorage.setItem('cloverbi_config', JSON.stringify(config))
            console.log('✅ Configuración obtenida desde DOM:', config)
          } else {
            console.warn('⚠️ No se pudo obtener la configuración')
          }
        } catch (err) {
          console.warn('⚠️ Error obteniendo configuración:', err)
        }
        
        // Redirect según roles
        const roleNames = data.roles.map((r: any) => r.name)
        const hasAnalyst = roleNames.includes('data_analyst')
        const hasTrainer = roleNames.includes('data_trainer')
        
        if (hasAnalyst) {
          router.push('/overview') // Nueva home
        } else if (hasTrainer) {
          router.push('/training') // Solo trainer
        } else {
          router.push('/overview') // Default
        }
      } else {
        setError(data.error || 'Error de autenticación')
      }
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0f0a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-emerald-400">🍀 Clover BI</h1>
          <p className="text-gray-500 mt-2">Preguntá, no programes</p>
        </div>

        {/* Card de Login */}
        <div className="bg-[#111611] border border-emerald-900/30 rounded-lg p-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1 h-6 bg-emerald-500"></div>
            <h2 className="text-emerald-400 font-mono text-sm tracking-wider">ACCESS TERMINAL</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-gray-400 text-xs font-mono mb-2">EMAIL</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0a0f0a] border border-emerald-900/50 rounded px-4 py-3 text-emerald-100 font-mono text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="user@domain.com"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-gray-400 text-xs font-mono mb-2">PASSWORD</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0a0f0a] border border-emerald-900/50 rounded px-4 py-3 text-emerald-100 font-mono text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="••••••••"
                required
              />
            </div>

            {/* Error */}
            {error && (
              <div className="text-red-400 text-sm font-mono bg-red-900/20 border border-red-900/50 rounded px-4 py-2">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:cursor-not-allowed text-white font-mono text-sm py-3 rounded transition-colors"
            >
              {loading ? 'CONNECTING...' : 'INITIALIZE ACCESS'}
            </button>
          </form>

          {/* Footer */}
          <div className="flex justify-between items-center mt-6 text-xs text-gray-600 font-mono">
            <span>v1.0.0</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              ONLINE
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
