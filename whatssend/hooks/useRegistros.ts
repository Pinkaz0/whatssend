'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { RegistroVenta } from '@/types/registro-venta'

export function useRegistros(workspaceId: string | null) {
  return useQuery<RegistroVenta[]>({
    queryKey: ['registros_ventas', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return []
      const supabase = createClient()
      const { data, error } = await supabase
        .from('registros_ventas')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as RegistroVenta[]
    },
    enabled: !!workspaceId,
  })
}

export function useUpsertRegistro() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (registro: Partial<RegistroVenta>) => {
      const supabase = createClient()
      
      let query
      if (registro.id) {
        query = supabase.from('registros_ventas').update(registro).eq('id', registro.id)
      } else {
        query = supabase.from('registros_ventas').insert(registro)
      }
      
      const { data, error } = await query.select().single()
      if (error) throw error
      return data as RegistroVenta
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registros_ventas'] })
    },
  })
}
