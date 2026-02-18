'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCampaigns, useSendCampaign } from '@/hooks/useCampaigns'
import { CampaignCard } from '@/components/campaigns/CampaignCard'
import { CreateCampaignModal } from '@/components/campaigns/CreateCampaignModal'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Megaphone, Plus } from 'lucide-react'
import { toast } from 'sonner'

export default function CampaignsPage() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: ws } = await supabase.from('workspaces').select('id').eq('owner_id', user.id).limit(1).maybeSingle()
      setWorkspaceId(ws?.id || null)
    }
    load()
  }, [])

  const { data: campaigns = [], isLoading } = useCampaigns(workspaceId)
  const sendCampaign = useSendCampaign()

  const handleSend = async (id: string) => {
    try {
      const result = await sendCampaign.mutateAsync(id)
      toast.success(`Campaña enviada: ${result.sent} mensajes`)
    } catch (err) {
      toast.error('Error al enviar', { description: err instanceof Error ? err.message : undefined })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-emerald-400" />
            Campañas
          </h1>
          <p className="text-[#64748B] text-sm mt-1">
            {campaigns.length} campaña{campaigns.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Campaña
        </Button>
      </div>

      {/* Grid */}
      {isLoading ? (
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
              sending={sendCampaign.isPending}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {workspaceId && (
        <CreateCampaignModal
          open={createOpen}
          onOpenChange={setCreateOpen}
          workspaceId={workspaceId}
        />
      )}
    </div>
  )
}
