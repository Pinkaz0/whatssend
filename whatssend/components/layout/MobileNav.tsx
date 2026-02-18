'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/useAppStore'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  LayoutDashboard,
  MessageSquare,
  Megaphone,
  Users,
  FileText,
  Bot,
  BarChart3,
  Settings,
  Menu,
} from 'lucide-react'

const navItems = [
  { href: '/', label: 'Panel', icon: LayoutDashboard },
  { href: '/inbox', label: 'Bandeja', icon: MessageSquare },
  { href: '/campaigns', label: 'Campañas', icon: Megaphone },
  { href: '/contacts', label: 'Contactos', icon: Users },
  { href: '/templates', label: 'Plantillas', icon: FileText },
  { href: '/bot', label: 'Bot', icon: Bot },
  { href: '/analytics', label: 'Analíticas', icon: BarChart3 },
  { href: '/settings', label: 'Configuración', icon: Settings },
]

export function MobileNav() {
  const pathname = usePathname()
  const { mobileSidebarOpen, setMobileSidebarOpen } = useAppStore()

  return (
    <div className="md:hidden">
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-[#64748B] hover:text-white hover:bg-[#1A1D27]"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-[280px] bg-[#0F1117] border-r border-[#1E2235] p-0"
        >
          <SheetHeader className="px-4 h-16 flex flex-row items-center border-b border-[#1E2235]">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/20">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <SheetTitle className="text-lg font-bold text-white">WhatsSend</SheetTitle>
            </div>
          </SheetHeader>

          <nav className="flex flex-col py-4 px-3 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))

              if (item.href === '/settings') {
                return (
                  <div key="separator" className="py-2">
                    <Separator className="bg-[#1E2235]" />
                  </div>
                )
              }

              return null
            })}
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={cn(
                    'flex items-center h-11 px-3 rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'text-[#64748B] hover:text-white hover:bg-[#1A1D27]'
                  )}
                >
                  <item.icon
                    className={cn(
                      'w-5 h-5 flex-shrink-0',
                      isActive ? 'text-emerald-400' : 'text-[#64748B]'
                    )}
                  />
                  <span className="ml-3 text-sm font-medium">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  )
}
