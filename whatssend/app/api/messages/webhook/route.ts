import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
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

    // 2. Parsear payload de Evolution API
    let body: any
    try {
      body = await request.json()
    } catch (e) {
      console.warn('[Webhook] 3. FAIL: Body no es JSON válido', e)
      return NextResponse.json({ status: 'ok', message: 'Invalid JSON' })
    }
    console.log('[Webhook] 3. Body parsed. Event:', body?.event)

    // Filtramos solo el evento de nuevos mensajes o envío (Evolution API usa messages.upsert / send.message, UltraMsg usa message_received / message_create)
    const allowedEvents = ['messages.upsert', 'messages.update', 'send.message', 'message_received', 'message_create']
    const event = body?.event as string
    
    // Si no tiene event pero tiene data, intentamos procesar, de lo contrario salimos temprano
    // UltraMsg tira el event en body.event_type a veces
    const eventType = event || body?.event_type
    
    if (eventType && !allowedEvents.includes(eventType.toLowerCase())) {
        console.log('[Webhook] 5. SKIP: Ignored non-message event:', eventType)
        return NextResponse.json({ status: 'ok', message: 'Ignored non-message event' })
    }

    const data = body.data || body

    // Extraer variables dependiento del formato exacto
    // Soporte Evolution API:
    let remoteJid = data?.key?.remoteJid || data?.remoteJid || ''
    let fromMe = data?.key?.fromMe || false
    let evolutionMessageId = data?.key?.id || data?.id || null
    
    // Soporte UltraMsg:
    if (data?.from && data?.to && !remoteJid) {
      fromMe = data.from.includes(data.to) ? true : (eventType === 'message_create' || data?.fromMe === true);
      remoteJid = fromMe ? data.to : data.from;
      evolutionMessageId = data.id || null;
    }

    // Obtener el texto
    let messageText = ''
    if (data?.message?.conversation) { // Evolution API texto
        messageText = data.message.conversation
    } else if (data?.message?.extendedTextMessage?.text) { // Evolution API respuesta
        messageText = data.message.extendedTextMessage.text
    } else if (data?.text) { // Text simple Evolution
        messageText = data.text 
    } else if (data?.body) { // UltraMsg texto
        messageText = data.body
    }

    console.log('[Webhook] 4. Payload extraído:', {
      remoteJid,
      fromMe,
      id: evolutionMessageId,
      bodyLen: messageText.length
    })

    if (!remoteJid || !messageText) {
      console.warn('[Webhook] 5. SKIP: Missing remoteJid or message text.')
      return NextResponse.json({ status: 'ok', message: 'Missing fields or not text message' })
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

    // 5. Normalizar teléfono (quitar @s.whatsapp.net y dejar solo numeros)
    let phone = remoteJid.split('@')[0]
    phone = phone.replace(/\D/g, '')
    // Si queremos el + adelante lo agregamos o usamos utils si está disponible
    phone = phone.startsWith('+') ? phone : `+${phone}`
    
    console.log('[Webhook] 7. Phone normalizado:', phone, '(from:', remoteJid, ')')

    // 6. Encontrar workspace
    // Prioridad: workspace_id en query -> instance del payload
    const payloadInstanceName = body?.instance
    const queryWorkspaceId = url.searchParams.get('workspace_id')

    let workspaceId: string | null = null

    if (queryWorkspaceId) {
      const { data: workspaceByQuery } = await supabase
        .from('workspaces')
        .select('id, evolution_instance')
        .eq('id', queryWorkspaceId)
        .maybeSingle()
      if (workspaceByQuery) {
        if (payloadInstanceName && workspaceByQuery.evolution_instance && workspaceByQuery.evolution_instance !== payloadInstanceName) {
          console.warn('[Webhook] 8. FAIL: workspace_id en URL no coincide con instance del payload')
          return NextResponse.json({ error: 'Workspace mismatch' }, { status: 403 })
        }
        workspaceId = workspaceByQuery.id
        console.log('[Webhook] 8. Workspace por query workspace_id:', workspaceId)
      }
    }

    if (!workspaceId && payloadInstanceName) {
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .eq('evolution_instance', payloadInstanceName)
        .maybeSingle()
      workspaceId = workspace?.id || null
      if (workspaceId) console.log('[Webhook] 8. Workspace por instanceName:', workspaceId, '(instance:', payloadInstanceName, ')')
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
      console.error('[Webhook] 8. FAIL: No workspace found. payloadInstance:', payloadInstanceName)
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
        direction: fromMe ? 'outbound' : 'inbound',
        body: messageText,
        status: fromMe ? 'sent' : 'delivered',
        evolution_message_id: evolutionMessageId || null,
        sent_at: new Date().toISOString(),
      })

      if (msgError) {
        if (msgError.code === '23505') {
          console.log('[Webhook] 10. Duplicate message skipped:', evolutionMessageId)
          return NextResponse.json({ status: 'ok', message: 'Duplicate skipped' })
        }
        console.error('[Webhook] 10. FAIL: Message insert error:', msgError.code, msgError.message)
        throw msgError
      }

      console.log('[Webhook] 10. Message saved OK. contact_id:', contact.id, 'evolution_id:', evolutionMessageId)

    } catch (err: any) {
      console.error('[Webhook] 10. FAIL: Message insert exception:', err?.message ?? err)
      return NextResponse.json({ error: 'Message save failed' }, { status: 500 })
    }

    // 9. Bot Auto-reply (Procesado en background garantizado por after() de Next.js)
    after(async () => {
      await handleBotReply(supabase, workspaceId, contact, phone, messageText, fromMe)
    })

    console.log('[Webhook] 11. OK — respondiendo 200')
    return NextResponse.json({ status: 'ok' })

  } catch (err) {
    console.error('[Webhook] FATAL:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper para Bot logic
async function handleBotReply(
  supabase: any,
  workspaceId: string,
  contact: any,
  phone: string,
  messageBody: string,
  fromMe: boolean
) {
  try {
    // 0. Detectar Vendedor (Modo Asistente / Copiloto)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, phone')
      .eq('phone', phone)
      .single()

    const isCopilotDirectCommand = fromMe && profile?.phone && phone.includes(profile.phone)

    if (profile || isCopilotDirectCommand) {
      console.log(`[Webhook] Mensaje de un Vendor detectado (${profile?.full_name || phone}). Activando Copiloto Camila...`)
      const { processVendorAssistantMessage } = await import('@/lib/ai/vendor-assistant')
      await processVendorAssistantMessage(supabase, workspaceId, contact, messageBody, profile)
      return
    }

    // Si fue mandado por nosotros (y no fue el comando directo anterior), no respondemos con el Bot a un cliente.
    if (fromMe) return;

    // 0. Interceptar RESPUESTAS DEL BACKOFFICE (Evita que Camila le venda a Andrea)
    const { INITIAL_BA_PERSONAS } = await import('@/lib/config/backoffice')
    
    // Convertir el phone de BD backoffice (ej: "+56 9 5176 9267") a números puros
    const isBackoffice = INITIAL_BA_PERSONAS.some(p => {
      const limpio = p.contacto.replace(/\D/g, '')
      return phone.includes(limpio) || limpio.includes(phone)
    })

    if (isBackoffice) {
      console.log('[Webhook] Mensaje proviene de un número BackOffice (Andrea/BP). Interceptando...')
      
      // Buscar al cliente más reciente que esté esperando respuesta de Prechequeo
      const { data: waitingSession } = await supabase
        .from('agent_sessions')
        .select('id, contact_id')
        .eq('workspace_id', workspaceId)
        .in('estado', ['PRECHEQUE_PENDIENTE', 'PRECHEQUEO_PENDIENTE'])
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (waitingSession) {
        console.log(`[Webhook] Inyectando respuesta de BackOffice a la sesión del cliente: ${waitingSession.id}`)
        
        // Simular que el mensaje interno lo dijo el System (la respuesta de Andrea)
        await supabase.from('agent_messages').insert({
          session_id: waitingSession.id,
          role: 'system',
          content: `[RESPUESTA DEL BACKOFFICE / ANDREA]:\n"${messageBody}"\n\nInstrucción para Camila: Evalúa el Escenario (A: RUT malo, B: Dir mala, C: Todo OK). Si es C, procede a ofrecer. Si es A o B, explica sin tecnicismos.`
        })

        // Avanzar el cliente a EVALUACION_RESULTADO para que Camila decida qué hacer
        await supabase
          .from('agent_sessions')
          .update({ estado: 'EVALUACION_RESULTADO' })
          .eq('id', waitingSession.id)
          
        // DESPERTAR A CAMILA PARA QUE LE CONTESTE AL CLIENTE
        // 1. Obtener el teléfono del cliente
        const { data: customerContact } = await supabase
          .from('contacts')
          .select('phone')
          .eq('id', waitingSession.contact_id)
          .single()
          
        if (customerContact) {
          console.log(`[Webhook] Despertando a Camila para que le conteste al cliente: ${customerContact.phone}`)
          
          // Obtener config para Camila
          const { data: workspace } = await supabase
            .from('workspaces')
            .select('bot_enabled, bot_system_prompt, bot_custom_instructions, evolution_instance')
            .eq('id', workspaceId)
            .single()

          if (workspace?.bot_enabled && workspace.evolution_instance) {
            const { processAgentMessage } = await import('@/lib/ai/sales-agent')
            const agentResponse = await processAgentMessage(
              supabase,
              workspaceId,
              customerContact.phone,
              `[SISTEMA INTERNO]: Acabo de recibir la confirmación de Andrea del backoffice. Procesa el resultado en estado EVALUACION_RESULTADO.`,
              workspace
            )

            if (agentResponse) {
              const { createEvolutionClient } = await import('@/lib/whatsapp/evolution')
              const evolution = createEvolutionClient(null, null, workspace.evolution_instance)
              await evolution.sendMessage(customerContact.phone, agentResponse)
            }
          }
        }
      } else {
        console.log('[Webhook] Backoffice respondió pero no hay clientes en PRECHEQUE_PENDIENTE.')
      }
      
      return; // Cortar el flujo. No queremos que Camila se presente a Andrea.
    }

    // 1. Obtener configuración del workspace/bot
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('bot_enabled, bot_system_prompt, bot_custom_instructions, evolution_instance')
      .eq('id', workspaceId)
      .single()

    if (!workspace?.bot_enabled) {
      return
    }

    if (!workspace?.bot_enabled || !workspace.evolution_instance) return

    // 2. Procesar con Camila (Super Agente)
    const { processAgentMessage } = await import('@/lib/ai/sales-agent')
    
    console.log('[Webhook] Activando Camila para', phone)
    const agentResponse = await processAgentMessage(
      supabase,
      workspaceId,
      phone, // Usamos phone como remoteJid para consistencia
      messageBody,
      workspace
    )

    if (!agentResponse) return

    // 3. Enviar Respuesta de Camila vía Evolution API
    const { createEvolutionClient } = await import('@/lib/whatsapp/evolution')
    const evolution = createEvolutionClient(null, null, workspace.evolution_instance)
    
    console.log('[Camila] Response:', agentResponse)
    const sendResult = await evolution.sendMessage(phone, agentResponse)
    
    // 4. Guardar Respuesta en DB (Historial General del CRM)
    await supabase.from('messages').insert({
      workspace_id: workspaceId,
      contact_id: contact.id,
      direction: 'outbound',
      body: agentResponse,
      status: sendResult.ok ? 'sent' : 'failed',
      evolution_message_id: sendResult.ok ? sendResult.data?.key?.id || null : null,
      sent_at: new Date().toISOString(),
    })

    // 5. Opcional: Notificar al vendedor si hubo un evento importante (ej. Venta Cerrada)
    // Extraeremos de events o states más adelante.
  } catch (err) {
    console.warn('[Webhook] Agent logic error:', err)
  }
}

/** GET para verificación de webhook (algunos servicios hacen GET de health) */
export async function GET() {
  console.log('[Webhook] GET — health check (si ves esto, la URL/ngrok llega al servidor)')
  return NextResponse.json({ status: 'ok', service: 'WhatsSend Webhook' })
}
