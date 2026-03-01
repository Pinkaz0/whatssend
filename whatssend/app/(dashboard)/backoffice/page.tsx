import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BackofficeClient from './BackofficeClient'

/**
 * Server Component — verifica que el usuario sea admin antes de renderizar.
 * Si no lo es, redirige al dashboard.
 */
export default async function BackofficePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/')
  }

  return <BackofficeClient />
}
