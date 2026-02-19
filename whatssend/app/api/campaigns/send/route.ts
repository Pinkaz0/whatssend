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

    // Normalizar: relación puede venir como objeto o array (según Supabase/PostgREST)
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

    console.log('[Campaign Send] Pendientes:', campaignContacts?.length ?? 0, 'campaignId:', campaignId)

    if (!campaignContacts || campaignContacts.length === 0) {
      await supabase.from('campaigns').update({ status: 'completed' }).eq('id', campaignId)
      console.log('[Campaign Send] Sin contactos pendientes — campaña marcada completed')
      return NextResponse.json({ success: true, sent: 0, failed: 0, message: 'No hay contactos pendientes en esta campaña.' })
    }

    // 4. Inicializar UltraMsg client
    const ultramsg = createUltraMsgClient(workspace.ultramsg_instance_id, workspace.ultramsg_token)
    console.log('[Campaign Send] UltraMsg client OK, instance:', workspace.ultramsg_instance_id?.slice(0, 8) + '...')

    let sentCount = 0
    let failedCount = 0
    const errors: string[] = []

    // 5. Enviar secuencialmente con delay para evitar throttling
    for (const cc of campaignContacts) {
      const contact = cc.contacts as unknown as { phone: string; name: string | null }
      if (!contact?.phone) {
        console.warn('[Campaign Send] Contacto sin teléfono, contact_id:', cc.contact_id)
        failedCount++
        errors.push(`Contacto sin teléfono`)
        continue
      }

      // Personalizar mensaje
      let messageBody = campaign.message_body || ''
      messageBody = messageBody.replace(/\{\{nombre\}\}/gi, contact.name || '')
      messageBody = messageBody.replace(/\{\{name\}\}/gi, contact.name || '')
      messageBody = messageBody.replace(/\{\{telefono\}\}/gi, contact.phone || '')
      messageBody = messageBody.replace(/\{\{phone\}\}/gi, contact.phone || '')

      console.log('[Campaign Send] Enviando a', contact.phone, '...')
      const result = await ultramsg.sendMessage(contact.phone, messageBody)

      if (result.ok) {
        await supabase
          .from('campaign_contacts')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', cc.id)

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
        console.log('[Campaign Send] OK enviado a', contact.phone)
      } else {
        await supabase
          .from('campaign_contacts')
          .update({ status: 'failed' })
          .eq('id', cc.id)
        failedCount++
        const errMsg = result.error || 'Error desconocido'
        errors.push(`${contact.phone}: ${errMsg}`)
        console.error('[Campaign Send] Fallo UltraMsg para', contact.phone, '—', errMsg)
      }

      await new Promise(resolve => setTimeout(resolve, 1500))
    }

    // 6. Marcar campaña como completada
    await supabase
      .from('campaigns')
      .update({ status: 'completed', sent_at: new Date().toISOString() })
      .eq('id', campaignId)

    console.log('[Campaign Send] Fin — sent:', sentCount, 'failed:', failedCount, errors.length ? 'errores:' : '', errors)
    return NextResponse.json({
      success: true,
      sent: sentCount,
      failed: failedCount,
      ...(errors.length > 0 && { errors }),
    })
  } catch (err) {
    console.error('[Campaign Send] Error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
