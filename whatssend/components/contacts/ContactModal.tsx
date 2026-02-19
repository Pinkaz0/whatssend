'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { X } from 'lucide-react'
import type { Contact } from '@/types/contact'
import { useCreateContact, useUpdateContact } from '@/hooks/useContacts'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ContactModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  contact?: Contact | null // If null, creating new
}

export function ContactModal({ open, onOpenChange, workspaceId, contact }: ContactModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    status: 'new',
    tags: [] as string[],
    notes: '',
    newTag: ''
  })

  // Reset form when contact changes
  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name || '',
        phone: contact.phone || '',
        email: contact.email || '',
        company: contact.company || '',
        status: contact.status || 'new',
        tags: contact.tags || [],
        notes: contact.notes || '',
        newTag: ''
      })
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        company: '',
        status: 'new',
        tags: [],
        notes: '',
        newTag: ''
      })
    }
  }, [contact, open])

  const createContact = useCreateContact()
  const updateContact = useUpdateContact()
  const isSaving = createContact.isPending || updateContact.isPending

  /* Removed debug logs */
  
  const handleSave = async () => {
    if (!formData.phone) {
      toast.error('El teléfono es obligatorio')
      return
    }

    if (!workspaceId) {
      toast.error('Error crítico: No se ha detectado un Workspace activo. Recarga la página.')
      return
    }

    try {
      if (contact) {
         await updateContact.mutateAsync({
            id: contact.id,
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            company: formData.company,
            status: formData.status as any,
            tags: formData.tags,
            notes: formData.notes
         })
         toast.success('Contacto actualizado')
      } else {
         await createContact.mutateAsync({
            workspace_id: workspaceId,
            phone: formData.phone,
            name: formData.name || undefined,
            email: formData.email || undefined,
            company: formData.company || undefined,
            status: formData.status as any,
            tags: formData.tags.length > 0 ? formData.tags : undefined,
            notes: formData.notes || undefined,
            source: 'manual',
         })
         toast.success('Contacto creado')
      }
      onOpenChange(false)
    } catch (err: any) {
       toast.error(err.message || 'Error al guardar')
    }
  }

  const addTag = (e: React.KeyboardEvent) => {
     if (e.key === 'Enter' && formData.newTag.trim()) {
        e.preventDefault()
        if (!formData.tags.includes(formData.newTag.trim())) {
           setFormData(prev => ({
              ...prev,
              tags: [...prev.tags, prev.newTag.trim()],
              newTag: ''
           }))
        }
     }
  }

  const removeTag = (tag: string) => {
     setFormData(prev => ({
        ...prev,
        tags: prev.tags.filter(t => t !== tag)
     }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1A1D27] border-[#1E2235] text-white">
        <DialogHeader>
          <DialogTitle>{contact ? 'Editar Contacto' : 'Nuevo Contacto'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right text-[#94A3B8]">Nombre</Label>
            <Input 
               id="name" 
               value={formData.name} 
               onChange={e => setFormData({...formData, name: e.target.value})}
               className="col-span-3 bg-[#0F1117] border-[#1E2235] text-white" 
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right text-[#94A3B8]">Teléfono*</Label>
            <Input 
               id="phone" 
               value={formData.phone} 
               onChange={e => setFormData({...formData, phone: e.target.value})}
               placeholder="+569..." 
               className="col-span-3 bg-[#0F1117] border-[#1E2235] text-white" 
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
             <Label htmlFor="status" className="text-right text-[#94A3B8]">Estado</Label>
             <Select 
                value={formData.status} 
                onValueChange={val => setFormData({...formData, status: val})}
             >
                <SelectTrigger className="col-span-3 bg-[#0F1117] border-[#1E2235] text-white">
                   <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1D27] border-[#2A2F45] text-white">
                   <SelectItem value="new">Nuevo</SelectItem>
                   <SelectItem value="contacted">Contactado</SelectItem>
                   <SelectItem value="responded">Respondió</SelectItem>
                   <SelectItem value="converted">Convertido</SelectItem>
                   <SelectItem value="lost">Perdido</SelectItem>
                </SelectContent>
             </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tags" className="text-right text-[#94A3B8]">Etiquetas</Label>
            <div className="col-span-3 space-y-2">
               <Input 
                  id="tags" 
                  value={formData.newTag} 
                  onChange={e => setFormData({...formData, newTag: e.target.value})}
                  onKeyDown={addTag}
                  placeholder="Escribe y presiona Enter" 
                  className="bg-[#0F1117] border-[#1E2235] text-white" 
               />
               <div className="flex flex-wrap gap-1">
                  {formData.tags.map(tag => (
                     <Badge key={tag} variant="secondary" className="bg-[#1E2235] text-[#94A3B8] hover:bg-[#2A2F45] gap-1 pr-1">
                        {tag}
                        <X 
                           className="w-3 h-3 cursor-pointer hover:text-white" 
                           onClick={() => removeTag(tag)}
                        />
                     </Badge>
                  ))}
               </div>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right text-[#94A3B8]">Email</Label>
            <Input 
               id="email" 
               value={formData.email} 
               onChange={e => setFormData({...formData, email: e.target.value})}
               className="col-span-3 bg-[#0F1117] border-[#1E2235] text-white" 
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="company" className="text-right text-[#94A3B8]">Empresa</Label>
            <Input 
               id="company" 
               value={formData.company} 
               onChange={e => setFormData({...formData, company: e.target.value})}
               className="col-span-3 bg-[#0F1117] border-[#1E2235] text-white" 
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="notes" className="text-right text-[#94A3B8] mt-2">Notas</Label>
            <Textarea 
               id="notes" 
               value={formData.notes} 
               onChange={e => setFormData({...formData, notes: e.target.value})}
               className="col-span-3 bg-[#0F1117] border-[#1E2235] text-white resize-none" 
               rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-[#1E2235] text-white hover:bg-[#2A2F45]">Cancelar</Button>
           <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-500 hover:bg-emerald-600 text-white">
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {contact ? 'Guardar Cambios' : 'Crear Contacto'}
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
