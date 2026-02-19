export interface Promotion {
  id: string
  workspace_id: string
  name: string
  speed: string | null
  price: number | null
  description: string | null
  additional_services: string[] | null
  is_active: boolean
  created_at: string
}

export interface PromotionInsert {
  workspace_id: string
  name: string
  speed?: string | null
  price?: number | null
  description?: string | null
  additional_services?: string[] | null
  is_active?: boolean
}
