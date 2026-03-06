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
  // Dashboard real data
  salesByStatus: { status: string; count: number }[]
  totalActiveSales: number
  salesTrendWeek: number
  unansweredContacts: { contactId: string; name: string; count: number }[]
  totalNoRealizadas: number
}

const EMPTY_ANALYTICS: AnalyticsData = {
  totalContacts: 0,
  totalMessages: 0,
  inboundMessages: 0,
  outboundMessages: 0,
  totalCampaigns: 0,
  activeBotRules: 0,
  contactsByStatus: [],
  messagesByDay: [],
  contactGrowth: [],
  salesByStatus: [],
  totalActiveSales: 0,
  salesTrendWeek: 0,
  unansweredContacts: [],
  totalNoRealizadas: 0,
}

async function safeQuery<T>(
  queryFn: () => PromiseLike<{ data: T | null; error: unknown }>
): Promise<T | null> {
  try {
    const { data, error } = await queryFn()
    if (error) return null
    return data
  } catch {
    return null
  }
}

export function useAnalytics(workspaceId: string | null) {
  return useQuery<AnalyticsData>({
    queryKey: ['analytics', workspaceId],
    queryFn: async () => {
      if (!workspaceId) throw new Error('No workspace')

      const supabase = createClient()

      // Parallel queries with individual error handling
      const [contactsRaw, messagesRaw, campaignsRaw, botRulesRaw, pipelineRaw, pipelineWeekRaw] = await Promise.all([
        safeQuery(() =>
          supabase.from('contacts').select('id, status, created_at').eq('workspace_id', workspaceId)
        ),
        safeQuery(() =>
          supabase.from('messages').select('id, direction, created_at, contact_id').eq('workspace_id', workspaceId)
        ),
        safeQuery(() =>
          supabase.from('campaigns').select('id').eq('workspace_id', workspaceId)
        ),
        safeQuery(() =>
          supabase.from('bot_rules').select('id, is_active').eq('workspace_id', workspaceId)
        ),
        safeQuery(() =>
          supabase.from('pipeline_leads').select('id, status, created_at').eq('workspace_id', workspaceId)
        ),
        safeQuery(() => {
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          return supabase.from('pipeline_leads').select('id').eq('workspace_id', workspaceId).gte('created_at', weekAgo.toISOString())
        }),
      ])

      const contacts = (contactsRaw || []) as { id: string; status: string; created_at: string }[]
      const messages = (messagesRaw || []) as { id: string; direction: string; created_at: string; contact_id: string }[]
      const campaigns = (campaignsRaw || []) as { id: string }[]
      const botRules = (botRulesRaw || []) as { id: string; is_active: boolean }[]
      const pipelineLeads = (pipelineRaw || []) as { id: string; status: string; created_at: string }[]
      const pipelineWeek = (pipelineWeekRaw || []) as { id: string }[]

      // Contacts by status
      const statusCounts: Record<string, number> = {}
      contacts.forEach((c) => {
        const s = c.status || 'new'
        statusCounts[s] = (statusCounts[s] || 0) + 1
      })
      const contactsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
      }))

      // Messages by day (last 14 days)
      const dayMap: Record<string, { inbound: number; outbound: number }> = {}
      const now = new Date()
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        const key = d.toISOString().slice(0, 10)
        dayMap[key] = { inbound: 0, outbound: 0 }
      }
      messages.forEach((m) => {
        const day = m.created_at?.slice(0, 10)
        if (day && dayMap[day]) {
          if (m.direction === 'inbound') dayMap[day].inbound++
          else dayMap[day].outbound++
        }
      })
      const messagesByDay = Object.entries(dayMap).map(([date, counts]) => ({
        date,
        ...counts,
      }))

      // Contact growth (cumulative by day, last 14 days)
      const growthMap: Record<string, number> = {}
      contacts.forEach((c) => {
        const day = c.created_at?.slice(0, 10)
        if (day) growthMap[day] = (growthMap[day] || 0) + 1
      })
      let cumulative = 0
      const contactGrowth = Object.keys(dayMap).map((date) => {
        cumulative += growthMap[date] || 0
        return { date, count: cumulative }
      })

      const inbound = messages.filter((m) => m.direction === 'inbound').length
      const outbound = messages.filter((m) => m.direction === 'outbound').length

      // Pipeline leads by status
      const salesStatusCounts: Record<string, number> = {}
      pipelineLeads.forEach((l) => {
        const s = l.status || 'interested'
        salesStatusCounts[s] = (salesStatusCounts[s] || 0) + 1
      })
      const salesByStatus = Object.entries(salesStatusCounts).map(([status, count]) => ({ status, count }))
      const totalNoRealizadas = salesStatusCounts['rejected'] || 0
      const totalActiveSales = pipelineLeads.filter(l => !['rejected', 'ingested'].includes(l.status)).length

      // Unanswered contacts: contacts with last message inbound (no outbound reply after)
      const contactLastMsg: Record<string, { direction: string; created_at: string }> = {}
      messages.forEach((m) => {
        const existing = contactLastMsg[m.contact_id]
        if (!existing || m.created_at > existing.created_at) {
          contactLastMsg[m.contact_id] = { direction: m.direction, created_at: m.created_at }
        }
      })
      // Count inbound messages per contact that don't have a more recent outbound
      const unansweredMap: Record<string, number> = {}
      Object.entries(contactLastMsg).forEach(([contactId, last]) => {
        if (last.direction === 'inbound') {
          unansweredMap[contactId] = (unansweredMap[contactId] || 0) + 1
        }
      })
      const unansweredContacts = Object.entries(unansweredMap).map(([contactId, count]) => {
        const contact = contacts.find(c => c.id === contactId)
        return { contactId, name: contactId.substring(0, 8), count }
      }).slice(0, 5)

      return {
        totalContacts: contacts.length,
        totalMessages: messages.length,
        inboundMessages: inbound,
        outboundMessages: outbound,
        totalCampaigns: campaigns.length,
        activeBotRules: botRules.filter((r) => r.is_active).length,
        contactsByStatus,
        messagesByDay,
        contactGrowth,
        salesByStatus,
        totalActiveSales,
        salesTrendWeek: pipelineWeek.length,
        unansweredContacts,
        totalNoRealizadas,
      }
    },
    enabled: !!workspaceId,
    staleTime: 30000,
    placeholderData: EMPTY_ANALYTICS,
  })
}
