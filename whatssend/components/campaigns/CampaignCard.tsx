import { useState } from 'react'
import type { Campaign } from '@/types/campaign'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Users, Send, Eye, Clock, CheckCircle, XCircle, Loader2, Trash2 } from 'lucide-react'
import Link from 'next/link'

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: 'Borrador', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: <Clock className="w-3 h-3" /> },
  sending: { label: 'Enviando', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
  completed: { label: 'Completada', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: <CheckCircle className="w-3 h-3" /> },
  failed: { label: 'Fallida', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: <XCircle className="w-3 h-3" /> },
}

interface CampaignCardProps {
  campaign: Campaign
  onSend?: (id: string) => void
  onDelete?: (id: string) => void
  sending?: boolean
}

export function CampaignCard({ campaign, onSend, onDelete, sending }: CampaignCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const status = statusConfig[campaign.status] || statusConfig.draft

  return (
    <>
      <Card className="bg-[#1A1D27] border-[#1E2235] hover:border-[#2A2F45] transition-colors">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-white truncate">{campaign.name}</h3>
              <Badge variant="outline" className={`mt-1 text-[10px] ${status.color}`}>
                <span className="mr-1">{status.icon}</span>
                {status.label}
              </Badge>
            </div>
          </div>

          <p className="text-xs text-[#94A3B8] line-clamp-2 whitespace-pre-wrap">
            {campaign.message_body || 'Sin mensaje'}
          </p>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-[#475569]">
              {new Date(campaign.created_at).toLocaleDateString('es-CL', {
                day: '2-digit', month: 'short',
              })}
            </span>
            <div className="flex gap-1.5">
              <Link href={`/campaigns/${campaign.id}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs border-[#2A2F45] text-[#94A3B8] hover:text-white hover:bg-[#0F1117]"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Ver
                </Button>
              </Link>
              {campaign.status === 'draft' && onSend && (
                <Button
                  size="sm"
                  onClick={() => onSend(campaign.id)}
                  disabled={sending}
                  className="h-7 text-xs bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  {sending ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Send className="w-3 h-3 mr-1" />
                  )}
                  Enviar
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteOpen(true)}
                  className="h-7 text-xs border-[#2A2F45] text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-500/50"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-[#1A1D27] border-[#1E2235] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar campaña</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Eliminar &quot;{campaign.name}&quot;? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#2A2F45] text-[#94A3B8]">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete?.(campaign.id)
                setDeleteOpen(false)
              }}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
