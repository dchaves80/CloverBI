// API Route - Proxy interno al backend
// El backend nunca se expone a internet

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3002'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    const res = await fetch(`${BACKEND_URL}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const error = await res.text()
      return Response.json(
        { error: 'Error del backend', details: error },
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
