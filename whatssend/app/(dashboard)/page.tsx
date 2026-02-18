import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, TrendingUp, Users, Megaphone, ArrowUpRight, Send } from 'lucide-react'

const statsCards = [
  {
    title: 'Mensajes Enviados',
    value: '0',
    description: 'Este mes',
    icon: MessageSquare,
    trend: null,
    color: 'from-emerald-500 to-teal-600',
  },
  {
    title: 'Tasa de Respuesta',
    value: '0%',
    description: 'Promedio mensual',
    icon: TrendingUp,
    trend: null,
    color: 'from-blue-500 to-cyan-600',
  },
  {
    title: 'Contactos Nuevos',
    value: '0',
    description: 'Este mes',
    icon: Users,
    trend: null,
    color: 'from-violet-500 to-purple-600',
  },
  {
    title: 'Campañas Activas',
    value: '0',
    description: 'En ejecución',
    icon: Megaphone,
    trend: null,
    color: 'from-orange-500 to-amber-600',
  },
]

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-white">Panel de Control</h1>
        <p className="text-[#64748B] mt-1">
          Resumen general de tu actividad en WhatsSend
        </p>
      </div>

      {/* Tarjetas de métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
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
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <p className="text-xs text-[#475569] mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sección de inicio rápido */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Acciones rápidas */}
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
          </CardContent>
        </Card>

        {/* Actividad reciente */}
        <Card className="bg-[#1A1D27] border-[#1E2235]">
          <CardHeader>
            <CardTitle className="text-white text-lg">Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-[#0F1117] flex items-center justify-center mb-4">
                <MessageSquare className="w-7 h-7 text-[#475569]" />
              </div>
              <p className="text-[#64748B] text-sm">
                Aún no hay actividad reciente
              </p>
              <p className="text-[#475569] text-xs mt-1">
                Tu actividad aparecerá aquí una vez que comiences a usar WhatsSend
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

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
    <a
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
    </a>
  )
}
