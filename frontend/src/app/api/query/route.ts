// API Route - Proxy interno al backend
// Usa la URL del backend desde la config del DOM (pasada via header)

import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3002'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // 🔥 Obtener backend URL desde header (config dinámica del DOM)
    const backendUrl = req.headers.get('x-backend-url') || DEFAULT_BACKEND_URL
    
    const res = await fetch(`${backendUrl}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const error = await res.text()
      return NextResponse.json(
        { error: 'Error del backend', details: error },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Error conectando al backend:', error)
    return NextResponse.json(
      { error: 'No se pudo conectar con el backend' },
      { status: 500 }
    )
  }
}
