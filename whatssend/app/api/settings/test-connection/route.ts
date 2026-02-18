import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { UltraMsgClient } from '@/lib/ultramsg/client'

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
    const { instanceId, token } = body as { instanceId: string; token: string }

    if (!instanceId || !token) {
      return NextResponse.json(
        { error: 'Faltan instanceId y token' },
        { status: 400 }
      )
    }

    const client = new UltraMsgClient(instanceId, token)
    const result = await client.testConnection()

    if (result.ok) {
      return NextResponse.json({ success: true, message: result.data.message })
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }
  } catch (err) {
    console.error('[TestConnection] Error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
