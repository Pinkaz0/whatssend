import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/campaigns/send
 *
 * Si QSTASH_TOKEN está definido (producción):
 *   - Encola cada campaign_contact en QStash con flow control (1 msg/seg)
 *   - Responde inmediatamente con { queued: N }
 *
 * Si no hay QSTASH_TOKEN (desarrollo local):
 *   - Ejecuta el loop síncrono original como fallback
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

    const rawWorkspace = campaign.workspaces
    const workspace = (Array.isArray(rawWorkspace) ? rawWorkspace[0] : rawWorkspace) as {
      owner_id: string
      ultramsg_instance_id: string | null
      ultramsg_token: string | null
    } | null

    if (!workspace || workspace.owner_id !== user.id) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    if (!workspace.ultramsg_instance_id?.trim() || !workspace.ultramsg_token?.trim()) {
      return NextResponse.json(
        { error: 'Configura tu instancia y token de UltraMsg en Ajustes antes de enviar campañas.' },
        { status: 400 }
      )
    }

    // 2. Obtener contactos pendientes
    const { data: campaignContacts } = await supabase
      .from('campaign_contacts')
      .select('id, contact_id, contacts(phone, name)')
      .eq('campaign_id', campaignId)
      .eq('status', 'pending')

    if (!campaignContacts || campaignContacts.length === 0) {
      await supabase.from('campaigns').update({ status: 'completed' }).eq('id', campaignId)
      return NextResponse.json({ success: true, sent: 0, failed: 0, message: 'No hay contactos pendientes.' })
    }

    // 3. Marcar como running
    await supabase.from('campaigns').update({ status: 'running' }).eq('id', campaignId)

    const qstashToken = process.env.QSTASH_TOKEN
    const appUrl = process.env.NEXT_PUBLIC_APP_URL

    // ── MODO PRODUCCIÓN: encolar en QStash ──────────────────────────────────
    if (qstashToken) {
      const { Client } = await import('@upstash/qstash')
      const qstash = new Client({ token: qstashToken })

      // Construir la URL del worker desde el request actual para no depender
      // de NEXT_PUBLIC_APP_URL (que puede apuntar a un preview deployment viejo)
      const origin = appUrl?.replace(/\/$/, '') ||
        `${request.nextUrl.protocol}//${request.nextUrl.host}`
      const workerUrl = `${origin}/api/campaigns/worker`

      await Promise.all(
        campaignContacts.map((cc) =>
          qstash.publishJSON({
            url: workerUrl,
            body: {
              campaignContactId: cc.id,
              campaignId,
            },
            flowControl: {
              key: `campaign-${campaignId}`,
              rate: 1,
              period: '1s',
              parallelism: 1,
            },
          })
        )
      )

      console.log(`[Campaign Send] Encolados ${campaignContacts.length} mensajes en QStash para campaign ${campaignId} → ${workerUrl}`)
      // Devolver sent/failed como aliases para que el UI no muestre 'undefined'
      return NextResponse.json({
        success: true,
        queued: campaignContacts.length,
        sent: campaignContacts.length,   // pendientes encolados
        failed: 0,
      })
    }

    // ── MODO DESARROLLO: loop síncrono (fallback sin QStash) ─────────────────
    console.log('[Campaign Send] Modo dev — loop síncrono (sin QStash)')
    const { createUltraMsgClient } = await import('@/lib/ultramsg/client')
    const ultramsg = createUltraMsgClient(workspace.ultramsg_instance_id!, workspace.ultramsg_token!)

    let sentCount = 0
    let failedCount = 0
    const errors: string[] = []

    for (const cc of campaignContacts) {
      const contact = cc.contacts as unknown as { phone: string; name: string | null }
      if (!contact?.phone) { failedCount++; continue }

      let messageBody = campaign.message_body || ''
      messageBody = messageBody.replace(/\{\{nombre\}\}/gi, contact.name || '')
      messageBody = messageBody.replace(/\{\{name\}\}/gi, contact.name || '')
      messageBody = messageBody.replace(/\{\{telefono\}\}/gi, contact.phone || '')
      messageBody = messageBody.replace(/\{\{phone\}\}/gi, contact.phone || '')

      const result = await ultramsg.sendMessage(contact.phone, messageBody)

      if (result.ok) {
        await supabase.from('campaign_contacts')
          .update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', cc.id)
        await supabase.from('messages').insert({
          workspace_id: campaign.workspace_id,
          contact_id: cc.contact_id,
          campaign_id: campaignId,
          direction: 'outbound',
          body: messageBody,
          status: 'sent',
          ultramsg_message_id: result.data?.id || null,
          sent_at: new Date().toISOString(),
        })
        sentCount++
      } else {
        await supabase.from('campaign_contacts').update({ status: 'failed' }).eq('id', cc.id)
        failedCount++
        errors.push(`${contact.phone}: ${result.error || 'Error'}`)
      }

      await new Promise(resolve => setTimeout(resolve, 1500))
    }

    await supabase.from('campaigns')
      .update({ status: 'completed' }).eq('id', campaignId)

    return NextResponse.json({ success: true, sent: sentCount, failed: failedCount, ...(errors.length > 0 && { errors }) })

  } catch (err) {
    console.error('[Campaign Send] Error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
