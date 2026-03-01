'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { VentaTOA } from '@/types/venta-toa'

export function useVentas(workspaceId: string | null) {
  return useQuery<VentaTOA[]>({
    queryKey: ['ventas_toa', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return []
      const supabase = createClient()
      const { data, error } = await supabase
        .from('ventas_toa')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as VentaTOA[]
    },
    enabled: !!workspaceId,
  })
}

export function useUpsertVenta() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (venta: Partial<VentaTOA>) => {
      if (!venta.workspace_id || !venta.orden) throw new Error('Faltan campos requeridos')
      
      const supabase = createClient()
      const { data, error } = await supabase
        .from('ventas_toa')
        .upsert(venta, { onConflict: 'workspace_id,orden' })
        .select()
        .single()

      if (error) throw error
      return data as VentaTOA
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventas_toa'] })
    },
  })
}
