import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { MobileNav } from '@/components/layout/MobileNav'
import { TooltipProvider } from '@/components/ui/tooltip'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Obtener perfil del usuario
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen bg-[#0F1117] overflow-hidden">
        {/* Sidebar - solo desktop */}
        <Sidebar />

        {/* Contenido principal */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* TopBar */}
          <div className="flex items-center">
            {/* Botón mobile nav */}
            <div className="md:hidden pl-4">
              <MobileNav />
            </div>
            <div className="flex-1">
              <TopBar
                userEmail={user.email}
                userName={profile?.full_name ?? undefined}
              />
            </div>
          </div>

          {/* Área de contenido */}
          <main className="flex-1 overflow-auto">
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
