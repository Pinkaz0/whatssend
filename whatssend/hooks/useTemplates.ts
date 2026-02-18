'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Template, TemplateInsert } from '@/types/template'

/**
 * Hook para obtener la lista de plantillas del workspace.
 */
export function useTemplates(workspaceId: string | null, category?: string) {
  return useQuery<Template[]>({
    queryKey: ['templates', workspaceId, category],
    queryFn: async () => {
      if (!workspaceId) return []

      const supabase = createClient()
      let query = supabase
        .from('templates')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })

      if (category) {
        query = query.eq('category', category)
      }

      const { data, error } = await query
      if (error) throw error
      return (data || []) as Template[]
    },
    enabled: !!workspaceId,
  })
}

/**
 * Hook para crear una plantilla.
 */
export function useCreateTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (template: TemplateInsert) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('templates')
        .insert(template)
        .select()
        .single()

      if (error) throw error
      return data as Template
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })
}

/**
 * Hook para actualizar una plantilla.
 */
export function useUpdateTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Template> & { id: string }) => {
      const supabase = createClient()
      const { error } = await supabase.from('templates').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })
}

/**
 * Hook para eliminar una plantilla.
 */
export function useDeleteTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from('templates').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })
}
