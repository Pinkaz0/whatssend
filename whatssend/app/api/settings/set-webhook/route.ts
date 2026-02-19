import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createUltraMsgClient } from '@/lib/ultramsg/client'

/**
 * POST /api/settings/set-webhook
 * Construye automáticamente la URL del webhook con ?workspace_id=
 * y la registra en UltraMsg. No acepta webhookUrl del body.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id, ultramsg_instance_id, ultramsg_token')
      .eq('owner_id', user.id)
      .limit(1)
      .maybeSingle()

    if (!workspace?.ultramsg_instance_id || !workspace.ultramsg_token) {
      return NextResponse.json(
        { error: 'Configura Instance ID y Token de UltraMsg antes de configurar el webhook.' },
        { status: 400 }
      )
    }

    // Construir URL única por workspace usando NEXT_PUBLIC_APP_URL (Vercel)
    // o el origin del request como fallback (desarrollo)
    const appBase =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
      `${request.nextUrl.protocol}//${request.nextUrl.host}`

    const webhookUrl = `${appBase}/api/messages/webhook?workspace_id=${workspace.id}`

    const ultramsg = createUltraMsgClient(workspace.ultramsg_instance_id, workspace.ultramsg_token)
    const result = await ultramsg.setWebhook(webhookUrl)

    if (result.ok) {
      return NextResponse.json({
        success: true,
        webhookUrl,
        message: 'Webhook configurado en UltraMsg correctamente.',
      })
    }
    return NextResponse.json({ error: result.error }, { status: 400 })
  } catch (err) {
    console.error('[SetWebhook] Error:', err)
    return NextResponse.json({ error: 'Error al configurar webhook' }, { status: 500 })
  }
}
