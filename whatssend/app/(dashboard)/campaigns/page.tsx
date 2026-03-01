'use client'

import { useState } from 'react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useCampaigns, useSendCampaign, useDeleteCampaign } from '@/hooks/useCampaigns'
import { useTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate } from '@/hooks/useTemplates'
import { CampaignCard } from '@/components/campaigns/CampaignCard'
import { CreateCampaignModal } from '@/components/campaigns/CreateCampaignModal'
import { TemplateModal } from '@/components/templates/TemplateModal'
import { TemplateCard } from '@/components/templates/TemplateCard'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import type { Template, TemplateCategory } from '@/types/template'
import { Megaphone, FileText, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function CampaignsPage() {
  const { workspaceId, isLoading: wsLoading } = useWorkspace()
  const [activeTab, setActiveTab] = useState<'campaigns' | 'templates'>('campaigns')
  const [createOpen, setCreateOpen] = useState(false)

  // ── Campaigns logic ──
  const { data: campaigns = [], isLoading: loadingCampaigns } = useCampaigns(workspaceId)
  const sendCampaign = useSendCampaign()
  const deleteCampaign = useDeleteCampaign()

  const handleSend = async (id: string) => {
    try {
      const result = await sendCampaign.mutateAsync(id)
      if (result.failed > 0 && result.errors?.length) {
        toast.warning(`Enviados: ${result.sent}, Fallidos: ${result.failed}`, { description: result.errors.slice(0, 2).join(' · ') })
      } else {
        toast.success(`Enviados: ${result.sent}, Fallidos: ${result.failed}`)
      }
    } catch (err) {
      toast.error('Error al enviar', { description: err instanceof Error ? err.message : undefined })
    }
  }

  const handleDeleteCampaign = async (id: string) => {
    try {
      await deleteCampaign.mutateAsync(id)
      toast.success('Campaña eliminada')
    } catch (err) {
      toast.error('Error al eliminar', { description: err instanceof Error ? err.message : undefined })
    }
  }

  // ── Templates logic ──
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [showTemplateModal, setShowTemplateModal] = useState(false)

  const { data: templates = [], isLoading: loadingTemplates } = useTemplates(workspaceId, categoryFilter || undefined)
  const createTemplate = useCreateTemplate()
  const updateTemplate = useUpdateTemplate()
  const deleteTemplate = useDeleteTemplate()

  const handleSaveTemplate = async (data: { name: string; body: string; category: TemplateCategory }) => {
    if (!workspaceId) return
    try {
      if (editingTemplate) {
        await updateTemplate.mutateAsync({ id: editingTemplate.id, ...data })
        toast.success('Plantilla actualizada')
      } else {
        await createTemplate.mutateAsync({ workspace_id: workspaceId, ...data })
        toast.success('Plantilla creada')
      }
      setShowTemplateModal(false)
      setEditingTemplate(null)
    } catch {
      toast.error('Error al guardar plantilla')
    }
  }

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template)
    setShowTemplateModal(true)
  }

  const handleDeleteTemplate = async (id: string) => {
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

  const handleNewTemplate = () => {
    setEditingTemplate(null)
    setShowTemplateModal(true)
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
            <Megaphone className="w-6 h-6 text-emerald-400" />
            Campañas & Plantillas
          </h1>
          <p className="text-[#64748B] text-sm mt-1">
            Gestiona tus campañas y plantillas de mensajes
          </p>
        </div>
        <Button
          onClick={() => activeTab === 'campaigns' ? setCreateOpen(true) : handleNewTemplate()}
          className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          {activeTab === 'campaigns' ? 'Nueva Campaña' : 'Nueva Plantilla'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#1A1D27] p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('campaigns')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
            activeTab === 'campaigns'
              ? 'bg-emerald-500/15 text-emerald-400 shadow-sm'
              : 'text-[#64748B] hover:text-white hover:bg-[#0F1117]'
          )}
        >
          <Megaphone className="w-4 h-4" />
          Campañas
          <span className={cn(
            'text-xs px-1.5 py-0.5 rounded-full',
            activeTab === 'campaigns' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#0F1117] text-[#64748B]'
          )}>
            {campaigns.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
            activeTab === 'templates'
              ? 'bg-emerald-500/15 text-emerald-400 shadow-sm'
              : 'text-[#64748B] hover:text-white hover:bg-[#0F1117]'
          )}
        >
          <FileText className="w-4 h-4" />
          Plantillas
          <span className={cn(
            'text-xs px-1.5 py-0.5 rounded-full',
            activeTab === 'templates' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#0F1117] text-[#64748B]'
          )}>
            {templates.length}
          </span>
        </button>
      </div>

      {/* ── Campaigns Tab ── */}
      {activeTab === 'campaigns' && (
        <>
          {loadingCampaigns ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-36 bg-[#1E2235] rounded-xl" />
              ))}
            </div>
          ) : campaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-[#1A1D27] flex items-center justify-center mb-6">
                <Megaphone className="w-9 h-9 text-[#475569]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No hay campañas</h3>
              <p className="text-sm text-[#64748B] max-w-xs mb-4">
                Crea tu primera campaña para enviar mensajes masivos a tus contactos.
              </p>
              <Button onClick={() => setCreateOpen(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Crear campaña
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaigns.map(camp => (
                <CampaignCard
                  key={camp.id}
                  campaign={camp}
                  onSend={handleSend}
                  onDelete={handleDeleteCampaign}
                  sending={sendCampaign.isPending}
                />
              ))}
            </div>
          )}

          {workspaceId && (
            <CreateCampaignModal
              open={createOpen}
              onOpenChange={setCreateOpen}
              workspaceId={workspaceId}
            />
          )}
        </>
      )}

      {/* ── Templates Tab ── */}
      {activeTab === 'templates' && (
        <>
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
          {loadingTemplates ? (
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
              <Button onClick={handleNewTemplate} className="bg-emerald-500 hover:bg-emerald-600 text-white">
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
                  onEdit={handleEditTemplate}
                  onDelete={handleDeleteTemplate}
                  onCopy={handleCopy}
                />
              ))}
            </div>
          )}

          {/* Template Modal */}
          <TemplateModal
            open={showTemplateModal}
            onOpenChange={setShowTemplateModal}
            template={editingTemplate}
            onSave={handleSaveTemplate}
            saving={createTemplate.isPending || updateTemplate.isPending}
          />
        </>
      )}
    </div>
  )
}
