import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createUltraMsgClient } from '@/lib/ultramsg/client'

/**
 * POST /api/settings/set-webhook
 * Configura en UltraMsg la URL del webhook y activa "message received".
 * Así UltraMsg enviará POST a nuestra URL cuando llegue un mensaje.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { webhookUrl } = body as { webhookUrl: string }

    if (!webhookUrl || typeof webhookUrl !== 'string' || !webhookUrl.startsWith('http')) {
      return NextResponse.json({ error: 'URL de webhook no válida' }, { status: 400 })
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

    const ultramsg = createUltraMsgClient(workspace.ultramsg_instance_id, workspace.ultramsg_token)
    const result = await ultramsg.setWebhook(webhookUrl.trim())

    if (result.ok) {
      return NextResponse.json({ success: true, message: 'Webhook configurado en UltraMsg (recibir mensajes activado).' })
    }
    return NextResponse.json({ error: result.error }, { status: 400 })
  } catch (err) {
    console.error('[SetWebhook] Error:', err)
    return NextResponse.json({ error: 'Error al configurar webhook' }, { status: 500 })
  }
}
