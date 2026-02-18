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
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="p-3 border-b border-[#1E2235]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
          <Input
            placeholder="Buscar conversación..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-[#0F1117] border-[#1E2235] text-white placeholder:text-[#475569] h-9 text-sm focus:border-emerald-500/50 focus:ring-0"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <ChatListSkeleton />
        ) : conversations.length === 0 ? (
          <EmptyInbox />
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.contact_id}
              onClick={() => onSelectContact(conv.contact_id)}
              className={cn(
                'flex items-center gap-3 w-full px-4 py-3 text-left transition-colors duration-150 border-b border-[#1E2235]/50',
                selectedContactId === conv.contact_id
                  ? 'bg-emerald-500/10 border-l-2 border-l-emerald-400'
                  : 'hover:bg-[#1A1D27]/60'
              )}
            >
              {/* Avatar */}
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-white">
                {getInitials(conv.contact_name, conv.contact_phone)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white truncate">
                    {conv.contact_name || formatPhoneDisplay(conv.contact_phone)}
                  </span>
                  <span className="text-[10px] text-[#475569] ml-2 flex-shrink-0">
                    {formatTime(conv.last_message_at)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-xs text-[#64748B] truncate pr-2">
                    {conv.last_message_direction === 'outbound' && (
                      <span className="text-[#475569]">Tú: </span>
                    )}
                    {conv.last_message_body || 'Sin mensajes'}
                  </p>
                  {conv.unread_count > 0 && (
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex-shrink-0">
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
