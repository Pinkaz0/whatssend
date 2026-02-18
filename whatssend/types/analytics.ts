export interface AnalyticsOverview {
  totalMessagesSent: number
  averageResponseRate: number
  newContactsThisMonth: number
  activeCampaigns: number
}

export interface DailyMessageCount {
  date: string
  count: number
}

export interface ResponseRatePoint {
  date: string
  rate: number
}

export interface ContactStatusDistribution {
  status: string
  count: number
}

export interface CampaignPerformance {
  campaignName: string
  responseRate: number
  totalSent: number
}

export type DateRangeFilter = '7d' | '30d' | '90d' | 'custom'
