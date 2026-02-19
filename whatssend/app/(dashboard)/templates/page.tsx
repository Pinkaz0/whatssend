'use client'

import { useState } from 'react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate } from '@/hooks/useTemplates'
import { TemplateModal } from '@/components/templates/TemplateModal'
import { TemplateCard } from '@/components/templates/TemplateCard'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import type { Template, TemplateCategory } from '@/types/template'
import { FileText, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function TemplatesPage() {
  const { workspaceId, isLoading: wsLoading } = useWorkspace()
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [showModal, setShowModal] = useState(false)

  const {
    data: templates = [],
    isLoading,
  } = useTemplates(workspaceId, categoryFilter || undefined)

  const createTemplate = useCreateTemplate()
  const updateTemplate = useUpdateTemplate()
  const deleteTemplate = useDeleteTemplate()

  const handleSave = async (data: { name: string; body: string; category: TemplateCategory }) => {
    if (!workspaceId) return

    try {
      if (editingTemplate) {
        await updateTemplate.mutateAsync({ id: editingTemplate.id, ...data })
        toast.success('Plantilla actualizada')
      } else {
        await createTemplate.mutateAsync({ workspace_id: workspaceId, ...data })
        toast.success('Plantilla creada')
      }
      setShowModal(false)
      setEditingTemplate(null)
    } catch {
      toast.error('Error al guardar plantilla')
    }
  }

  const handleEdit = (template: Template) => {
    setEditingTemplate(template)
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteTemplate.mutateAsync(id)
      toast.success('Plantilla eliminada')
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const handleCopy = (body: string) => {
    navigator.clipboard.writeText(body)
    toast.success('Texto copiado')
  }

  const handleNew = () => {
    setEditingTemplate(null)
    setShowModal(true)
  }

  if (wsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-400" />
            Plantillas
          </h1>
          <p className="text-[#64748B] text-sm mt-1">
            {templates.length} plantilla{templates.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          onClick={handleNew}
          className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Plantilla
        </Button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select
          value={categoryFilter || '_all'}
          onValueChange={(val) => setCategoryFilter(val === '_all' ? '' : val)}
        >
          <SelectTrigger className="w-[180px] bg-[#1A1D27] border-[#1E2235] text-white h-9 text-sm">
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent className="bg-[#1A1D27] border-[#2A2F45]">
            <SelectItem value="_all" className="text-[#94A3B8]">Todas</SelectItem>
            <SelectItem value="sales" className="text-white">💰 Ventas</SelectItem>
            <SelectItem value="followup" className="text-white">🔄 Seguimiento</SelectItem>
            <SelectItem value="welcome" className="text-white">👋 Bienvenida</SelectItem>
            <SelectItem value="custom" className="text-white">✏️ Personalizada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Templates grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 bg-[#1E2235] rounded-xl" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-[#1A1D27] flex items-center justify-center mb-6">
            <FileText className="w-9 h-9 text-[#475569]" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No hay plantillas</h3>
          <p className="text-sm text-[#64748B] max-w-xs mb-4">
            Crea plantillas de mensajes para agilizar tu comunicación con clientes.
          </p>
          <Button
            onClick={handleNew}
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear primera plantilla
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tpl) => (
            <TemplateCard
              key={tpl.id}
              template={tpl}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onCopy={handleCopy}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <TemplateModal
        open={showModal}
        onOpenChange={setShowModal}
        template={editingTemplate}
        onSave={handleSave}
        saving={createTemplate.isPending || updateTemplate.isPending}
      />
    </div>
  )
}
