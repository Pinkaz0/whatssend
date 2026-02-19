import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createUltraMsgClient } from '@/lib/ultramsg/client'

/**
 * POST /api/messages/send
 * Envía un mensaje manual desde el inbox.
 * Requiere autenticación del usuario.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticación
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // 2. Parsear body
    const body = await request.json()
    const { contactId, message, workspaceId } = body as {
      contactId: string
      message: string
      workspaceId: string
    }

    if (!contactId || !message || !workspaceId) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: contactId, message, workspaceId' },
        { status: 400 }
      )
    }

    // 3. Verificar que el usuario es dueño del workspace
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('id, ultramsg_instance_id, ultramsg_token')
      .eq('id', workspaceId)
      .eq('owner_id', user.id)
      .single()

    if (wsError || !workspace) {
      return NextResponse.json(
        { error: 'Workspace no encontrado o sin permisos' },
        { status: 403 }
      )
    }

    // 4. Obtener teléfono del contacto
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, phone, name')
      .eq('id', contactId)
      .eq('workspace_id', workspaceId)
      .single()

    if (contactError || !contact) {
      return NextResponse.json(
        { error: 'Contacto no encontrado' },
        { status: 404 }
      )
    }

    // 5. Insertar mensaje como 'pending' en la BD
    const { data: msg, error: insertError } = await supabase
      .from('messages')
      .insert({
        workspace_id: workspaceId,
        contact_id: contactId,
        direction: 'outbound' as const,
        body: message,
        status: 'pending' as const,
      })
      .select('id')
      .single()

    if (insertError || !msg) {
      console.error('[Send] Message insert error:', insertError)
      return NextResponse.json(
        { error: 'Error al guardar mensaje' },
        { status: 500 }
      )
    }

    // 6. Enviar vía UltraMsg
    try {
      const ultramsg = createUltraMsgClient(
        workspace.ultramsg_instance_id,
        workspace.ultramsg_token
      )

      // Normalize phone before sending (remove +, spaces, etc if needed by UltraMsg)
      // Assuming contact.phone is already in E.164, but stripping '+' is safer for some APIs
      const cleanPhone = contact.phone.replace(/\D/g, '')

      const result = await ultramsg.sendMessage(cleanPhone, message)

      if (result.ok) {
        // 7. Actualizar estado a 'sent' con ID de UltraMsg
        await supabase
          .from('messages')
          .update({
            status: 'sent',
            ultramsg_message_id: result.data.id || null,
            sent_at: new Date().toISOString(),
          })
          .eq('id', msg.id)

        return NextResponse.json({
          success: true,
          messageId: msg.id,
          ultramsgId: result.data.id,
        })
      } else {
        // 8. Marcar como 'failed'
        await supabase
          .from('messages')
          .update({ status: 'failed' })
          .eq('id', msg.id)

        console.error('[Send] UltraMsg send failed:', result.error)
        return NextResponse.json(
          {
            success: false,
            messageId: msg.id,
            error: result.error,
          },
          { status: 502 }
        )
      }
    } catch (sendErr) {
      // Marcar como failed si hay error de red
      await supabase
        .from('messages')
        .update({ status: 'failed' })
        .eq('id', msg.id)

      const errMsg = sendErr instanceof Error ? sendErr.message : 'Error desconocido'
      console.error('[Send] Exception:', errMsg)
      return NextResponse.json(
        { success: false, messageId: msg.id, error: errMsg },
        { status: 502 }
      )
    }
  } catch (err: any) {
    console.error('[Send] Unhandled error:', err)
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: err?.message || String(err)
      },
      { status: 500 }
    )
  }
}
