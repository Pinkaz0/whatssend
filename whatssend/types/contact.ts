export type ContactStatus = 'new' | 'contacted' | 'responded' | 'converted' | 'lost'

export type ContactSource = 'excel' | 'sheets' | 'manual'

export interface Contact {
  id: string
  workspace_id: string
  phone: string
  name: string | null
  email: string | null
  company: string | null
  tags: string[]
  status: ContactStatus
  notes: string | null
  rut: string | null
  address: string | null
  comuna: string | null
  alt_phone: string | null
  source: ContactSource | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface ContactInsert {
  workspace_id: string
  phone: string
  name?: string | null
  email?: string | null
  company?: string | null
  tags?: string[]
  status?: ContactStatus
  notes?: string | null
  rut?: string | null
  address?: string | null
  comuna?: string | null
  alt_phone?: string | null
  source?: ContactSource | null
  metadata?: Record<string, unknown> | null
}
