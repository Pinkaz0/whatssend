'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TemplateEditor } from './TemplateEditor'
import type { Template, TemplateCategory } from '@/types/template'

interface TemplateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template?: Template | null
  onSave: (data: { name: string; body: string; category: TemplateCategory }) => Promise<void>
  saving: boolean
}

export function TemplateModal({ open, onOpenChange, template, onSave, saving }: TemplateModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1A1D27] border-[#1E2235] text-white sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{template ? 'Editar Plantilla' : 'Nueva Plantilla'}</DialogTitle>
        </DialogHeader>
        <TemplateEditor 
           template={template} 
           onSave={onSave} 
           onCancel={() => onOpenChange(false)} 
           saving={saving}
        />
      </DialogContent>
    </Dialog>
  )
}
