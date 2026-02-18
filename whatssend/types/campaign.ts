export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'running' | 'completed' | 'failed'

export type CampaignContactStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'replied' | 'failed'

export interface Campaign {
  id: string
  workspace_id: string
  name: string
  template_id: string | null
  message_body: string | null
  status: CampaignStatus
  scheduled_at: string | null
  sent_at: string | null
  total_contacts: number
  sent_count: number
  delivered_count: number
  read_count: number
  replied_count: number
  created_at: string
}

export interface CampaignContact {
  id: string
  campaign_id: string
  contact_id: string
  status: CampaignContactStatus
  sent_at: string | null
  error_message: string | null
}

export interface CampaignInsert {
  workspace_id: string
  name: string
  template_id?: string | null
  message_body?: string | null
  status?: CampaignStatus
  scheduled_at?: string | null
}
