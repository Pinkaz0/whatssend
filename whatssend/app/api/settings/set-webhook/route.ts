import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createEvolutionClient } from '@/lib/whatsapp/evolution'

/**
 * POST /api/settings/set-webhook
 * Registra la URL del webhook en Evolution API.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { instanceName } = body

    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id)
      .limit(1)
      .maybeSingle()

    const apiUrl = process.env.EVOLUTION_API_URL || 'https://api.empathaiapp.net'
    const apiKey = process.env.EVOLUTION_API_KEY

    const targetInstance = instanceName

    if (!targetInstance) {
      return NextResponse.json(
        { error: 'Crea una instancia de Evolution API antes de configurar el webhook.' },
        { status: 400 }
      )
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API Key Global no configurada en el servidor (.env)' },
        { status: 500 }
      )
    }

    // Construir URL única por workspace usando NEXT_PUBLIC_APP_URL (Vercel)
    // o el origin del request como fallback (desarrollo)
    const appBase =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
      `${request.nextUrl.protocol}//${request.nextUrl.host}`

    const webhookUrl = `${appBase}/api/messages/webhook?workspace_id=${workspace?.id}`

    // Call Evolution API to set webhook
    const response = await fetch(`${apiUrl.replace(/\/$/, '')}/webhook/set/${targetInstance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey
      },
      body: JSON.stringify({
        webhook: {
          url: webhookUrl,
          webhookByEvents: false,
          webhookBase64: false,
          enabled: true,
          events: [
            "MESSAGES_UPSERT",
            "MESSAGES_UPDATE",
            "SEND_MESSAGE"
          ]
        }
      })
    })

    if (response.ok) {
      return NextResponse.json({
        success: true,
        webhookUrl,
        message: 'Webhook configurado en Evolution API correctamente.',
      })
    }
    
    const errText = await response.text()
    return NextResponse.json({ error: `Error Evolution API: ${errText}` }, { status: 400 })
  } catch (err) {
    console.error('[SetWebhook] Error:', err)
    return NextResponse.json({ error: 'Error al configurar webhook' }, { status: 500 })
  }
}
