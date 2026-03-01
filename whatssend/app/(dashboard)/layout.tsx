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

  // Obtener perfil del usuario incluyendo role
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen bg-[#0F1117] overflow-hidden">
        <Sidebar userEmail={user.email} isAdmin={isAdmin} />

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
          <main className="flex-1 overflow-hidden min-h-0">
            <div id="main-content" className="p-6 h-full overflow-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
