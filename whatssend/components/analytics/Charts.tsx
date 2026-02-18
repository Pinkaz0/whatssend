'use client'

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const STATUS_COLORS: Record<string, string> = {
  new: '#3B82F6',
  contacted: '#F59E0B',
  responded: '#10B981',
  converted: '#8B5CF6',
  lost: '#EF4444',
}

const STATUS_LABELS: Record<string, string> = {
  new: 'Nuevo',
  contacted: 'Contactado',
  responded: 'Respondió',
  converted: 'Convertido',
  lost: 'Perdido',
}

interface MessageChartProps {
  data: { date: string; inbound: number; outbound: number }[]
}

export function MessageChart({ data }: MessageChartProps) {
  const formatted = data.map(d => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }),
  }))

  return (
    <Card className="bg-[#1A1D27] border-[#1E2235]">
      <CardHeader>
        <CardTitle className="text-white text-base">Mensajes (14 días)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={formatted}>
            <defs>
              <linearGradient id="gradIn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradOut" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2235" />
            <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={{ stroke: '#1E2235' }} />
            <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={{ stroke: '#1E2235' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1A1D27', border: '1px solid #2A2F45', borderRadius: '8px', color: '#F1F5F9', fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: '#94A3B8' }} />
            <Area type="monotone" dataKey="inbound" name="Recibidos" stroke="#10B981" fill="url(#gradIn)" strokeWidth={2} />
            <Area type="monotone" dataKey="outbound" name="Enviados" stroke="#3B82F6" fill="url(#gradOut)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

interface ContactGrowthChartProps {
  data: { date: string; count: number }[]
}

export function ContactGrowthChart({ data }: ContactGrowthChartProps) {
  const formatted = data.map(d => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }),
  }))

  return (
    <Card className="bg-[#1A1D27] border-[#1E2235]">
      <CardHeader>
        <CardTitle className="text-white text-base">Crecimiento de Contactos</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={formatted}>
            <defs>
              <linearGradient id="gradGrowth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2235" />
            <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={{ stroke: '#1E2235' }} />
            <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={{ stroke: '#1E2235' }} />
            <Tooltip contentStyle={{ backgroundColor: '#1A1D27', border: '1px solid #2A2F45', borderRadius: '8px', color: '#F1F5F9', fontSize: 12 }} />
            <Area type="monotone" dataKey="count" name="Contactos" stroke="#8B5CF6" fill="url(#gradGrowth)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

interface StatusPieChartProps {
  data: { status: string; count: number }[]
}

export function StatusPieChart({ data }: StatusPieChartProps) {
  const formatted = data.map(d => ({
    ...d,
    label: STATUS_LABELS[d.status] || d.status,
  }))

  return (
    <Card className="bg-[#1A1D27] border-[#1E2235]">
      <CardHeader>
        <CardTitle className="text-white text-base">Contactos por Estado</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={formatted}
              dataKey="count"
              nameKey="label"
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={55}
              paddingAngle={3}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              label={((props: any) => `${props.name}: ${props.value}`) as any}
              labelLine={{ stroke: '#475569' }}
            >
              {formatted.map((entry, i) => (
                <Cell key={i} fill={STATUS_COLORS[entry.status] || '#475569'} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: '#1A1D27', border: '1px solid #2A2F45', borderRadius: '8px', color: '#F1F5F9', fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
