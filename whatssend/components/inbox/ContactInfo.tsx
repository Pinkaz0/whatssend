import { formatPhoneDisplay } from '@/lib/utils/phone'
import { X, User, Phone, Mail, Building, Tag, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Conversation } from '@/hooks/useConversations'

interface ContactInfoProps {
  conversation: Conversation
  onClose: () => void
}

export function ContactInfo({ conversation, onClose }: ContactInfoProps) {
  const initials = conversation.contact_name 
    ? conversation.contact_name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : conversation.contact_phone.slice(-2)

  return (
    <div className="flex flex-col h-full bg-[#0F1117] border-l border-[#1E2235]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E2235]">
        <h3 className="text-sm font-semibold text-white">Info. del contacto</h3>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose}
          className="h-8 w-8 text-[#64748B] hover:text-white hover:bg-[#1A1D27]"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Main Profile */}
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-2xl font-bold text-white mb-3 shadow-lg shadow-emerald-500/20">
              {initials}
            </div>
            <h2 className="text-lg font-bold text-white text-center">
              {conversation.contact_name || 'Sin nombre'}
            </h2>
            <p className="text-sm text-[#64748B] text-center mt-1">
              {formatPhoneDisplay(conversation.contact_phone)}
            </p>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#475569] uppercase tracking-wider">
                Estado
              </label>
              <div>
                <Badge variant="outline" className="bg-[#1A1D27] text-white border-[#2A2F45]">
                  {conversation.contact_status}
                </Badge>
              </div>
            </div>

            {conversation.contact_tags && conversation.contact_tags.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#475569] uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3 h-3" /> Etiquetas
                </label>
                <div className="flex flex-wrap gap-1.5">
                    {conversation.contact_tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="bg-[#1E2235] text-[#94A3B8] hover:bg-[#2A2F45]">
                            {tag}
                        </Badge>
                    ))}
                </div>
              </div>
            )}

            {/* Read-only fields (mocked for now since conversation view might not have email/company yet in all rows, checking hook type) */}
            {/* The Conversation type in hook doesn't have email/company. We might need to fetch full contact details or just show what we have. 
                For now, let's keep it simple with what we have + placeholders if needed. 
                Actually, let's look at the type definition in useConversations: 
                contact_name, contact_phone, contact_tags, contact_status.
                So we don't have email/company in the view yet. I'll omit them or show if I can update the view later. 
                For now I'll just show what I have. */}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
