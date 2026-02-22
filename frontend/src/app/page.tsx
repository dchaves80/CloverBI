'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to overview
    router.push('/overview')
  }, [router])

  return (
    <div className="min-h-screen bg-[#0a0f0a] flex items-center justify-center">
      <div className="text-emerald-400 font-mono">Redirigiendo...</div>
    </div>
  )
}
