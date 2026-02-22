// API Route - Proxy al backend
// En producción Docker: usa URL interna (http://cloverbi-backend:3001)
// En desarrollo local: puede usar backend remoto si no hay local

import { NextRequest, NextResponse } from 'next/server'

// 🔥 Backend URL - puede ser local o remoto
// Producción: BACKEND_URL=http://cloverbi-backend:3001 (red Docker)
// Desarrollo: BACKEND_URL=https://api-backend.cloverbi.neosolutions.com.ar (remoto)
// Fallback: http://localhost:3002 (backend local dev)
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3002'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // 🔥 SIEMPRE usa BACKEND_URL (interna), no la pública del DOM
    // Los contenedores se comunican via red Docker interna
    const res = await fetch(`${BACKEND_URL}/api/query`, {
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
