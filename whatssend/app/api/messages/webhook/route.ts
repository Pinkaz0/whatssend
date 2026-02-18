import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractPhoneFromUltraMsg } from '@/lib/utils/phone'

/**
 * POST /api/messages/webhook
 * Recibe mensajes entrantes desde UltraMsg.
 * Debe responder 200 OK rápidamente.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verificar webhook secret
    const webhookSecret = process.env.ULTRAMSG_WEBHOOK_SECRET
    const url = new URL(request.url)
    const tokenParam = url.searchParams.get('token')

    if (webhookSecret && tokenParam !== webhookSecret) {
      console.warn('[Webhook] Invalid secret token')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parsear payload
    const body = await request.json()
    console.log('[Webhook] Payload received:', JSON.stringify(body).slice(0, 500))

    const { data } = body

    // UltraMsg envía el payload en data
    if (!data) {
      return NextResponse.json({ status: 'ok', message: 'No data' })
    }

    const messageType = data.type || data.typeMessage
    const from = data.from
    const messageBody = data.body
    const ultramsgMessageId = data.id

    // 3. Solo procesar mensajes de texto (type === 'chat')
    if (messageType !== 'chat') {
      console.log('[Webhook] Ignoring non-chat message type:', messageType)
      return NextResponse.json({ status: 'ok', message: 'Ignored non-chat' })
    }

    if (!from || !messageBody) {
      console.warn('[Webhook] Missing from or body')
      return NextResponse.json({ status: 'ok', message: 'Missing fields' })
    }

    // 4. Crear Supabase admin client (con service_role para bypass RLS)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseServiceKey) {
      console.error('[Webhook] Missing SUPABASE_SERVICE_ROLE_KEY')
      return NextResponse.json({ error: 'Server config error' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 5. Idempotencia: verificar si este mensaje ya fue procesado
    if (ultramsgMessageId) {
      const { data: existingMsg } = await supabase
        .from('messages')
        .select('id')
        .eq('ultramsg_message_id', ultramsgMessageId)
        .maybeSingle()

      if (existingMsg) {
        console.log('[Webhook] Duplicate message, skipping:', ultramsgMessageId)
        return NextResponse.json({ status: 'ok', message: 'Duplicate' })
      }
    }

    // 6. Normalizar teléfono desde formato UltraMsg
    const phone = extractPhoneFromUltraMsg(from)

    // 7. Encontrar workspace por instance_id (o usar env fallback)
    const instanceId = process.env.ULTRAMSG_INSTANCE_ID
    let workspaceId: string | null = null

    if (instanceId) {
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .eq('ultramsg_instance_id', instanceId)
        .maybeSingle()

      workspaceId = workspace?.id || null
    }

    // Si no hay workspace por instance_id, buscar el primero disponible
    if (!workspaceId) {
      const { data: anyWorkspace } = await supabase
        .from('workspaces')
        .select('id')
        .limit(1)
        .maybeSingle()

      workspaceId = anyWorkspace?.id || null
    }

    if (!workspaceId) {
      console.error('[Webhook] No workspace found')
      return NextResponse.json({ error: 'No workspace configured' }, { status: 500 })
    }

    // 8. Auto-crear contacto si no existe (upsert por phone + workspace)
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .upsert(
        {
          workspace_id: workspaceId,
          phone,
          source: 'manual' as const,
        },
        { onConflict: 'workspace_id,phone' }
      )
      .select('id')
      .single()

    if (contactError || !contact) {
      console.error('[Webhook] Contact upsert error:', contactError)
      return NextResponse.json({ error: 'Contact creation failed' }, { status: 500 })
    }

    // 9. Insertar mensaje inbound
    const { error: msgError } = await supabase.from('messages').insert({
      workspace_id: workspaceId,
      contact_id: contact.id,
      direction: 'inbound',
      body: messageBody,
      status: 'delivered',
      ultramsg_message_id: ultramsgMessageId || null,
      sent_at: new Date().toISOString(),
    })

    if (msgError) {
      console.error('[Webhook] Message insert error:', msgError)
      return NextResponse.json({ error: 'Message save failed' }, { status: 500 })
    }

    console.log('[Webhook] Inbound message saved:', {
      contactId: contact.id,
      phone,
      bodyPreview: messageBody.slice(0, 50),
    })

    // 10. Bot auto-reply: buscar reglas activas que coincidan
    try {
      const { data: botRules } = await supabase
        .from('bot_rules')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('is_active', true)
        .order('priority', { ascending: true })

      if (botRules && botRules.length > 0) {
        const msgLower = messageBody.toLowerCase().trim()

        const matchedRule = botRules.find((rule: { match_type: string; trigger_keyword: string }) => {
          const keyword = rule.trigger_keyword.toLowerCase()
          switch (rule.match_type) {
            case 'exact': return msgLower === keyword
            case 'contains': return msgLower.includes(keyword)
            case 'starts_with': return msgLower.startsWith(keyword)
            default: return false
          }
        })

        if (matchedRule) {
          console.log('[Webhook] Bot rule matched:', matchedRule.trigger_keyword)

          // Obtener credenciales UltraMsg del workspace
          const { data: ws } = await supabase
            .from('workspaces')
            .select('ultramsg_instance_id, ultramsg_token')
            .eq('id', workspaceId)
            .single()

          if (ws?.ultramsg_instance_id && ws?.ultramsg_token) {
            const { createUltraMsgClient } = await import('@/lib/ultramsg/client')
            const ultramsg = createUltraMsgClient(ws.ultramsg_instance_id, ws.ultramsg_token)
            const sendResult = await ultramsg.sendMessage(phone, matchedRule.response_body)

            // Guardar respuesta del bot en messages
            await supabase.from('messages').insert({
              workspace_id: workspaceId,
              contact_id: contact.id,
              direction: 'outbound',
              body: matchedRule.response_body,
              status: sendResult.ok ? 'sent' : 'failed',
              ultramsg_message_id: sendResult.ok ? sendResult.data.id || null : null,
              sent_at: new Date().toISOString(),
            })

            console.log('[Webhook] Bot reply sent:', sendResult.ok)
          }
        }
      }
    } catch (botErr) {
      // Bot errors should not break the webhook
      console.error('[Webhook] Bot auto-reply error:', botErr)
    }

    // 11. Responder 200 OK inmediatamente
    return NextResponse.json({ status: 'ok' })
  } catch (err) {
    console.error('[Webhook] Unhandled error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** GET para verificación de webhook (algunos servicios hacen GET de health) */
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'WhatsSend Webhook' })
}
