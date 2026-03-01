import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/settings/save-instance
 * Uses service role to bypass RLS and save the evolution_instance name reliably.
 */
export async function POST(request: NextRequest) {
  try {
    const { instanceName, userId } = await request.json()

    if (!instanceName || !userId) {
      return NextResponse.json({ error: 'instanceName and userId are required' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Server config missing' }, { status: 500 })
    }

    // Service role bypasses RLS entirely
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    // Find the workspace by owner_id
    const { data: workspace, error: findError } = await adminClient
      .from('workspaces')
      .select('id')
      .eq('owner_id', userId)
      .single()

    if (findError || !workspace) {
      console.error('[save-instance] workspace not found:', findError)
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Update using admin client (bypasses RLS)
    const { error: updateError } = await adminClient
      .from('workspaces')
      .update({ evolution_instance: instanceName })
      .eq('id', workspace.id)

    if (updateError) {
      console.error('[save-instance] update error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, workspaceId: workspace.id })

  } catch (err) {
    console.error('[save-instance] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
