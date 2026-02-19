import { createClient } from '@/lib/supabase/client'
import { Promotion, PromotionInsert } from '@/types/promotion'

export async function getActivePromotions(workspaceId: string): Promise<Promotion[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('is_active', true)
    
  if (error) throw error
  return data
}

export async function getPromotions(workspaceId: string): Promise<Promotion[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    
  if (error) throw error
  return data
}

export async function createPromotion(promotion: PromotionInsert): Promise<Promotion> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('promotions')
    .insert([promotion])
    .select()
    .single()
    
  if (error) throw error
  return data
}

export async function deletePromotion(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('promotions')
    .delete()
    .eq('id', id)
    
  if (error) throw error
}

export async function togglePromotionStatus(id: string, isActive: boolean): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('promotions')
    .update({ is_active: isActive })
    .eq('id', id)
    
  if (error) throw error
}
