import { formatPhoneDisplay } from '@/lib/utils/phone'
import { ArrowLeft, UserCircle, Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Conversation } from '@/hooks/useConversations'

interface ContactHeaderProps {
  conversation: Conversation
  onBack?: () => void
  showBackButton?: boolean
  onInfoClick?: () => void
}

export function ContactHeader({ conversation, onBack, showBackButton, onInfoClick }: ContactHeaderProps) {
  const displayName = conversation.contact_name || formatPhoneDisplay(conversation.contact_phone)

  const statusColors: Record<string, string> = {
    new: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    contacted: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    responded: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    converted: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    lost: 'bg-red-500/20 text-red-400 border-red-500/30',
  }

  return (
    <div className="flex-shrink-0 z-10 flex items-center gap-3 px-4 py-3 border-b border-[#1E2235] bg-[#0F1117] shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
      {/* Botón back (mobile) */}
      {showBackButton && (
        <button
          onClick={onBack}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-[#64748B] hover:text-white hover:bg-[#1A1D27] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}

      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center flex-shrink-0 text-white font-semibold">
         {conversation.contact_name ? conversation.contact_name[0].toUpperCase() : <UserCircle className="w-6 h-6 text-white/80" />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onInfoClick}>
        <h3 className="text-sm font-semibold text-white truncate hover:underline">{displayName}</h3>
        <p className="text-xs text-[#64748B] truncate">
          {conversation.contact_name
            ? formatPhoneDisplay(conversation.contact_phone)
            : 'Sin nombre guardado'}
        </p>
      </div>

      {/* Status badge */}
      <Badge
        variant="outline"
        className={`text-[10px] font-medium mr-2 ${statusColors[conversation.contact_status] || statusColors.new}`}
      >
        {conversation.contact_status}
      </Badge>

      {/* Info Button */}
      {onInfoClick && (
          <button 
            onClick={onInfoClick}
            className="p-2 text-[#64748B] hover:text-white hover:bg-[#1A1D27] rounded-lg transition-colors"
          >
             <Info className="w-5 h-5" />
          </button>
      )}
    </div>
  )
}
