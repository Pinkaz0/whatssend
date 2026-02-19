import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractPhoneFromUltraMsg } from '@/lib/utils/phone'

/**
 * POST /api/messages/webhook
 * Recibe mensajes entrantes desde UltraMsg.
 * Debe responder 200 OK rápidamente.
 */
export async function POST(request: NextRequest) {
  const url = new URL(request.url)
  console.log('[Webhook] 1. Request received', { path: url.pathname, search: url.search })

  try {
    // 1. Verificar webhook secret (si está definido)
    const webhookSecret = process.env.ULTRAMSG_WEBHOOK_SECRET
    const tokenParam = url.searchParams.get('token')
    if (webhookSecret && tokenParam !== webhookSecret) {
      console.warn('[Webhook] 2. FAIL: Invalid or missing token. Para pruebas locales deja ULTRAMSG_WEBHOOK_SECRET vacío o añade ?token=TU_SECRET a la URL en UltraMsg.')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('[Webhook] 2. Token OK (secret set:', !!webhookSecret, ')')

    // 2. Parsear payload (UltraMsg puede enviar { data: { ... } } o { from, body, type } en raíz)
    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch (e) {
      console.warn('[Webhook] 3. FAIL: Body no es JSON válido', e)
      return NextResponse.json({ status: 'ok', message: 'Invalid JSON' })
    }
    console.log('[Webhook] 3. Body parsed. Top-level keys:', Object.keys(body))

    const data = (body.data != null ? body.data : body) as Record<string, unknown>
    const messageType = (data.type as string) ?? (data.typeMessage as string) ?? ''
    const from = (data.from as string) ?? (data.chatId as string) ?? ''
    const messageBody = (data.body as string) ?? (data.text as string) ?? (data.message as string) ?? ''
    const ultramsgMessageId = (data.id as string) ?? (data.msgId as string) ?? null

    console.log('[Webhook] 4. Payload extraído:', {
      type: messageType,
      from,
      id: ultramsgMessageId,
      bodyLen: typeof messageBody === 'string' ? messageBody.length : 0,
      dataKeys: Object.keys(data)
    })

    // 3. Procesar mensajes de texto (type 'chat', 'message' o cualquiera si hay from + body)
    const isText = messageType === 'chat' || messageType === 'message' || messageType === 'text' || (!messageType && from && messageBody)
    if (!isText) {
      console.log('[Webhook] 5. SKIP: Ignored non-text type:', messageType)
      return NextResponse.json({ status: 'ok', message: 'Ignored non-text' })
    }
    if (!from || !messageBody || typeof messageBody !== 'string') {
      console.warn('[Webhook] 5. SKIP: Missing from or body. dataKeys:', Object.keys(data))
      return NextResponse.json({ status: 'ok', message: 'Missing fields' })
    }
    console.log('[Webhook] 5. Mensaje de texto aceptado')

    // 4. Crear Supabase admin client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseServiceKey) {
      console.error('[Webhook] 6. FAIL: Missing SUPABASE_SERVICE_ROLE_KEY')
      return NextResponse.json({ error: 'Server config error' }, { status: 500 })
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    console.log('[Webhook] 6. Supabase client OK')

    // 5. Normalizar teléfono
    const phone = extractPhoneFromUltraMsg(from)
    console.log('[Webhook] 7. Phone normalizado:', phone, '(from:', from, ')')

    // 6. Encontrar workspace
    // Prioridad: workspace_id en query (URL única por usuario) -> instance_id del payload -> env -> fallback
    const payloadInstanceId = data.instanceId
    const envInstanceId = process.env.ULTRAMSG_INSTANCE_ID
    const queryWorkspaceId = url.searchParams.get('workspace_id')

    let workspaceId: string | null = null

    if (queryWorkspaceId) {
      const { data: workspaceByQuery } = await supabase
        .from('workspaces')
        .select('id, ultramsg_instance_id')
        .eq('id', queryWorkspaceId)
        .maybeSingle()
      if (workspaceByQuery) {
        const targetInstanceId = payloadInstanceId || envInstanceId
        if (targetInstanceId && workspaceByQuery.ultramsg_instance_id && workspaceByQuery.ultramsg_instance_id !== targetInstanceId) {
          console.warn('[Webhook] 8. FAIL: workspace_id en URL no coincide con instance del payload')
          return NextResponse.json({ error: 'Workspace mismatch' }, { status: 403 })
        }
        workspaceId = workspaceByQuery.id
        console.log('[Webhook] 8. Workspace por query workspace_id:', workspaceId)
      }
    }

    if (!workspaceId && (payloadInstanceId || envInstanceId)) {
      const targetInstanceId = payloadInstanceId || envInstanceId
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .eq('ultramsg_instance_id', targetInstanceId)
        .maybeSingle()
      workspaceId = workspace?.id || null
      if (workspaceId) console.log('[Webhook] 8. Workspace por instanceId:', workspaceId, '(instance:', targetInstanceId, ')')
    }

    if (!workspaceId) {
      const { data: anyWorkspace } = await supabase
        .from('workspaces')
        .select('id')
        .not('ultramsg_instance_id', 'is', null)
        .limit(1)
        .maybeSingle()
      workspaceId = anyWorkspace?.id || null
      if (workspaceId) console.log('[Webhook] 8. Workspace fallback (con UltraMsg):', workspaceId)
    }
    if (!workspaceId) {
      const { data: fallback } = await supabase
        .from('workspaces')
        .select('id')
        .limit(1)
        .maybeSingle()
      workspaceId = fallback?.id || null
      if (workspaceId) console.log('[Webhook] 8. Workspace fallback (cualquiera):', workspaceId)
    }

    if (!workspaceId) {
      console.error('[Webhook] 8. FAIL: No workspace found. payloadInstanceId:', payloadInstanceId, 'envInstanceId:', envInstanceId ? '(set)' : '(no set)')
      return NextResponse.json({ error: 'No workspace configured' }, { status: 500 })
    }

    // 7. Auto-crear contacto (Idempotente via ON CONFLICT)
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .upsert(
        {
          workspace_id: workspaceId,
          phone,
          source: 'inbound',
          last_active_at: new Date().toISOString()
        },
        { onConflict: 'workspace_id,phone' }
      )
      .select('id')
      .single()

    if (contactError || !contact) {
      console.error('[Webhook] 9. FAIL: Contact upsert error:', contactError)
      return NextResponse.json({ error: 'Contact error' }, { status: 500 })
    }
    console.log('[Webhook] 9. Contact OK:', contact.id)

    // 8. Insertar mensaje inbound (Manejo de duplicados con catch)
    try {
      const { error: msgError } = await supabase.from('messages').insert({
        workspace_id: workspaceId,
        contact_id: contact.id,
        direction: 'inbound',
        body: messageBody,
        status: 'delivered',
        ultramsg_message_id: ultramsgMessageId || null, // Constraint UNIQUE lo atrapará si es duplicado
        sent_at: new Date().toISOString(),
      })

      if (msgError) {
        if (msgError.code === '23505') {
          console.log('[Webhook] 10. Duplicate message skipped:', ultramsgMessageId)
          return NextResponse.json({ status: 'ok', message: 'Duplicate skipped' })
        }
        console.error('[Webhook] 10. FAIL: Message insert error:', msgError.code, msgError.message)
        throw msgError
      }

      console.log('[Webhook] 10. Inbound saved OK. contact_id:', contact.id, 'ultramsg_id:', ultramsgMessageId)

    } catch (err: any) {
      console.error('[Webhook] 10. FAIL: Message insert exception:', err?.message ?? err)
      return NextResponse.json({ error: 'Message save failed' }, { status: 500 })
    }

    // 9. Bot Auto-reply (Simplificado para no bloquear)
    // ... (lógica de bot existente o mover a background job) ...
    // Por ahora mantenemos la lógica existente pero en try/catch silencioso
    void handleBotReply(supabase, workspaceId, contact, phone, messageBody)

    console.log('[Webhook] 11. OK — respondiendo 200')
    return NextResponse.json({ status: 'ok' })

  } catch (err) {
    console.error('[Webhook] FATAL:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper para Bot logic (extraído para limpieza)
// Helper para Bot logic
async function handleBotReply(
  supabase: any,
  workspaceId: string,
  contact: any, // Typed as any for now to avoid conflicts, but structurally matches Contact
  phone: string,
  messageBody: string
) {
  try {
    // 1. Obtener configuración del workspace/bot
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('bot_enabled, bot_system_prompt, bot_custom_instructions, ultramsg_instance_id, ultramsg_token')
      .eq('id', workspaceId)
      .single()

    if (!workspace?.bot_enabled) {
      // Fallback a reglas simples si el bot IA está apagado (opcional, o simplemente retornar)
      // return handleSimpleRules(...) // Podríamos mantener la lógica anterior aquí
      return
    }

    if (!workspace.ultramsg_instance_id || !workspace.ultramsg_token) return

    // 2. Obtener historial reciente (últimos 10 mensajes)
    const { data: history } = await supabase
      .from('messages')
      .select('direction, body')
      .eq('contact_id', contact.id)
      .order('sent_at', { ascending: false })
      .limit(10)

    // Formatear historial para OpenAI
    // Reverse para orden cronológico
    const formattedHistory = (history || [])
      .reverse()
      .map((m: any) => ({
        role: m.direction === 'inbound' ? 'user' : 'assistant',
        content: m.body || ''
      }))

    // 3. Procesar con AI (Dynamic Import to avoid circular deps if any)
    const { processBotMessage } = await import('@/lib/ai/sales-bot')
    
    // Simular Contact type
    const contactData = {
      ...contact,
      rut: contact.rut || null,
      address: contact.address || null,
      comuna: contact.comuna || null,
      email: contact.email || null,
      alt_phone: contact.alt_phone || null
    }

    const botResponse = await processBotMessage(
      workspaceId,
      contactData,
      formattedHistory,
      workspace.bot_custom_instructions,
      workspace.bot_system_prompt || undefined
    )

    if (!botResponse) return

    // 4. Enviar Respuesta
    const { createUltraMsgClient } = await import('@/lib/ultramsg/client')
    const ultramsg = createUltraMsgClient(workspace.ultramsg_instance_id, workspace.ultramsg_token)
    
    // Log para depuración
    console.log('[Bot] Response:', botResponse.message)
    console.log('[Bot] Intent:', botResponse.intent)
    
    const sendResult = await ultramsg.sendMessage(phone, botResponse.message)

    // 5. Guardar Respuesta en DB
    await supabase.from('messages').insert({
      workspace_id: workspaceId,
      contact_id: contact.id,
      direction: 'outbound',
      body: botResponse.message,
      status: sendResult.ok ? 'sent' : 'failed',
      ultramsg_message_id: sendResult.ok ? sendResult.data.id || null : null,
      sent_at: new Date().toISOString(),
    })

    // 6. Actualizar Contacto con datos extraídos (si los hay)
    if (botResponse.extracted) {
      const updates: any = {}
      if (botResponse.extracted.rut) updates.rut = botResponse.extracted.rut
      if (botResponse.extracted.address) updates.address = botResponse.extracted.address
      if (botResponse.extracted.comuna) updates.comuna = botResponse.extracted.comuna
      if (botResponse.extracted.email) updates.email = botResponse.extracted.email
      if (botResponse.extracted.alt_phone) updates.alt_phone = botResponse.extracted.alt_phone
      
      if (Object.keys(updates).length > 0) {
        console.log('[Bot] Updating contact info:', updates)
        await supabase.from('contacts').update(updates).eq('id', contact.id)
      }
    }

    // 7. Manejo de Pipeline (Básico por ahora)
    // Si detecta 'interested' o 'ready_to_buy', crear o actualizar lead en pipeline
    if (['interested', 'ready_to_buy'].includes(botResponse.intent)) {
      // Verificar si ya existe lead
      const { data: existingLead } = await supabase
        .from('pipeline_leads')
        .select('id')
        .eq('contact_id', contact.id)
        .maybeSingle()
      
      if (!existingLead) {
        await supabase.from('pipeline_leads').insert({
          workspace_id: workspaceId,
          contact_id: contact.id,
          status: 'interested',
          rut: botResponse.extracted.rut || contact.rut,
          full_name: contact.name,
          address: botResponse.extracted.address || contact.address,
          comuna: botResponse.extracted.comuna || contact.comuna,
          email: botResponse.extracted.email || contact.email,
        })
        console.log('[Bot] New lead created in pipeline')
      }
    }

  } catch (err) {
    console.warn('[Webhook] Bot logic error:', err)
  }
}

/** GET para verificación de webhook (algunos servicios hacen GET de health) */
export async function GET() {
  console.log('[Webhook] GET — health check (si ves esto, la URL/ngrok llega al servidor)')
  return NextResponse.json({ status: 'ok', service: 'WhatsSend Webhook' })
}
