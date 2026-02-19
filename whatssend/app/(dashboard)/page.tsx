'use client'

import { useWorkspace } from '@/hooks/useWorkspace'
import { useAnalytics } from '@/hooks/useAnalytics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { MessageSquare, TrendingUp, Users, Megaphone, ArrowUpRight, Send, Kanban, BarChart3 } from 'lucide-react'
import Link from 'next/link'

function QuickAction({
  icon: Icon,
  title,
  description,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 p-3 rounded-lg hover:bg-[#0F1117] border border-transparent hover:border-[#1E2235] transition-all duration-200 group"
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="text-xs text-[#64748B] truncate">{description}</p>
      </div>
      <ArrowUpRight className="w-4 h-4 text-[#475569] group-hover:text-emerald-400 transition-colors" />
    </Link>
  )
}

export default function DashboardPage() {
  const { workspaceId, isLoading: wsLoading } = useWorkspace()
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics(workspaceId)

  const loading = wsLoading || analyticsLoading

  const stats = [
    {
      title: 'Mensajes Enviados',
      value: analytics?.outboundMessages ?? 0,
      description: 'Total',
      icon: MessageSquare,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      title: 'Tasa de Respuesta',
      value: analytics?.totalMessages
        ? `${Math.round((analytics.inboundMessages / analytics.totalMessages) * 100)}%`
        : '0%',
      description: 'Recibidos / Total',
      icon: TrendingUp,
      color: 'from-blue-500 to-cyan-600',
    },
    {
      title: 'Contactos',
      value: analytics?.totalContacts ?? 0,
      description: 'Total registrados',
      icon: Users,
      color: 'from-violet-500 to-purple-600',
    },
    {
      title: 'Campañas',
      value: analytics?.totalCampaigns ?? 0,
      description: 'Total',
      icon: Megaphone,
      color: 'from-orange-500 to-amber-600',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Panel de Control</h1>
        <p className="text-[#64748B] mt-1">
          Resumen general de tu actividad en WhatsSend
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className="bg-[#1A1D27] border-[#1E2235] hover:border-[#2A2F45] transition-all duration-200 group"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-[#64748B]">
                {stat.title}
              </CardTitle>
              <div className={`flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br ${stat.color} shadow-lg opacity-80 group-hover:opacity-100 transition-opacity`}>
                <stat.icon className="w-4 h-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16 bg-[#1E2235]" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <p className="text-xs text-[#475569] mt-1">{stat.description}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#1A1D27] border-[#1E2235]">
          <CardHeader>
            <CardTitle className="text-white text-lg">Comienza Aquí</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <QuickAction
              icon={Users}
              title="Importar Contactos"
              description="Sube tu lista de contactos desde Excel o Google Sheets"
              href="/contacts"
            />
            <QuickAction
              icon={Send}
              title="Crear Campaña"
              description="Configura y envía mensajes masivos a tus contactos"
              href="/campaigns"
            />
            <QuickAction
              icon={MessageSquare}
              title="Revisar Bandeja"
              description="Revisa y responde conversaciones pendientes"
              href="/inbox"
            />
            <QuickAction
              icon={Kanban}
              title="Pipeline de Ventas"
              description="Gestiona tus leads y oportunidades de venta"
              href="/pipeline"
            />
            <QuickAction
              icon={BarChart3}
              title="Ver Analíticas"
              description="Revisa las métricas y rendimiento de tus campañas"
              href="/analytics"
            />
          </CardContent>
        </Card>

        {/* Activity */}
        <Card className="bg-[#1A1D27] border-[#1E2235]">
          <CardHeader>
            <CardTitle className="text-white text-lg">Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 bg-[#1E2235] rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-16 h-16 rounded-full bg-[#0F1117] flex items-center justify-center mb-4">
                  <MessageSquare className="w-7 h-7 text-[#475569]" />
                </div>
                <p className="text-[#64748B] text-sm">
                  Tu actividad aparecerá aquí
                </p>
                <p className="text-[#475569] text-xs mt-1">
                  Comienza a usar WhatsSend para ver tu actividad
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
