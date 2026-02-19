'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useWorkspace } from '@/hooks/useWorkspace'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { LeadDrawer } from '@/components/pipeline/LeadDrawer'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Phone, MapPin, Calendar, Plus, RefreshCcw, Kanban } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface PipelineLead {
  id: string
  workspace_id: string
  contact_id: string
  full_name: string | null
  status: string
  rut: string | null
  address: string | null
  comuna: string | null
  service: string | null
  promotion: string | null
  web_executive: string | null
  created_at: string
  contact?: { phone: string; name: string | null }
}

const COLUMNS = [
  { id: 'interested',    label: 'Interesado',      color: '#F59E0B', bg: 'bg-amber-500/10',   text: 'text-amber-400',   dot: 'bg-amber-500' },
  { id: 'verifying',     label: 'Verificando',     color: '#3B82F6', bg: 'bg-blue-500/10',    text: 'text-blue-400',    dot: 'bg-blue-500' },
  { id: 'data_complete', label: 'Datos Completos', color: '#10B981', bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-500' },
  { id: 'sent',          label: 'Enviada',         color: '#8B5CF6', bg: 'bg-violet-500/10',  text: 'text-violet-400',  dot: 'bg-violet-500' },
  { id: 'ingested',      label: 'Ingresada',       color: '#06B6D4', bg: 'bg-cyan-500/10',    text: 'text-cyan-400',    dot: 'bg-cyan-500' },
  { id: 'rejected',      label: 'No Ingresada',    color: '#EF4444', bg: 'bg-red-500/10',     text: 'text-red-400',     dot: 'bg-red-500' },
]

export default function PipelinePage() {
  const { workspaceId, isLoading: wsLoading } = useWorkspace()
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const [drawerMode, setDrawerMode] = useState<'edit' | 'create'>('edit')
  const queryClient = useQueryClient()

  const { data: leads = [], isLoading } = useQuery<PipelineLead[]>({
    queryKey: ['pipeline-leads', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return []
      const supabase = createClient()
      const { data, error } = await supabase
        .from('pipeline_leads')
        .select('*, contact:contacts(phone, name)')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data || []) as PipelineLead[]
    },
    enabled: !!workspaceId,
  })

  const getLeadsByStatus = useCallback(
    (status: string) => leads.filter(l => l.status === status),
    [leads]
  )

  const handleOpenCreate = () => {
    setSelectedLeadId(null)
    setDrawerMode('create')
  }

  const handleOpenLead = (id: string) => {
    setSelectedLeadId(id)
    setDrawerMode('edit')
  }

  const handleCloseDrawer = () => {
    setSelectedLeadId(null)
    setDrawerMode('edit')
    queryClient.invalidateQueries({ queryKey: ['pipeline-leads'] })
  }

  const loading = wsLoading || isLoading

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Kanban className="w-6 h-6 text-emerald-400" />
            Gestión de Ventas
          </h1>
          <p className="text-[#64748B] text-sm mt-1">
            {leads.length} lead{leads.length !== 1 ? 's' : ''} en el pipeline
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['pipeline-leads'] })}
            className="border-[#2A2F45] text-[#94A3B8] hover:text-white hover:bg-[#0F1117]"
          >
            <RefreshCcw className="w-4 h-4 mr-1" />
            Actualizar
          </Button>
          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4 mr-1" />
            Nuevo Lead
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map(col => (
            <div key={col.id} className="w-[280px] flex-shrink-0">
              <Skeleton className="h-12 bg-[#1E2235] rounded-t-xl mb-2" />
              <Skeleton className="h-32 bg-[#1E2235] rounded-b-xl" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-4 min-w-max h-[calc(100vh-200px)] pb-4">
            {COLUMNS.map(col => {
              const colLeads = getLeadsByStatus(col.id)
              return (
                <div
                  key={col.id}
                  className="w-[280px] flex-shrink-0 flex flex-col bg-[#1A1D27] border border-[#1E2235] rounded-xl overflow-hidden"
                >
                  {/* Column Header */}
                  <div className={`p-3 border-b border-[#1E2235] flex justify-between items-center ${col.bg}`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                      <h3 className={`font-semibold text-sm ${col.text}`}>{col.label}</h3>
                    </div>
                    <Badge variant="secondary" className="bg-black/20 text-white border-0 text-xs">
                      {colLeads.length}
                    </Badge>
                  </div>

                  {/* Column Content */}
                  <ScrollArea className="flex-1 p-2">
                    {colLeads.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <p className="text-xs text-[#475569]">Sin leads</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {colLeads.map(lead => (
                          <Card
                            key={lead.id}
                            onClick={() => handleOpenLead(lead.id)}
                            className="bg-[#0F1117] border-[#2A2F45] hover:border-emerald-500/50 cursor-pointer transition-all hover:shadow-lg hover:shadow-emerald-500/5 group"
                          >
                            <CardContent className="p-3 space-y-2">
                              {/* Name + Phone */}
                              <div className="flex items-center gap-2">
                                <Avatar className="h-7 w-7 bg-emerald-500/20 text-emerald-500">
                                  <AvatarFallback className="text-[10px]">
                                    {(lead.full_name || lead.contact?.name || 'CN').substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="overflow-hidden flex-1">
                                  <p className="text-sm font-medium text-white truncate">
                                    {lead.full_name || lead.contact?.name || 'Sin Nombre'}
                                  </p>
                                  <p className="text-[10px] text-[#64748B] flex items-center gap-1">
                                    <Phone className="w-2.5 h-2.5" />
                                    {lead.contact?.phone || '—'}
                                  </p>
                                </div>
                              </div>

                              {/* Extra info */}
                              {(lead.rut || lead.comuna || lead.service) && (
                                <div className="text-[10px] text-[#94A3B8] bg-[#1A1D27] p-1.5 rounded space-y-0.5">
                                  {lead.rut && <p>RUT: {lead.rut}</p>}
                                  {lead.comuna && (
                                    <p className="flex items-center gap-1">
                                      <MapPin className="w-2.5 h-2.5" /> {lead.comuna}
                                    </p>
                                  )}
                                  {lead.service && (
                                    <Badge variant="outline" className="text-[9px] h-4 border-[#2A2F45] text-emerald-400 mt-0.5">
                                      {lead.service}
                                    </Badge>
                                  )}
                                </div>
                              )}

                              {/* Date */}
                              <div className="flex items-center justify-between text-[10px] text-[#475569] pt-0.5">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-2.5 h-2.5" />
                                  {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true, locale: es })}
                                </span>
                                {lead.web_executive && (
                                  <span className="text-[#64748B] truncate max-w-[80px]">{lead.web_executive}</span>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Lead Drawer */}
      <LeadDrawer
        leadId={selectedLeadId}
        open={!!selectedLeadId || drawerMode === 'create'}
        onClose={handleCloseDrawer}
        mode={drawerMode}
        workspaceId={workspaceId}
      />
    </div>
  )
}
