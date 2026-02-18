'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate } from '@/hooks/useTemplates'
import { TemplateEditor } from '@/components/templates/TemplateEditor'
import { TemplateCard } from '@/components/templates/TemplateCard'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { Template, TemplateCategory } from '@/types/template'
import { FileText, Plus } from 'lucide-react'
import { toast } from 'sonner'

export default function TemplatesPage() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [showEditor, setShowEditor] = useState(false)

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
      setShowEditor(false)
      setEditingTemplate(null)
    } catch {
      toast.error('Error al guardar plantilla')
    }
  }

  const handleEdit = (template: Template) => {
    setEditingTemplate(template)
    setShowEditor(true)
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
    setShowEditor(true)
  }

  const handleCancel = () => {
    setShowEditor(false)
    setEditingTemplate(null)
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
        {!showEditor && (
          <Button
            onClick={handleNew}
            className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Plantilla
          </Button>
        )}
      </div>

      {/* Editor (shown when creating/editing) */}
      {showEditor && (
        <Card className="bg-[#1A1D27] border-[#1E2235]">
          <CardContent className="p-5">
            <TemplateEditor
              template={editingTemplate}
              onSave={handleSave}
              onCancel={handleCancel}
              saving={createTemplate.isPending || updateTemplate.isPending}
            />
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      {!showEditor && (
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
      )}

      {/* Templates grid */}
      {!showEditor && (
        isLoading ? (
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
        )
      )}
    </div>
  )
}
