'use client'

import { use, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useContact, useUpdateContact } from '@/hooks/useContacts'
import { useMessages } from '@/hooks/useMessages'
import { MessageBubble } from '@/components/inbox/MessageBubble'
import { ContactTag } from '@/components/contacts/ContactTag'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPhoneDisplay } from '@/lib/utils/phone'
import {
  ArrowLeft,
  Phone,
  Mail,
  Building2,
  MessageSquare,
  Save,
  Loader2,
  Plus,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: contactId } = use(params)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editCompany, setEditCompany] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [editTags, setEditTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [initialized, setInitialized] = useState(false)

  const { data: contact, isLoading: loadingContact } = useContact(contactId)
  const { data: messages = [], isLoading: loadingMessages } = useMessages(contactId, workspaceId)
  const updateContact = useUpdateContact()

  useEffect(() => {
    async function loadWorkspace() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: ws } = await supabase.from('workspaces').select('id').eq('owner_id', user.id).limit(1).maybeSingle()
      setWorkspaceId(ws?.id || null)
    }
    loadWorkspace()
  }, [])

  // Inicializar campos de edición cuando carga el contacto
  useEffect(() => {
    if (contact && !initialized) {
      setEditName(contact.name || '')
      setEditEmail(contact.email || '')
      setEditCompany(contact.company || '')
      setEditNotes(contact.notes || '')
      setEditStatus(contact.status)
      setEditTags(contact.tags || [])
      setInitialized(true)
    }
  }, [contact, initialized])

  const handleSave = async () => {
    if (!contactId) return
    try {
      await updateContact.mutateAsync({
        id: contactId,
        name: editName || null,
        email: editEmail || null,
        company: editCompany || null,
        notes: editNotes || null,
        status: editStatus as 'new' | 'contacted' | 'responded' | 'converted' | 'lost',
        tags: editTags,
      })
      toast.success('Contacto actualizado')
    } catch {
      toast.error('Error al actualizar contacto')
    }
  }

  const addTag = () => {
    const tag = newTag.trim().toLowerCase()
    if (tag && !editTags.includes(tag)) {
      setEditTags([...editTags, tag])
      setNewTag('')
    }
  }

  const removeTag = (tag: string) => {
    setEditTags(editTags.filter((t) => t !== tag))
  }

  if (loadingContact) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-8 w-48 bg-[#1E2235]" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96 bg-[#1E2235] rounded-xl" />
          <Skeleton className="h-96 bg-[#1E2235] rounded-xl" />
        </div>
      </div>
    )
  }

  if (!contact) {
    return (
      <div className="text-center py-20">
        <p className="text-[#64748B]">Contacto no encontrado</p>
        <Link href="/contacts" className="text-emerald-400 text-sm mt-2 inline-block">
          Volver a contactos
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/contacts"
          className="flex items-center justify-center w-9 h-9 rounded-lg text-[#64748B] hover:text-white hover:bg-[#1A1D27] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">
            {contact.name || formatPhoneDisplay(contact.phone)}
          </h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-[#64748B]">
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" />
              {formatPhoneDisplay(contact.phone)}
            </span>
            {contact.email && (
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                {contact.email}
              </span>
            )}
            {contact.company && (
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {contact.company}
              </span>
            )}
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={updateContact.isPending}
          className="bg-emerald-500 hover:bg-emerald-600 text-white"
        >
          {updateContact.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Guardar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Contact Info */}
        <div className="space-y-4">
          <Card className="bg-[#1A1D27] border-[#1E2235]">
            <CardHeader>
              <CardTitle className="text-white text-base">Información</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[#94A3B8] text-xs">Nombre</Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-[#0F1117] border-[#2A2F45] text-white h-9 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#94A3B8] text-xs">Email</Label>
                <Input
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="bg-[#0F1117] border-[#2A2F45] text-white h-9 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#94A3B8] text-xs">Empresa</Label>
                <Input
                  value={editCompany}
                  onChange={(e) => setEditCompany(e.target.value)}
                  className="bg-[#0F1117] border-[#2A2F45] text-white h-9 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#94A3B8] text-xs">Estado</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger className="bg-[#0F1117] border-[#2A2F45] text-white h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1D27] border-[#2A2F45]">
                    <SelectItem value="new">Nuevo</SelectItem>
                    <SelectItem value="contacted">Contactado</SelectItem>
                    <SelectItem value="responded">Respondió</SelectItem>
                    <SelectItem value="converted">Convertido</SelectItem>
                    <SelectItem value="lost">Perdido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[#94A3B8] text-xs">Notas</Label>
                <Textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Notas sobre este contacto..."
                  className="bg-[#0F1117] border-[#2A2F45] text-white text-sm min-h-[80px] resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card className="bg-[#1A1D27] border-[#1E2235]">
            <CardHeader>
              <CardTitle className="text-white text-base">Etiquetas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {editTags.map((tag) => (
                  <ContactTag key={tag} tag={tag} onRemove={() => removeTag(tag)} />
                ))}
                {editTags.length === 0 && (
                  <span className="text-xs text-[#475569]">Sin etiquetas</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTag()}
                  placeholder="Agregar etiqueta..."
                  className="bg-[#0F1117] border-[#2A2F45] text-white h-8 text-xs flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addTag}
                  disabled={!newTag.trim()}
                  className="border-[#2A2F45] text-[#94A3B8] hover:text-white h-8"
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Source info */}
          <div className="flex items-center gap-2 text-xs text-[#475569]">
            <Badge variant="outline" className="text-[10px] border-[#2A2F45] text-[#64748B]">
              {contact.source || 'manual'}
            </Badge>
            <span>
              Creado el {new Date(contact.created_at).toLocaleDateString('es-CL', {
                day: '2-digit', month: 'short', year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Right: Message History */}
        <Card className="bg-[#1A1D27] border-[#1E2235]">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              Historial ({messages.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1">
              {loadingMessages ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 bg-[#1E2235] rounded-xl" />
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <p className="text-sm text-[#475569] text-center py-8">
                  No hay mensajes con este contacto
                </p>
              ) : (
                messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
