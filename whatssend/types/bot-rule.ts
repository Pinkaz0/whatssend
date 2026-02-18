export type MatchType = 'exact' | 'contains' | 'starts_with'

export interface BotRule {
  id: string
  workspace_id: string
  trigger_keyword: string
  match_type: MatchType
  response_body: string
  is_active: boolean
  priority: number
  created_at: string
}

export interface BotRuleInsert {
  workspace_id: string
  trigger_keyword: string
  match_type?: MatchType
  response_body: string
  is_active?: boolean
  priority?: number
}
