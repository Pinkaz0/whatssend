'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Campaign, CampaignContact } from '@/types/campaign'

/**
 * Hook para obtener campañas del workspace.
 */
export function useCampaigns(workspaceId: string | null) {
  return useQuery<Campaign[]>({
    queryKey: ['campaigns', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return []
      const supabase = createClient()
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as Campaign[]
    },
    enabled: !!workspaceId,
  })
}

/**
 * Hook para obtener una campaña con sus contactos.
 */
export function useCampaignDetail(campaignId: string | null) {
  const campaignQuery = useQuery<Campaign | null>({
    queryKey: ['campaign', campaignId],
    queryFn: async () => {
      if (!campaignId) return null
      const supabase = createClient()
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single()
      if (error) throw error
      return data as Campaign
    },
    enabled: !!campaignId,
  })

  const contactsQuery = useQuery<(CampaignContact & { contact_name?: string; contact_phone?: string })[]>({
    queryKey: ['campaign-contacts', campaignId],
    queryFn: async () => {
      if (!campaignId) return []
      const supabase = createClient()
      const { data, error } = await supabase
        .from('campaign_contacts')
        .select('*, contacts(name, phone)')
        .eq('campaign_id', campaignId)
        .order('sent_at', { ascending: false })

      if (error) throw error
      return (data || []).map((cc: Record<string, unknown>) => ({
        ...cc,
        contact_name: (cc.contacts as Record<string, string> | null)?.name,
        contact_phone: (cc.contacts as Record<string, string> | null)?.phone,
      })) as (CampaignContact & { contact_name?: string; contact_phone?: string })[]
    },
    enabled: !!campaignId,
    refetchInterval: 5000,
  })

  return { campaign: campaignQuery, contacts: contactsQuery }
}

/**
 * Hook para crear una campaña.
 */
export function useCreateCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (campaign: {
      workspace_id: string
      name: string
      template_id: string | null
      message_body: string
      contact_ids: string[]
    }) => {
      const supabase = createClient()

      // 1. Crear campaña
      const { data: camp, error: campError } = await supabase
        .from('campaigns')
        .insert({
          workspace_id: campaign.workspace_id,
          name: campaign.name,
          template_id: campaign.template_id,
          message_body: campaign.message_body,
          status: 'draft',
        })
        .select()
        .single()

      if (campError || !camp) throw campError

      // 2. Insertar campaign_contacts
      const campaignContacts = campaign.contact_ids.map(cid => ({
        campaign_id: camp.id,
        contact_id: cid,
        status: 'pending' as const,
      }))

      const { error: ccError } = await supabase
        .from('campaign_contacts')
        .insert(campaignContacts)

      if (ccError) throw ccError

      return camp as Campaign
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    },
  })
}

/**
 * Hook para lanzar (enviar) una campaña.
 */
export function useSendCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (campaignId: string) => {
      const res = await fetch('/api/campaigns/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al enviar campaña')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['campaign-contacts'] })
    },
  })
}
