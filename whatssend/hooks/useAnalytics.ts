'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface AnalyticsData {
  totalContacts: number
  totalMessages: number
  inboundMessages: number
  outboundMessages: number
  totalCampaigns: number
  activeBotRules: number
  contactsByStatus: { status: string; count: number }[]
  messagesByDay: { date: string; inbound: number; outbound: number }[]
  contactGrowth: { date: string; count: number }[]
}

export function useAnalytics(workspaceId: string | null) {
  return useQuery<AnalyticsData>({
    queryKey: ['analytics', workspaceId],
    queryFn: async () => {
      if (!workspaceId) throw new Error('No workspace')

      const supabase = createClient()

      // Parallel queries
      const [
        contactsRes,
        messagesRes,
        campaignsRes,
        botRulesRes,
      ] = await Promise.all([
        supabase.from('contacts').select('id, status, created_at').eq('workspace_id', workspaceId),
        supabase.from('messages').select('id, direction, created_at').eq('workspace_id', workspaceId),
        supabase.from('campaigns').select('id').eq('workspace_id', workspaceId),
        supabase.from('bot_rules').select('id').eq('workspace_id', workspaceId).eq('is_active', true),
      ])

      const contacts = contactsRes.data || []
      const messages = messagesRes.data || []

      // Contacts by status
      const statusCounts: Record<string, number> = {}
      contacts.forEach(c => {
        statusCounts[c.status] = (statusCounts[c.status] || 0) + 1
      })
      const contactsByStatus = Object.entries(statusCounts).map(([status, count]) => ({ status, count }))

      // Messages by day (last 14 days)
      const dayMap: Record<string, { inbound: number; outbound: number }> = {}
      const now = new Date()
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        const key = d.toISOString().slice(0, 10)
        dayMap[key] = { inbound: 0, outbound: 0 }
      }
      messages.forEach(m => {
        const day = m.created_at.slice(0, 10)
        if (dayMap[day]) {
          if (m.direction === 'inbound') dayMap[day].inbound++
          else dayMap[day].outbound++
        }
      })
      const messagesByDay = Object.entries(dayMap).map(([date, counts]) => ({ date, ...counts }))

      // Contact growth (cumulative by day, last 14 days)
      const growthMap: Record<string, number> = {}
      contacts.forEach(c => {
        const day = c.created_at.slice(0, 10)
        growthMap[day] = (growthMap[day] || 0) + 1
      })
      let cumulative = 0
      const contactGrowth = Object.keys(dayMap).map(date => {
        cumulative += (growthMap[date] || 0)
        return { date, count: cumulative }
      })

      const inbound = messages.filter(m => m.direction === 'inbound').length
      const outbound = messages.filter(m => m.direction === 'outbound').length

      return {
        totalContacts: contacts.length,
        totalMessages: messages.length,
        inboundMessages: inbound,
        outboundMessages: outbound,
        totalCampaigns: campaignsRes.data?.length || 0,
        activeBotRules: botRulesRes.data?.length || 0,
        contactsByStatus,
        messagesByDay,
        contactGrowth,
      }
    },
    enabled: !!workspaceId,
    staleTime: 30000,
  })
}
