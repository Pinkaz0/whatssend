import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/settings/get-settings
 * Retrieves workspace settings using the service role (bypasses RLS).
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate the user first using the request cookies
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Server config missing' }, { status: 500 })
    }

    // Use service role to bypass RLS
    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    
    const { data: workspace, error } = await adminClient
      .from('workspaces')
      .select('id, evolution_instance, settings')
      .eq('owner_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[get-settings] DB error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      evolutionInstance: workspace?.evolution_instance || null,
      settings: workspace?.settings || {},
      workspaceId: workspace?.id || null
    })

  } catch (err) {
    console.error('[get-settings] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
