// API Route - Proxy config desde backend
// El frontend obtiene la config de conexión a Ivy

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3002'

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/config`, {
      cache: 'no-store', // No cachear, siempre fresh
    })

    if (!res.ok) {
      return Response.json(
        { error: 'Error obteniendo config del backend' },
        { status: res.status }
      )
    }

    const data = await res.json()
    return Response.json(data)
    
  } catch (error) {
    console.error('Error conectando al backend:', error)
    return Response.json(
      { error: 'No se pudo conectar con el backend' },
      { status: 500 }
    )
  }
}
