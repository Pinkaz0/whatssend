import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createUltraMsgClient } from '@/lib/ultramsg/client'

/**
 * POST /api/campaigns/send
 * Envía los mensajes de una campaña de forma secuencial.
 * En producción esto debería usar QStash o background jobs.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { campaignId } = body as { campaignId: string }

    if (!campaignId) {
      return NextResponse.json({ error: 'Falta campaignId' }, { status: 400 })
    }

    // 1. Obtener campaña y verificar ownership
    const { data: campaign, error: campError } = await supabase
      .from('campaigns')
      .select('*, workspaces!inner(owner_id, ultramsg_instance_id, ultramsg_token)')
      .eq('id', campaignId)
      .single()

    if (campError || !campaign) {
      return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 })
    }

    const workspace = campaign.workspaces as unknown as {
      owner_id: string
      ultramsg_instance_id: string | null
      ultramsg_token: string | null
    }

    if (workspace.owner_id !== user.id) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    // 2. Marcar campaña como 'sending'
    await supabase
      .from('campaigns')
      .update({ status: 'sending' })
      .eq('id', campaignId)

    // 3. Obtener contactos pendientes
    const { data: campaignContacts } = await supabase
      .from('campaign_contacts')
      .select('id, contact_id, contacts(phone, name)')
      .eq('campaign_id', campaignId)
      .eq('status', 'pending')

    if (!campaignContacts || campaignContacts.length === 0) {
      await supabase.from('campaigns').update({ status: 'completed' }).eq('id', campaignId)
      return NextResponse.json({ success: true, sent: 0 })
    }

    // 4. Inicializar UltraMsg client
    const ultramsg = createUltraMsgClient(workspace.ultramsg_instance_id, workspace.ultramsg_token)

    let sentCount = 0
    let failedCount = 0

    // 5. Enviar secuencialmente con delay para evitar throttling
    for (const cc of campaignContacts) {
      const contact = cc.contacts as unknown as { phone: string; name: string | null }
      if (!contact?.phone) continue

      // Personalizar mensaje
      let messageBody = campaign.message_body || ''
      messageBody = messageBody.replace(/\{\{nombre\}\}/gi, contact.name || '')
      messageBody = messageBody.replace(/\{\{name\}\}/gi, contact.name || '')
      messageBody = messageBody.replace(/\{\{telefono\}\}/gi, contact.phone || '')
      messageBody = messageBody.replace(/\{\{phone\}\}/gi, contact.phone || '')

      const result = await ultramsg.sendMessage(contact.phone, messageBody)

      if (result.ok) {
        await supabase
          .from('campaign_contacts')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', cc.id)

        // También guardar en messages
        await supabase.from('messages').insert({
          workspace_id: campaign.workspace_id,
          contact_id: cc.contact_id,
          campaign_id: campaignId,
          direction: 'outbound',
          body: messageBody,
          status: 'sent',
          ultramsg_message_id: result.data.id || null,
          sent_at: new Date().toISOString(),
        })

        sentCount++
      } else {
        await supabase
          .from('campaign_contacts')
          .update({ status: 'failed' })
          .eq('id', cc.id)
        failedCount++
      }

      // Delay 1.5s entre mensajes para evitar throttling
      await new Promise(resolve => setTimeout(resolve, 1500))
    }

    // 6. Marcar campaña como completada
    await supabase
      .from('campaigns')
      .update({ status: 'completed', sent_at: new Date().toISOString() })
      .eq('id', campaignId)

    return NextResponse.json({ success: true, sent: sentCount, failed: failedCount })
  } catch (err) {
    console.error('[Campaign Send] Error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
