export type TemplateCategory = 'sales' | 'followup' | 'welcome' | 'custom'

export interface Template {
  id: string
  workspace_id: string
  name: string
  body: string
  category: TemplateCategory | null
  created_at: string
}

export interface TemplateInsert {
  workspace_id: string
  name: string
  body: string
  category?: TemplateCategory | null
}
