// API Route - Obtener configuración desde DOM
// Usa el ATR (token knockknock) para obtener config de la organización

import { NextRequest, NextResponse } from 'next/server'

const DOM_API_URL = process.env.DOM_API_URL || 'https://multit-back.digitalflow.ar'

export async function GET(request: NextRequest) {
  try {
    // 🔥 Obtener ATR del header knockknock
    const token = request.headers.get('knockknock')
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token de autenticación requerido (header knockknock)' },
        { status: 401 }
      )
    }

    // Obtener organization_uid del query param
    const { searchParams } = new URL(request.url)
    const organizationUid = searchParams.get('organization_uid')

    if (!organizationUid) {
      return NextResponse.json(
        { error: 'organization_uid requerido' },
        { status: 400 }
      )
    }

    // 🔥 Llamar al DOM para obtener configs de la org
    const response = await fetch(
      `${DOM_API_URL}/api/organization-configs?organization_uid=${organizationUid}`,
      {
        headers: {
          'knockknock': token, // 🔥 ATR en el header
        },
      }
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Error obteniendo configuración del DOM' },
        { status: response.status }
      )
    }

    const data = await response.json()

    if (!data.success || !data.data?.configs) {
      return NextResponse.json(
        { error: 'Configuración no disponible' },
        { status: 404 }
      )
    }

    // Buscar config activa para el environment
    const environment = searchParams.get('environment') || 'production'
    
    // Buscar por environment y is_active
    const activeConfigs = data.data.configs.filter(
      (c: any) => c.environment === environment && c.is_active
    )

    if (activeConfigs.length === 0) {
      return NextResponse.json(
        { error: `No hay configuración activa para environment: ${environment}` },
        { status: 404 }
      )
    }

    // Preferir config_key "cloverbi" si existe, sino tomar la primera
    const config = activeConfigs.find((c: any) => c.config_key === 'cloverbi') 
      || activeConfigs[0]

    // Retornar config_data directamente
    return NextResponse.json(config.config_data)

  } catch (error) {
    console.error('Error obteniendo config desde DOM:', error)
    return NextResponse.json(
      { error: 'Error de servidor' },
      { status: 500 }
    )
  }
}
