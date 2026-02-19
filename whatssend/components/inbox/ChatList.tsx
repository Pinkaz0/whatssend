'use client'

import { cn } from '@/lib/utils'
import type { Conversation } from '@/hooks/useConversations'
import { formatPhoneDisplay } from '@/lib/utils/phone'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ChatListSkeleton } from './ChatListSkeleton'
import { EmptyInbox } from './EmptyInbox'

function formatTime(dateStr: string | null): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
  } else if (diffDays === 1) {
    return 'Ayer'
  } else if (diffDays < 7) {
    return date.toLocaleDateString('es-CL', { weekday: 'short' })
  } else {
    return date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' })
  }
}

function getInitials(name: string | null, phone: string): string {
  if (name && name.trim()) {
    return name
      .trim()
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
  }
  return phone.slice(-2)
}

interface ChatListProps {
  conversations: Conversation[]
  selectedContactId: string | null
  searchQuery: string
  isLoading: boolean
  onSelectContact: (id: string) => void
  onSearchChange: (query: string) => void
}

export function ChatList({
  conversations,
  selectedContactId,
  searchQuery,
  isLoading,
  onSelectContact,
  onSearchChange,
}: ChatListProps) {
  return (
    <div className="flex flex-col h-full bg-[#0F1117]">
      {/* Search bar */}
      <div className="p-3 border-b border-[#1E2235]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
          <Input
            placeholder="Buscar conversación..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-[#1A1D27] border-[#1E2235] text-white placeholder:text-[#475569] h-9 text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-[#1E2235]" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-[#1E2235] rounded w-3/4" />
                  <div className="h-3 bg-[#1E2235] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center px-6">
             <p className="text-sm text-[#64748B]">No se encontraron conversaciones</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.contact_id}
              onClick={() => onSelectContact(conv.contact_id)}
              className={cn(
                'flex items-center gap-3 w-full px-4 py-3 text-left transition-all duration-200 border-b border-[#1E2235]/50 group',
                selectedContactId === conv.contact_id
                  ? 'bg-gradient-to-r from-emerald-500/10 to-transparent border-l-2 border-l-emerald-500'
                  : 'hover:bg-[#1A1D27]/60 border-l-2 border-l-transparent'
              )}
            >
              {/* Avatar */}
              <div className={cn(
                "w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold text-white transition-transform group-hover:scale-105",
                selectedContactId === conv.contact_id 
                  ? "bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-500/20"
                  : "bg-gradient-to-br from-[#1E2235] to-[#2A2F45]"
              )}>
                {getInitials(conv.contact_name, conv.contact_phone)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "text-sm font-medium truncate transition-colors",
                    selectedContactId === conv.contact_id ? "text-emerald-400" : "text-white"
                  )}>
                    {conv.contact_name || formatPhoneDisplay(conv.contact_phone)}
                  </span>
                  <span className="text-[10px] text-[#475569] ml-2 flex-shrink-0">
                    {formatTime(conv.last_message_at)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-xs text-[#64748B] truncate pr-2 max-w-[180px]">
                    {conv.last_message_direction === 'outbound' && (
                      <span className="text-[#475569] mr-1">Tú:</span>
                    )}
                    <span className={cn(
                       conv.unread_count > 0 ? "text-[#E2E8F0] font-medium" : "text-[#64748B]"
                    )}>
                      {conv.last_message_body || 'Sin mensajes'}
                    </span>
                  </p>
                  {conv.unread_count > 0 && (
                    <span className="flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex-shrink-0 shadow-sm shadow-emerald-500/20">
                      {conv.unread_count > 9 ? '9+' : conv.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
