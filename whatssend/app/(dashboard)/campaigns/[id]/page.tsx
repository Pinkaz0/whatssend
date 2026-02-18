'use client'

import { use } from 'react'
import { useCampaignDetail, useSendCampaign } from '@/hooks/useCampaigns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPhoneDisplay } from '@/lib/utils/phone'
import {
  ArrowLeft,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: campaignId } = use(params)
  const { campaign: campaignQuery, contacts: contactsQuery } = useCampaignDetail(campaignId)
  const sendCampaign = useSendCampaign()

  const campaign = campaignQuery.data
  const contacts = contactsQuery.data || []

  const sentCount = contacts.filter(c => c.status === 'sent').length
  const failedCount = contacts.filter(c => c.status === 'failed').length
  const pendingCount = contacts.filter(c => c.status === 'pending').length
  const progress = contacts.length > 0 ? Math.round((sentCount / contacts.length) * 100) : 0

  const handleSend = async () => {
    try {
      const result = await sendCampaign.mutateAsync(campaignId)
      toast.success(`Enviados: ${result.sent}, Fallidos: ${result.failed}`)
    } catch (err) {
      toast.error('Error', { description: err instanceof Error ? err.message : undefined })
    }
  }

  if (campaignQuery.isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-8 w-48 bg-[#1E2235]" />
        <Skeleton className="h-64 bg-[#1E2235] rounded-xl" />
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="text-center py-20">
        <p className="text-[#64748B]">Campaña no encontrada</p>
        <Link href="/campaigns" className="text-emerald-400 text-sm mt-2 inline-block">Volver</Link>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-500/20 text-gray-400',
    sending: 'bg-yellow-500/20 text-yellow-400',
    completed: 'bg-emerald-500/20 text-emerald-400',
    failed: 'bg-red-500/20 text-red-400',
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/campaigns"
          className="flex items-center justify-center w-9 h-9 rounded-lg text-[#64748B] hover:text-white hover:bg-[#1A1D27] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">{campaign.name}</h1>
          <Badge className={`mt-1 text-[10px] ${statusColors[campaign.status]}`}>
            {campaign.status}
          </Badge>
        </div>
        {campaign.status === 'draft' && (
          <Button
            onClick={handleSend}
            disabled={sendCampaign.isPending}
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            {sendCampaign.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Enviar Campaña
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-[#1A1D27] border-[#1E2235]">
          <CardContent className="p-4 text-center">
            <Users className="w-5 h-5 text-[#64748B] mx-auto mb-1" />
            <p className="text-2xl font-bold text-white">{contacts.length}</p>
            <p className="text-[10px] text-[#475569]">Total</p>
          </CardContent>
        </Card>
        <Card className="bg-[#1A1D27] border-[#1E2235]">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-emerald-400">{sentCount}</p>
            <p className="text-[10px] text-[#475569]">Enviados</p>
          </CardContent>
        </Card>
        <Card className="bg-[#1A1D27] border-[#1E2235]">
          <CardContent className="p-4 text-center">
            <XCircle className="w-5 h-5 text-red-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-red-400">{failedCount}</p>
            <p className="text-[10px] text-[#475569]">Fallidos</p>
          </CardContent>
        </Card>
        <Card className="bg-[#1A1D27] border-[#1E2235]">
          <CardContent className="p-4 text-center">
            <Clock className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-yellow-400">{pendingCount}</p>
            <p className="text-[10px] text-[#475569]">Pendientes</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress bar */}
      {campaign.status !== 'draft' && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#64748B]">Progreso</span>
            <span className="text-white font-mono">{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-[#1E2235] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Message */}
      <Card className="bg-[#1A1D27] border-[#1E2235]">
        <CardHeader>
          <CardTitle className="text-white text-base">Mensaje</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#94A3B8] whitespace-pre-wrap font-mono leading-relaxed">
            {campaign.message_body}
          </p>
        </CardContent>
      </Card>

      {/* Contacts table */}
      <Card className="bg-[#1A1D27] border-[#1E2235]">
        <CardHeader>
          <CardTitle className="text-white text-base">Contactos ({contacts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {contactsQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 bg-[#1E2235] rounded" />
              ))}
            </div>
          ) : (
            <div className="border border-[#1E2235] rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1E2235] bg-[#0F1117]">
                    <th className="px-4 py-2 text-left text-xs text-[#64748B] font-medium">Contacto</th>
                    <th className="px-4 py-2 text-left text-xs text-[#64748B] font-medium">Teléfono</th>
                    <th className="px-4 py-2 text-left text-xs text-[#64748B] font-medium">Estado</th>
                    <th className="px-4 py-2 text-left text-xs text-[#64748B] font-medium">Enviado</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map(cc => (
                    <tr key={cc.id} className="border-b border-[#1E2235]/50">
                      <td className="px-4 py-2 text-white">{cc.contact_name || '—'}</td>
                      <td className="px-4 py-2 text-[#94A3B8] font-mono text-xs">
                        {cc.contact_phone ? formatPhoneDisplay(cc.contact_phone) : '—'}
                      </td>
                      <td className="px-4 py-2">
                        <Badge className={`text-[10px] ${
                          cc.status === 'sent' ? 'bg-emerald-500/20 text-emerald-400' :
                          cc.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {cc.status === 'sent' ? 'Enviado' : cc.status === 'failed' ? 'Fallido' : 'Pendiente'}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-xs text-[#475569]">
                        {cc.sent_at
                          ? new Date(cc.sent_at).toLocaleString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
