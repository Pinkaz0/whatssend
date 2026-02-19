import { cn } from '@/lib/utils'
import type { Message } from '@/types/message'
import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react'

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
}

function StatusIcon({ status }: { status: Message['status'] }) {
  switch (status) {
    case 'pending':
      return <Clock className="w-3 h-3 text-[#475569]" />
    case 'sent':
      return <Check className="w-3 h-3 text-[#475569]" />
    case 'delivered':
      return <CheckCheck className="w-3 h-3 text-[#475569]" />
    case 'read':
      return <CheckCheck className="w-3 h-3 text-blue-400" />
    case 'failed':
      return <AlertCircle className="w-3 h-3 text-red-400" />
    default:
      return null
  }
}

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isOutbound = message.direction === 'outbound'
  const isPending = message.id.startsWith('temp-')

  return (
    <div
      className={cn(
        'flex animate-in fade-in-0 slide-in-from-bottom-2 duration-200',
        isOutbound ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[75%] rounded-lg px-3 py-1.5 shadow-sm text-[15px] leading-snug',
          isOutbound
            ? 'bg-[#005C4B] text-[#E9EDEF] rounded-tr-none'
            : 'bg-[#202C33] text-[#E9EDEF] rounded-tl-none',
          isPending && 'opacity-70'
        )}
      >
        {/* Cuerpo del mensaje */}
        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
          {message.body}
        </p>

        {/* Footer: hora + status */}
        <div
          className={cn(
            'flex items-center gap-1 mt-1',
            isOutbound ? 'justify-end' : 'justify-start'
          )}
        >
          <span
            className={cn(
              'text-[10px]',
              isOutbound ? 'text-white/60' : 'text-[#475569]'
            )}
          >
            {formatMessageTime(message.sent_at || message.created_at)}
          </span>
          {isOutbound && <StatusIcon status={message.status} />}
        </div>
      </div>
    </div>
  )
}
