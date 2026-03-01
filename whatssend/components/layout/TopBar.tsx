'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LogOut, User, Bell } from 'lucide-react'

interface TopBarProps {
  title?: string
  userEmail?: string
  userName?: string
}

export function TopBar({ title, userEmail, userName }: TopBarProps) {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => setMounted(true), [])

  const routeTitles: Record<string, string> = {
    '/': 'Panel de Control',
    '/inbox': 'Bandeja de Entrada',
    '/ventas': 'Gestión de Ventas',
    '/registro': 'Registro de Ventas',
    '/campaigns': 'Campañas & Plantillas',
    '/contacts': 'Contactos',
    '/bot': 'Super Agente',
    '/analytics': 'Analíticas',
    '/settings': 'Configuración',
    '/pipeline': 'Pipeline',
    '/templates': 'Plantillas',
  }

  const pageTitle = title || routeTitles[pathname] || 'Panel de Control'

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = userName
    ? userName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : userEmail
      ? userEmail[0].toUpperCase()
      : 'U'

  if (!mounted) {
    return (
      <header className="flex items-center justify-between h-16 px-6 border-b border-[#1E2235] bg-[#0F1117]/80 backdrop-blur-md">
        <div>
          <h2 className="text-lg font-semibold text-white">{pageTitle}</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10" />
          <div className="flex items-center gap-2 px-2 h-10">
            <Avatar className="h-8 w-8 border border-[#2A2F45]">
              <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-[#94A3B8] hidden sm:inline">
              {userName || userEmail || 'Usuario'}
            </span>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="flex items-center justify-between h-16 px-6 border-b border-[#1E2235] bg-[#0F1117]/80 backdrop-blur-md">
      <div>
        <h2 className="text-lg font-semibold text-white">{pageTitle}</h2>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="text-[#64748B] hover:text-white hover:bg-[#1A1D27] relative"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-400 rounded-full" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 hover:bg-[#1A1D27] px-2 h-10"
            >
              <Avatar className="h-8 w-8 border border-[#2A2F45]">
                <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-[#94A3B8] hidden sm:inline">
                {userName || userEmail || 'Usuario'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 bg-[#1A1D27] border-[#2A2F45] text-white"
          >
            <div className="px-3 py-2">
              <p className="text-sm font-medium text-white">{userName || 'Usuario'}</p>
              <p className="text-xs text-[#64748B]">{userEmail}</p>
            </div>
            <DropdownMenuSeparator className="bg-[#2A2F45]" />
            <DropdownMenuItem className="text-[#94A3B8] hover:text-white focus:text-white focus:bg-[#2A2F45] cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Mi Perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#2A2F45]" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-red-500/10 cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
