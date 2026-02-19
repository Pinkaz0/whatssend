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
 * Hook para crear un solo contacto.
 */
export function useCreateContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (contact: ContactInsert) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('contacts')
        .insert(contact)
        .select()
        .single()

      if (error) throw error
      return data as Contact
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
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
      if (contacts.length === 0) return []
      
      const workspaceId = contacts[0].workspace_id
      const phones = contacts.map(c => c.phone)

      // 1. Check existing phones to avoid 409/500 errors
      const { data: existing, error: checkError } = await supabase
        .from('contacts')
        .select('phone')
        .eq('workspace_id', workspaceId)
        .in('phone', phones)
      
      if (checkError) throw checkError
      
      const existingPhones = new Set(existing?.map(e => e.phone))
      
      // Filter out existing in DB AND duplicates within the file itself
      const uniqueNewContacts = new Map()
      
      contacts.forEach(c => {
        if (!existingPhones.has(c.phone)) {
           // If we haven't seen this phone in this batch yet, add it
           if (!uniqueNewContacts.has(c.phone)) {
             uniqueNewContacts.set(c.phone, c)
           }
        }
      })
      
      const contactsToInsert = Array.from(uniqueNewContacts.values())

      // 2. Insert only new unique contacts (skip if all already exist)
      if (contactsToInsert.length > 0) {
        const { error } = await supabase
          .from('contacts')
          .insert(contactsToInsert)

        if (error) throw error
      }

      // 3. Return ALL IDs (new + existing) for the campaign
      const { data: allContacts, error: fetchError } = await supabase
        .from('contacts')
        .select('id, phone')
        .eq('workspace_id', workspaceId)
        .in('phone', phones)

      if (fetchError) throw fetchError

      return (allContacts || []).map(c => ({ id: c.id, phone: c.phone }))
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

/**
 * Hook para eliminar TODOS los contactos del workspace.
 */
export function useDeleteAllContacts() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (workspaceId: string) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('workspace_id', workspaceId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}
