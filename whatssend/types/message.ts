export type MessageDirection = 'outbound' | 'inbound'

export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed'

export interface Message {
  id: string
  workspace_id: string
  contact_id: string
  campaign_id: string | null
  direction: MessageDirection
  body: string
  status: MessageStatus
  ultramsg_message_id: string | null
  sent_at: string | null
  created_at: string
}

export interface MessageInsert {
  workspace_id: string
  contact_id: string
  campaign_id?: string | null
  direction: MessageDirection
  body: string
  status?: MessageStatus
  ultramsg_message_id?: string | null
  sent_at?: string | null
}
