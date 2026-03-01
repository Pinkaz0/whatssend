import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

/**
 * DELETE /api/workspace/clear-inbox
 * Elimina todos los mensajes y conversaciones del workspace del usuario autenticado.
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) {
      return NextResponse.json({ error: 'Server config error' }, { status: 500 })
    }

    const admin = createServiceClient(supabaseUrl, serviceKey)

    // Obtener workspace del usuario
    const { data: workspace } = await admin
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace no encontrado' }, { status: 404 })
    }

    const workspaceId = workspace.id

    // Solo borrar mensajes (la bandeja) — NO tocar contactos ni campañas
    const { error: delError } = await admin
      .from('messages')
      .delete()
      .eq('workspace_id', workspaceId)

    if (delError) throw delError

    console.log(`[Clear Inbox] Mensajes eliminados para workspace ${workspaceId}`)

    return NextResponse.json({ success: true, message: 'Bandeja limpiada correctamente' })


  } catch (err) {
    console.error('[Clear Inbox] Error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
