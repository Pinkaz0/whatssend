'use client'

import { useWorkspace } from '@/hooks/useWorkspace'
import { useAnalytics } from '@/hooks/useAnalytics'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Activity, MessageSquare, Users, AlertTriangle,
  TrendingUp, ChevronRight, ArrowUpRight
} from 'lucide-react'
import { useRouter } from 'next/navigation'

// ─── StatCard v5 ───────────────────────────────────────────────────────────────
function StatCard({
  title, value, sub, icon: Icon, accent, trend, loading
}: {
  title: string
  value: string | number
  sub: string
  icon: React.ComponentType<{ style?: React.CSSProperties }>
  accent: string
  trend?: string
  loading?: boolean
}) {
  return (
    <div
      className="rounded-xl p-4 border relative overflow-hidden group hover:border-white/10 transition-all duration-200"
      style={{ background: '#0C0F1A', borderColor: '#141928' }}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `radial-gradient(ellipse at 100% 0%, ${accent}08 0%, transparent 60%)` }}
      />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <span className="text-[#64748B] text-xs font-medium">{title}</span>
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: `${accent}18` }}
          >
            <Icon style={{ width: 13, height: 13, color: accent }} />
          </div>
        </div>
        {loading ? (
          <Skeleton className="h-8 w-16 bg-[#1E2235]" />
        ) : (
          <>
            <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
            <p className="text-[#475569] text-xs mt-1">{sub}</p>
            {trend && (
              <span className="text-xs text-emerald-400 font-medium mt-1.5 flex items-center gap-0.5">
                <TrendingUp style={{ width: 10, height: 10 }} /> {trend}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Sales Status Bar ──────────────────────────────────────────────────────────
function StatusBar({ label, count, color, pct }: { label: string; count: number; color: string; pct: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[#64748B] text-xs w-24 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1 rounded-full" style={{ background: '#141928' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-[#94A3B8] text-xs font-bold w-3">{count}</span>
    </div>
  )
}

// ─── Dashboard Page ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter()
  const { workspaceId, isLoading: wsLoading } = useWorkspace()
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics(workspaceId)

  const loading = wsLoading || analyticsLoading

  // Greeting based on time of day
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'
  const dateStr = new Date().toLocaleDateString('es-CL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  // Mock sales status data (will connect to real data in backend stage)
  const salesStatus = [
    { label: 'Agendada', count: 1, color: '#38bdf8', pct: 20 },
    { label: 'En Proceso', count: 1, color: '#fbbf24', pct: 20 },
    { label: 'Completada', count: 1, color: '#10b981', pct: 20 },
    { label: 'No Realizada', count: 1, color: '#f43f5e', pct: 20 },
    { label: 'Pendiente', count: 1, color: '#64748b', pct: 20 },
  ]

  // Mock alerts (will connect to real data in backend stage)
  const alerts = [
    {
      color: '#f43f5e',
      title: 'Ana Martínez — No Realizada',
      desc: 'Sin acceso al edificio · Pendiente reagendar con Backoffice Agenda',
      action: '/ventas'
    },
    {
      color: '#fbbf24',
      title: 'Carmen López — Esperando código BO',
      desc: 'Biometría OK · Monitorear código en Excel de ingreso',
      action: '/ventas'
    },
    {
      color: '#38bdf8',
      title: '6 mensajes sin responder',
      desc: 'Carmen (3), María (2), Juan (1) · Bandeja de entrada',
      action: '/inbox'
    },
  ]

  return (
    <div className="p-6 h-full overflow-auto space-y-5">
      {/* Greeting */}
      <div>
        <h2 className="text-white font-semibold text-base">
          {greeting} 👋
        </h2>
        <p className="text-[#475569] text-xs mt-0.5">
          Resumen de hoy · {dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Ventas en Seguimiento"
          value={analytics?.totalCampaigns ?? 0}
          sub="órdenes activas"
          icon={Activity}
          accent="#10b981"
          trend="+2 esta semana"
          loading={loading}
        />
        <StatCard
          title="Mensajes Hoy"
          value={analytics?.outboundMessages ?? 0}
          sub="enviados / recibidos"
          icon={MessageSquare}
          accent="#38bdf8"
          loading={loading}
        />
        <StatCard
          title="Contactos"
          value={analytics?.totalContacts ?? 0}
          sub="total en CRM"
          icon={Users}
          accent="#a78bfa"
          loading={loading}
        />
        <StatCard
          title="No Realizadas"
          value={0}
          sub="requieren atención"
          icon={AlertTriangle}
          accent="#f43f5e"
          loading={loading}
        />
      </div>

      {/* Bottom Grid: Estado de Ventas + Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Estado de Ventas */}
        <div
          className="col-span-1 rounded-xl border p-4"
          style={{ background: '#0C0F1A', borderColor: '#141928' }}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-white font-semibold text-xs">Estado de Ventas</span>
            <button
              onClick={() => router.push('/ventas')}
              className="text-xs text-emerald-500 hover:text-emerald-400 flex items-center gap-0.5 transition-colors"
            >
              Ver todo <ChevronRight style={{ width: 12, height: 12 }} />
            </button>
          </div>
          <div className="space-y-3">
            {salesStatus.map((s) => (
              <StatusBar key={s.label} {...s} />
            ))}
          </div>
        </div>

        {/* Requieren Atención */}
        <div
          className="col-span-1 lg:col-span-2 rounded-xl border p-4"
          style={{ background: '#0C0F1A', borderColor: '#141928' }}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-white font-semibold text-xs">Requieren Atención</span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: '#f43f5e18', color: '#f43f5e', border: '1px solid #f43f5e20' }}
            >
              {alerts.length} alertas
            </span>
          </div>
          <div className="space-y-2.5">
            {alerts.map((a, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg p-3 border group hover:border-white/10 cursor-pointer transition-all"
                style={{ background: '#07090F', borderColor: '#141928' }}
                onClick={() => router.push(a.action)}
              >
                <div
                  className="w-1 h-full min-h-[2rem] rounded-full flex-shrink-0 mt-0.5"
                  style={{ background: a.color }}
                />
                <div className="flex-1">
                  <p className="text-white text-xs font-semibold">{a.title}</p>
                  <p className="text-[#475569] text-xs mt-0.5">{a.desc}</p>
                </div>
                <ArrowUpRight
                  style={{ width: 14, height: 14 }}
                  className="text-[#334155] group-hover:text-[#94A3B8] transition-colors flex-shrink-0 mt-0.5"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
