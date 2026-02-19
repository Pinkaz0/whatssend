import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPromotions, createPromotion, deletePromotion, togglePromotionStatus } from '@/lib/promotions/service'
import { PromotionInsert } from '@/types/promotion'

export function usePromotions(workspaceId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['promotions', workspaceId],
    queryFn: () => getPromotions(workspaceId),
    enabled: !!workspaceId
  })

  const create = useMutation({
    mutationFn: (data: PromotionInsert) => createPromotion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions', workspaceId] })
    }
  })

  const remove = useMutation({
    mutationFn: (id: string) => deletePromotion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions', workspaceId] })
    }
  })

  const toggle = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => togglePromotionStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions', workspaceId] })
    }
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    create,
    remove,
    toggle
  }
}
