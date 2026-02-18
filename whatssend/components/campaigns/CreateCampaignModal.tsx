'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useContacts } from '@/hooks/useContacts'
import { useTemplates } from '@/hooks/useTemplates'
import { useCreateCampaign } from '@/hooks/useCampaigns'
import type { Template } from '@/types/template'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, Users, CheckSquare, Square } from 'lucide-react'
import { toast } from 'sonner'

interface CreateCampaignModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
}

export function CreateCampaignModal({ open, onOpenChange, workspaceId }: CreateCampaignModalProps) {
  const [name, setName] = useState('')
  const [messageBody, setMessageBody] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('_none')
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set())

  const { data: contacts = [] } = useContacts(workspaceId)
  const { data: templates = [] } = useTemplates(workspaceId)
  const createCampaign = useCreateCampaign()

  // Cuando selecciona un template, llenar el body
  useEffect(() => {
    if (selectedTemplate && selectedTemplate !== '_none') {
      const tpl = templates.find(t => t.id === selectedTemplate)
      if (tpl) setMessageBody(tpl.body)
    }
  }, [selectedTemplate, templates])

  const toggleContact = (id: string) => {
    const next = new Set(selectedContactIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedContactIds(next)
  }

  const toggleAll = () => {
    if (selectedContactIds.size === contacts.length) {
      setSelectedContactIds(new Set())
    } else {
      setSelectedContactIds(new Set(contacts.map(c => c.id)))
    }
  }

  const handleCreate = async () => {
    if (!name.trim()) { toast.error('Ingresa un nombre'); return }
    if (!messageBody.trim()) { toast.error('Ingresa un mensaje'); return }
    if (selectedContactIds.size === 0) { toast.error('Selecciona al menos 1 contacto'); return }

    try {
      await createCampaign.mutateAsync({
        workspace_id: workspaceId,
        name: name.trim(),
        template_id: selectedTemplate !== '_none' ? selectedTemplate : null,
        message_body: messageBody.trim(),
        contact_ids: Array.from(selectedContactIds),
      })
      toast.success('Campaña creada')
      onOpenChange(false)
      setName('')
      setMessageBody('')
      setSelectedTemplate('_none')
      setSelectedContactIds(new Set())
    } catch (err) {
      toast.error('Error al crear campaña', { description: err instanceof Error ? err.message : undefined })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1A1D27] border-[#1E2235] text-white max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Nueva Campaña</DialogTitle>
          <DialogDescription className="text-[#64748B]">
            Envía un mensaje a múltiples contactos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label className="text-[#94A3B8] text-xs">Nombre de la campaña</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Promoción Enero 2025"
              className="bg-[#0F1117] border-[#2A2F45] text-white h-9 text-sm"
            />
          </div>

          {/* Template */}
          <div className="space-y-2">
            <Label className="text-[#94A3B8] text-xs">Plantilla (opcional)</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger className="bg-[#0F1117] border-[#2A2F45] text-white h-9 text-sm">
                <SelectValue placeholder="Seleccionar plantilla" />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1D27] border-[#2A2F45]">
                <SelectItem value="_none" className="text-[#475569]">— Sin plantilla —</SelectItem>
                {templates.map(tpl => (
                  <SelectItem key={tpl.id} value={tpl.id} className="text-white">{tpl.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label className="text-[#94A3B8] text-xs">Mensaje</Label>
            <Textarea
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              placeholder="Hola {{nombre}}, te escribimos de..."
              className="bg-[#0F1117] border-[#2A2F45] text-white text-sm min-h-[100px] resize-none font-mono"
            />
            <p className="text-[10px] text-[#475569]">
              Variables: {'{{nombre}}'}, {'{{telefono}}'}
            </p>
          </div>

          {/* Contact selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-[#94A3B8] text-xs">Contactos</Label>
              <button
                onClick={toggleAll}
                className="text-[10px] text-emerald-400 hover:text-emerald-300"
              >
                {selectedContactIds.size === contacts.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
              </button>
            </div>
            <div className="border border-[#1E2235] rounded-lg max-h-40 overflow-y-auto">
              {contacts.length === 0 ? (
                <p className="text-xs text-[#475569] text-center py-4">No hay contactos</p>
              ) : (
                contacts.map(c => (
                  <button
                    key={c.id}
                    onClick={() => toggleContact(c.id)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-[#0F1117] transition-colors"
                  >
                    {selectedContactIds.has(c.id) ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-[#475569] flex-shrink-0" />
                    )}
                    <span className="text-sm text-white truncate">{c.name || c.phone}</span>
                  </button>
                ))
              )}
            </div>
            <Badge variant="outline" className="text-[10px] border-[#2A2F45] text-[#64748B]">
              <Users className="w-3 h-3 mr-1" />
              {selectedContactIds.size} seleccionados
            </Badge>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[#2A2F45] text-[#94A3B8] hover:text-white hover:bg-[#0F1117]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createCampaign.isPending}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {createCampaign.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Crear Campaña
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
