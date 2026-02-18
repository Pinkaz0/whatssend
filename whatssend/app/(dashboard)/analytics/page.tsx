'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAnalytics } from '@/hooks/useAnalytics'
import { MessageChart, ContactGrowthChart, StatusPieChart } from '@/components/analytics/Charts'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart3,
  Users,
  MessageSquare,
  ArrowDownLeft,
  ArrowUpRight,
  Megaphone,
  Bot,
} from 'lucide-react'

function MetricCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  return (
    <Card className="bg-[#1A1D27] border-[#1E2235]">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${color}`}>
            {icon}
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-[#64748B]">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AnalyticsPage() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)

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

  const { data: analytics, isLoading } = useAnalytics(workspaceId)

  if (isLoading || !analytics) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 bg-[#1E2235]" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 bg-[#1E2235] rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 bg-[#1E2235] rounded-xl" />
          <Skeleton className="h-80 bg-[#1E2235] rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-emerald-400" />
          Analíticas
        </h1>
        <p className="text-[#64748B] text-sm mt-1">Resumen de actividad de tu workspace</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard
          icon={<Users className="w-5 h-5 text-emerald-400" />}
          label="Contactos"
          value={analytics.totalContacts}
          color="bg-emerald-500/10"
        />
        <MetricCard
          icon={<MessageSquare className="w-5 h-5 text-blue-400" />}
          label="Mensajes"
          value={analytics.totalMessages}
          color="bg-blue-500/10"
        />
        <MetricCard
          icon={<ArrowDownLeft className="w-5 h-5 text-teal-400" />}
          label="Recibidos"
          value={analytics.inboundMessages}
          color="bg-teal-500/10"
        />
        <MetricCard
          icon={<ArrowUpRight className="w-5 h-5 text-indigo-400" />}
          label="Enviados"
          value={analytics.outboundMessages}
          color="bg-indigo-500/10"
        />
        <MetricCard
          icon={<Megaphone className="w-5 h-5 text-amber-400" />}
          label="Campañas"
          value={analytics.totalCampaigns}
          color="bg-amber-500/10"
        />
        <MetricCard
          icon={<Bot className="w-5 h-5 text-purple-400" />}
          label="Reglas Bot"
          value={analytics.activeBotRules}
          color="bg-purple-500/10"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MessageChart data={analytics.messagesByDay} />
        <StatusPieChart data={analytics.contactsByStatus} />
      </div>

      <ContactGrowthChart data={analytics.contactGrowth} />
    </div>
  )
}
