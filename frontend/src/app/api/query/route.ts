// API Route - Proxy interno al backend
// Siempre usa la URL INTERNA del backend (env var BACKEND_URL)
// La URL pública del DOM es solo para referencia/documentación

import { NextRequest, NextResponse } from 'next/server'

// 🔥 URL interna para comunicación entre contenedores Docker
// En producción: http://cloverbi-backend:3001
// En desarrollo: http://localhost:3002
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
