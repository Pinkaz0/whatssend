import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createEvolutionClient } from '@/lib/whatsapp/evolution'

/**
 * POST /api/settings/test-connection
 * Prueba la conexión con UltraMsg usando las credenciales proporcionadas.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { instanceName } = body as { instanceName: string }

    const apiUrl = process.env.EVOLUTION_API_URL || 'https://api.empathaiapp.net'
    const apiKey = process.env.EVOLUTION_API_KEY

    if (!instanceName) {
      return NextResponse.json(
        { error: 'Falta instanceName' },
        { status: 400 }
      )
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API Key Global no configurada en el servidor (.env)' },
        { status: 500 }
      )
    }

    const client = createEvolutionClient(apiUrl, apiKey, instanceName)
    const result = await client.testConnection()

    if (result.ok) {
      return NextResponse.json({ success: true, message: 'Conectado a Evolution API' })
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }
  } catch (err) {
    console.error('[TestConnection] Error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
