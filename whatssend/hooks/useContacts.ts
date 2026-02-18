'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Contact, ContactInsert } from '@/types/contact'

/**
 * Hook para obtener la lista de contactos del workspace.
 */
export function useContacts(
  workspaceId: string | null,
  options?: { search?: string; status?: string; tag?: string }
) {
  return useQuery<Contact[]>({
    queryKey: ['contacts', workspaceId, options],
    queryFn: async () => {
      if (!workspaceId) return []

      const supabase = createClient()
      let query = supabase
        .from('contacts')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })

      if (options?.search) {
        const s = options.search.trim()
        query = query.or(`name.ilike.%${s}%,phone.ilike.%${s}%,email.ilike.%${s}%,company.ilike.%${s}%`)
      }

      if (options?.status) {
        query = query.eq('status', options.status)
      }

      if (options?.tag) {
        query = query.contains('tags', [options.tag])
      }

      const { data, error } = await query.limit(500)

      if (error) throw error
      return (data || []) as Contact[]
    },
    enabled: !!workspaceId,
  })
}

/**
 * Hook para obtener un contacto específico.
 */
export function useContact(contactId: string | null) {
  return useQuery<Contact | null>({
    queryKey: ['contact', contactId],
    queryFn: async () => {
      if (!contactId) return null

      const supabase = createClient()
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .single()

      if (error) throw error
      return data as Contact
    },
    enabled: !!contactId,
  })
}

/**
 * Hook para crear/importar contactos en lote.
 */
export function useImportContacts() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (contacts: ContactInsert[]) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('contacts')
        .upsert(contacts, { onConflict: 'workspace_id,phone' })
        .select('id')

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}

/**
 * Hook para actualizar un contacto.
 */
export function useUpdateContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Contact> & { id: string }) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.invalidateQueries({ queryKey: ['contact'] })
    },
  })
}

/**
 * Hook para eliminar un contacto.
 */
export function useDeleteContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from('contacts').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}
