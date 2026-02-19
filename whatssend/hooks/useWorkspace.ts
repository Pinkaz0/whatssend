'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface Workspace {
  id: string
  name: string
  owner_id: string
  ultramsg_instance_id: string | null
  ultramsg_token: string | null
  bot_enabled?: boolean
  bot_system_prompt?: string | null
  google_service_email?: string | null
  google_private_key?: string | null
  created_at: string
}

/**
 * Hook compartido para obtener el workspace del usuario logueado.
 * Todos los screens deben usar este hook en vez de repetir la lógica.
 */
export function useWorkspace() {
  const query = useQuery<Workspace | null>({
    queryKey: ['workspace'],
    queryFn: async () => {
      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) return null

      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('owner_id', user.id)
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error('Error fetching workspace:', error)
        throw error
      }

      if (!data) {
        // Auto-create workspace if none exists
        console.log('No workspace found. Creating default workspace...')
        const { data: newWorkspace, error: createError } = await supabase
          .from('workspaces')
          .insert({
            name: 'Mi Workspace',
            owner_id: user.id
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating default workspace:', createError)
          throw createError
        }

        return newWorkspace as Workspace
      }
      
      return data as Workspace | null
    },
    staleTime: 60000, // 1 min
  })

  return {
    workspace: query.data ?? null,
    workspaceId: query.data?.id ?? null,
    isLoading: query.isLoading,
    error: query.error,
  }
}
