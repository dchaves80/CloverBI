import { NextRequest, NextResponse } from 'next/server'

const DOM_API_URL = process.env.DOM_API_URL || 'https://multit-back.digitalflow.ar'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validación básica
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email y password requeridos' },
        { status: 400 }
      )
    }

    // Llamar a DOM
    const response = await fetch(`${DOM_API_URL}/api/users/knockknock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (data.success) {
      // Extraer info relevante
      return NextResponse.json({
        success: true,
        user: {
          uid: data.data.user.uid,
          name: data.data.user.name,
          email: data.data.user.email,
          organization_uid: data.data.user.organization_uid,
          organization_name: data.data.user.organization_name,
        },
        roles: data.data.roles.map((r: any) => ({
          name: r.role_name,
          description: r.role_description,
        })),
        token: data.data.token, // 🔥 ATR - Authentication Token Response
      })
    } else {
      return NextResponse.json(
        { success: false, error: data.error || 'Credenciales inválidas' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { success: false, error: 'Error de servidor' },
      { status: 500 }
    )
  }
}
