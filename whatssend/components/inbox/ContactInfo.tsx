import { useState } from 'react'
import { formatPhoneDisplay } from '@/lib/utils/phone'
import { X, User, Phone, Mail, Building, Tag, Trash2, BookUser, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { Conversation } from '@/hooks/useConversations'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useUpdateContact } from '@/hooks/useContacts'
import { toast } from 'sonner'

interface ContactInfoProps {
  conversation: Conversation
  onClose: () => void
  onDeleteConversation?: () => void
}

export function ContactInfo({ conversation, onClose, onDeleteConversation }: ContactInfoProps) {
  const { workspaceId } = useWorkspace()
  const updateContact = useUpdateContact()
  const [editingName, setEditingName] = useState(conversation.contact_name || '')
  const [saved, setSaved] = useState(false)

  const initials = conversation.contact_name
    ? conversation.contact_name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : conversation.contact_phone.slice(-2)

  const handleSaveContact = async () => {
    if (!conversation.contact_id) return
    try {
      await updateContact.mutateAsync({
        id: conversation.contact_id,
        name: editingName.trim() || null,
        source: 'manual',
      })
      setSaved(true)
      toast.success('Contacto guardado')
      setTimeout(() => setSaved(false), 2000)
    } catch {
      toast.error('Error al guardar contacto')
    }
  }

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

          {/* Save Contact */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[#475569] uppercase tracking-wider flex items-center gap-1.5">
              <BookUser className="w-3 h-3" /> Guardar Contacto
            </label>
            <div className="space-y-2">
              <Input
                placeholder="Nombre del contacto"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                className="bg-[#1A1D27] border-[#2A2F45] text-white placeholder:text-[#475569] text-sm h-8 focus:border-emerald-500/50"
              />
              <Button
                size="sm"
                onClick={handleSaveContact}
                disabled={updateContact.isPending}
                className={`w-full h-8 text-xs transition-all ${
                  saved
                    ? 'bg-green-600 hover:bg-green-600'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                } text-white`}
              >
                {updateContact.isPending ? (
                  <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Guardando...</>
                ) : saved ? (
                  <><Check className="w-3 h-3 mr-1" />Guardado</>
                ) : (
                  <><BookUser className="w-3 h-3 mr-1" />Guardar como contacto</>
                )}
              </Button>
            </div>
          </div>

          <Separator className="bg-[#1E2235]" />

          {/* Details */}
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#475569] uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-3 h-3" /> Teléfono
              </label>
              <p className="text-sm text-white">{formatPhoneDisplay(conversation.contact_phone)}</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[#475569] uppercase tracking-wider">Estado</label>
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
          </div>

          <Separator className="bg-[#1E2235]" />

          {/* Danger zone */}
          {onDeleteConversation && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-red-400/70 uppercase tracking-wider">Zona peligrosa</label>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-xs border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/40 bg-transparent"
                  >
                    <Trash2 className="w-3 h-3 mr-1.5" />
                    Eliminar conversación
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-[#1A1D27] border-[#2A2F45]">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">¿Eliminar conversación?</AlertDialogTitle>
                    <AlertDialogDescription className="text-[#64748B]">
                      Se eliminarán todos los mensajes de esta conversación. El contacto no se eliminará.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-[#0F1117] border-[#2A2F45] text-white hover:bg-[#1E2235]">
                      Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onDeleteConversation}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
