'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Message } from '@/types/message'

/**
 * Hook para obtener mensajes de un contacto específico.
 * Usa polling cada 3 segundos cuando hay un contacto seleccionado.
 */
export function useMessages(contactId: string | null, workspaceId: string | null) {
  return useQuery<Message[]>({
    queryKey: ['messages', contactId],
    queryFn: async () => {
      if (!contactId) return []

      const supabase = createClient()
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: true })
        .limit(100)

      if (error) {
        console.error('[useMessages] Error:', error)
        throw error
      }

      return (data || []) as Message[]
    },
    enabled: !!contactId,
    refetchInterval: 3000,
    staleTime: 1500,
  })
}

/**
 * Hook para enviar un mensaje.
 * Incluye optimistic update.
 */
export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      contactId,
      message,
      workspaceId,
    }: {
      contactId: string
      message: string
      workspaceId: string
    }) => {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, message, workspaceId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar mensaje')
      }

      return data
    },
    onMutate: async ({ contactId, message, workspaceId }) => {
      // Cancelar refetch en curso
      await queryClient.cancelQueries({ queryKey: ['messages', contactId] })

      // Snapshot previo
      const previousMessages = queryClient.getQueryData<Message[]>(['messages', contactId])

      // Optimistic: agregar mensaje como 'pending'
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        workspace_id: workspaceId,
        contact_id: contactId,
        campaign_id: null,
        direction: 'outbound',
        body: message,
        status: 'pending',
        ultramsg_message_id: null,
        sent_at: null,
        created_at: new Date().toISOString(),
      }

      queryClient.setQueryData<Message[]>(
        ['messages', contactId],
        (old) => [...(old || []), optimisticMessage]
      )

      return { previousMessages }
    },
    onError: (_err, { contactId }, context) => {
      // Rollback en caso de error
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', contactId], context.previousMessages)
      }
    },
    onSettled: (_data, _error, { contactId }) => {
      // Refetch para obtener datos reales del servidor
      queryClient.invalidateQueries({ queryKey: ['messages', contactId] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}
