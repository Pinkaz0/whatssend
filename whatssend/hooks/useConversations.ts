'use client'

import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
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
  const queryClient = useQueryClient()

  // Realtime subscription
  useEffect(() => {
    if (!workspaceId) return

    const supabase = createClient()
    const channel = supabase
      .channel('conversations_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          // Invalidate to refresh the list
          queryClient.invalidateQueries({ queryKey: ['conversations', workspaceId] })
        }
      )
      .on(
         'postgres_changes',
         {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `workspace_id=eq.${workspaceId}`,
         },
         () => {
            queryClient.invalidateQueries({ queryKey: ['conversations', workspaceId] })
         }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [workspaceId, queryClient])

  return useQuery<Conversation[]>({
    queryKey: ['conversations', workspaceId, searchQuery],
    queryFn: async () => {
      // ... same query logic ...
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
        // If view doesn't exist (yet), return empty to avoid crashing UI repeatedly
        if (error.code === '42P01') { // undefined_table
           console.warn('[useConversations] View not found, waiting for migration.')
           return []
        }
        console.error('[useConversations] Error:', error)
        throw error
      }

      return (data || []) as Conversation[]
    },
    enabled: !!workspaceId,
    refetchInterval: 10000, // Reduced frequency since we have realtime
    staleTime: 5000,
  })
}
