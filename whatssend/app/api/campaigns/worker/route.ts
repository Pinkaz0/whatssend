import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

/**
 * POST /api/campaigns/worker
 * Invocado por QStash para enviar un único mensaje de campaña.
 * Rate: 1 por segundo (controlado por QStash Flow Control).
 *
 * Verificación de firma: manual con @upstash/qstash Receiver,
 * importado dinámicamente para que el build no falle si las env vars no están.
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar firma QStash solo si las signing keys están definidas (producción)
    const currentKey = process.env.QSTASH_CURRENT_SIGNING_KEY
    const nextKey = process.env.QSTASH_NEXT_SIGNING_KEY

    if (currentKey && nextKey) {
      const rawBody = await request.text()
      const signature = request.headers.get('upstash-signature') ?? ''

      const { Receiver } = await import('@upstash/qstash')
      const receiver = new Receiver({ currentSigningKey: currentKey, nextSigningKey: nextKey })

      const isValid = await receiver.verify({ body: rawBody, signature }).catch(() => false)
      if (!isValid) {
        console.warn('[Worker] Firma QStash inválida')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const body = JSON.parse(rawBody) as { campaignContactId: string; campaignId: string }
      return await processContact(body.campaignContactId, body.campaignId)
    }

    // Dev fallback: sin verificación de firma
    const body = await request.json() as { campaignContactId: string; campaignId: string }
    return await processContact(body.campaignContactId, body.campaignId)

  } catch (err) {
    console.error('[Worker] Error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

async function processContact(campaignContactId: string, campaignId: string): Promise<NextResponse> {
  if (!campaignContactId || !campaignId) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    return NextResponse.json({ error: 'Server config error' }, { status: 500 })
  }

  const supabase = createSupabaseAdmin(supabaseUrl, serviceKey)

  // 1. Obtener campaign_contact con contacto y campaña
  const { data: cc, error: ccError } = await supabase
    .from('campaign_contacts')
    .select('id, contact_id, status, contacts(phone, name), campaigns(message_body, workspace_id, workspaces(evolution_instance, ultramsg_instance_id, ultramsg_token, owner_id))')
    .eq('id', campaignContactId)
    .single()

  if (ccError || !cc) {
    console.error('[Worker] campaign_contact no encontrado:', ccError)
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }

  // Idempotencia: si ya fue procesado, ignorar
  if (cc.status !== 'pending') {
    console.log(`[Worker] Skipping ${campaignContactId} — ya en estado: ${cc.status}`)
    return NextResponse.json({ skipped: true })
  }

  const contact = cc.contacts as unknown as { phone: string; name: string | null }
  const campaign = cc.campaigns as unknown as {
    message_body: string
    workspace_id: string
    workspaces: { evolution_instance: string; ultramsg_instance_id: string | null; ultramsg_token: string | null; owner_id: string } | { evolution_instance: string; ultramsg_instance_id: string | null; ultramsg_token: string | null; owner_id: string }[]
  }

  const workspace = Array.isArray(campaign.workspaces) ? campaign.workspaces[0] : campaign.workspaces

  if (!contact?.phone) {
    await supabase.from('campaign_contacts').update({ status: 'failed', error_message: 'Sin teléfono' }).eq('id', cc.id)
    return NextResponse.json({ failed: true, reason: 'no phone' })
  }

  // 2. Personalizar mensaje
  let messageBody = campaign.message_body || ''
  messageBody = messageBody.replace(/\{\{nombre\}\}/gi, contact.name || '')
  messageBody = messageBody.replace(/\{\{name\}\}/gi, contact.name || '')
  messageBody = messageBody.replace(/\{\{telefono\}\}/gi, contact.phone || '')
  messageBody = messageBody.replace(/\{\{phone\}\}/gi, contact.phone || '')

  // Normalize phone
  let cleanPhone = contact.phone.replace(/\D/g, '')
  
  // Format Chilean numbers specifically: if starts with 56 and length is 10, add a '9'
  if (cleanPhone.startsWith('56') && cleanPhone.length === 10) {
    cleanPhone = '569' + cleanPhone.slice(2)
  }

  // 3. Determinar si es usuario legacy (UltraMsg) consultando el email del owner
  let isLegacyUser = false
  if (workspace?.owner_id) {
    const { data: { user: ownerUser } } = await supabase.auth.admin.getUserById(workspace.owner_id)
    isLegacyUser = ownerUser?.email?.toLowerCase() === 'erml1903@hotmail.com'
  }

  // 4. Enviar mensaje por la pasarela correspondiente
  let result: { ok: true; data: any } | { ok: false; error: string }

  if (isLegacyUser && workspace?.ultramsg_instance_id && workspace?.ultramsg_token) {
    // Enviar por UltraMsg
    const { createUltraMsgClient } = await import('@/lib/ultramsg/client')
    const ultramsg = createUltraMsgClient(workspace.ultramsg_instance_id, workspace.ultramsg_token)
    result = await ultramsg.sendMessage(cleanPhone, messageBody)
  } else if (workspace?.evolution_instance) {
    // Enviar vía Evolution API (Default)
    const { createEvolutionClient } = await import('@/lib/whatsapp/evolution')
    const evolution = createEvolutionClient(null, null, workspace.evolution_instance)
    result = await evolution.sendMessage(cleanPhone, messageBody)
  } else {
    await supabase.from('campaign_contacts').update({ status: 'failed', error_message: 'No hay pasarela configurada' }).eq('id', cc.id)
    return NextResponse.json({ error: 'No hay pasarela de WhatsApp configurada' }, { status: 400 })
  }

  if (result.ok) {
    await supabase.from('campaign_contacts')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', cc.id)

    await supabase.from('messages').insert({
      workspace_id: campaign.workspace_id,
      contact_id: cc.contact_id,
      campaign_id: campaignId,
      direction: 'outbound',
      body: messageBody,
      status: 'sent',
      evolution_message_id: result.data?.key?.id || null,
      sent_at: new Date().toISOString(),
    })

    console.log(`[Worker] ✓ Enviado a ${contact.phone}`)
  } else {
    await supabase.from('campaign_contacts')
      .update({ status: 'failed', error_message: result.error || 'Error Evolution API' })
      .eq('id', cc.id)

    console.error(`[Worker] ✗ Fallo para ${contact.phone}:`, result.error)
  }

  // 4. Si ya no quedan pendientes → marcar campaña como completed
  const { count } = await supabase
    .from('campaign_contacts')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)
    .eq('status', 'pending')

  if (count === 0) {
    await supabase.from('campaigns').update({ status: 'completed' }).eq('id', campaignId)
    console.log(`[Worker] Campaña ${campaignId} completada`)
  }

  return NextResponse.json({ success: result.ok })
}
