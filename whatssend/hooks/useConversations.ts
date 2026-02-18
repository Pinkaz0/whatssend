'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface Conversation {
  contact_id: string
  workspace_id: string
  contact_name: string | null
  contact_phone: string
  contact_tags: string[]
  contact_status: string
  last_message_body: string | null
  last_message_direction: 'inbound' | 'outbound' | null
  last_message_at: string | null
  unread_count: number
}

/**
 * Hook para obtener la lista de conversaciones del inbox.
 * Usa polling cada 6 segundos.
 */
export function useConversations(workspaceId: string | null, searchQuery?: string) {
  return useQuery<Conversation[]>({
    queryKey: ['conversations', workspaceId, searchQuery],
    queryFn: async () => {
      if (!workspaceId) return []

      const supabase = createClient()
      let query = supabase
        .from('conversations_view')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('last_message_at', { ascending: false })

      if (searchQuery && searchQuery.trim()) {
        const search = searchQuery.trim().toLowerCase()
        query = query.or(`contact_name.ilike.%${search}%,contact_phone.ilike.%${search}%`)
      }

      const { data, error } = await query

      if (error) {
        console.error('[useConversations] Error:', error)
        throw error
      }

      return (data || []) as Conversation[]
    },
    enabled: !!workspaceId,
    refetchInterval: 6000,
    staleTime: 3000,
  })
}
