'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/useAppStore'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useConversations } from '@/hooks/useConversations'
import {
  LayoutDashboard,
  MessageSquare,
  Megaphone,
  Users,
  Activity,
  Package,
  Zap,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Briefcase,
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'

const navItems = [
  { href: '/', label: 'Panel', icon: LayoutDashboard },
  { href: '/inbox', label: 'Bandeja', icon: MessageSquare, badge: true },
  { href: '/ventas', label: 'Ventas', icon: Activity, badge: true },
  { href: '/registro', label: 'Registro Ventas', icon: Package },
  { href: '/campaigns', label: 'Campañas & Plantillas', icon: Megaphone },
  { href: '/contacts', label: 'Contactos', icon: Users },
  { href: '/bot', label: 'Super Agente', icon: Zap },
  { href: '/analytics', label: 'Analíticas', icon: BarChart3 },
]

const bottomItems = [
  { href: '/backoffice', label: 'Admin BA/BP', icon: Briefcase, adminOnly: true },
  { href: '/settings', label: 'Configuración', icon: Settings },
]

export function Sidebar({ userEmail, isAdmin = false }: { userEmail?: string; isAdmin?: boolean }) {
  const pathname = usePathname()
  const { sidebarExpanded, setSidebarExpanded } = useAppStore()
  const { workspaceId } = useWorkspace()
  const { data: conversations = [] } = useConversations(workspaceId)

  // Contar mensajes no leídos totales
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0)

  const filteredBottomItems = bottomItems.filter(item => {
    if (item.adminOnly && !isAdmin) return false
    return true
  })

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col h-screen bg-[#0F1117] border-r border-[#1E2235] transition-all duration-300 ease-in-out relative z-30',
        sidebarExpanded ? 'w-[220px]' : 'w-[68px]'
      )}
      onMouseEnter={() => setSidebarExpanded(true)}
      onMouseLeave={() => setSidebarExpanded(false)}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-[#1E2235]">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/20 flex-shrink-0">
          <MessageSquare className="w-5 h-5 text-white" />
        </div>
        <span
          className={cn(
            'ml-3 text-lg font-bold text-white whitespace-nowrap transition-opacity duration-200',
            sidebarExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
          )}
        >
          WhatsSend
        </span>
      </div>

      {/* Navegación principal */}
      <nav className="flex-1 flex flex-col py-4 px-3 space-y-1 overflow-hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          const showBadge = item.badge && totalUnread > 0
          return (
            <Tooltip key={item.href} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center h-10 px-3 rounded-lg transition-all duration-200 group relative',
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'text-[#64748B] hover:text-white hover:bg-[#1A1D27]'
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <item.icon
                      className={cn(
                        'w-5 h-5 transition-colors',
                        isActive ? 'text-emerald-400' : 'text-[#64748B] group-hover:text-white'
                      )}
                    />
                    {/* Badge pequeño cuando sidebar está colapsado */}
                    {showBadge && !sidebarExpanded && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center shadow-sm shadow-emerald-500/30">
                        {totalUnread > 9 ? '9+' : totalUnread}
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      'ml-3 text-sm font-medium whitespace-nowrap transition-opacity duration-200',
                      sidebarExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
                    )}
                  >
                    {item.label}
                  </span>
                  {/* Badge grande cuando sidebar está expandido */}
                  {sidebarExpanded && showBadge && (
                    <span className="ml-auto min-w-[20px] h-5 px-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm shadow-emerald-500/30">
                      {totalUnread > 9 ? '9+' : totalUnread}
                    </span>
                  )}
                  {isActive && (
                    <div className="absolute left-0 w-[3px] h-6 bg-emerald-400 rounded-r-full" />
                  )}
                </Link>
              </TooltipTrigger>
              {!sidebarExpanded && (
                <TooltipContent side="right" className="bg-[#1A1D27] text-white border-[#2A2F45]">
                  {item.label}{showBadge ? ` (${totalUnread})` : ''}
                </TooltipContent>
              )}
            </Tooltip>
          )
        })}
      </nav>

      {/* Sección inferior */}
      <div className="px-3 pb-4 space-y-1">
        <Separator className="bg-[#1E2235] mb-3" />
        {filteredBottomItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Tooltip key={item.href} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center h-10 px-3 rounded-lg transition-all duration-200 group',
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'text-[#64748B] hover:text-white hover:bg-[#1A1D27]'
                  )}
                >
                  <item.icon
                    className={cn(
                      'w-5 h-5 flex-shrink-0',
                      isActive ? 'text-emerald-400' : 'text-[#64748B] group-hover:text-white'
                    )}
                  />
                  <span
                    className={cn(
                      'ml-3 text-sm font-medium whitespace-nowrap transition-opacity duration-200',
                      sidebarExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              </TooltipTrigger>
              {!sidebarExpanded && (
                <TooltipContent side="right" className="bg-[#1A1D27] text-white border-[#2A2F45]">
                  {item.label}
                </TooltipContent>
              )}
            </Tooltip>
          )
        })}

        {/* Toggle botón */}
        <button
          onClick={() => setSidebarExpanded(!sidebarExpanded)}
          className="flex items-center justify-center w-full h-8 mt-2 rounded-lg text-[#475569] hover:text-white hover:bg-[#1A1D27] transition-all"
        >
          {sidebarExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  )
}
