'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { BotRule, BotRuleInsert } from '@/types/bot-rule'

export function useBotRules(workspaceId: string | null) {
  return useQuery<BotRule[]>({
    queryKey: ['bot-rules', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return []
      const supabase = createClient()
      const { data, error } = await supabase
        .from('bot_rules')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('priority', { ascending: true })
      if (error) throw error
      return (data || []) as BotRule[]
    },
    enabled: !!workspaceId,
  })
}

export function useCreateBotRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (rule: BotRuleInsert) => {
      const supabase = createClient()
      const { data, error } = await supabase.from('bot_rules').insert(rule).select().single()
      if (error) throw error
      return data as BotRule
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bot-rules'] }),
  })
}

export function useUpdateBotRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BotRule> & { id: string }) => {
      const supabase = createClient()
      const { error } = await supabase.from('bot_rules').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bot-rules'] }),
  })
}

export function useDeleteBotRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from('bot_rules').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bot-rules'] }),
  })
}
