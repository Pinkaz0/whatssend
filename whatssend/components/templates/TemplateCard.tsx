import type { Template } from '@/types/template'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2, Copy } from 'lucide-react'

const categoryLabels: Record<string, { label: string; color: string }> = {
  sales: { label: 'Ventas', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  followup: { label: 'Seguimiento', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  welcome: { label: 'Bienvenida', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  custom: { label: 'Personalizada', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
}

interface TemplateCardProps {
  template: Template
  onEdit: (template: Template) => void
  onDelete: (id: string) => void
  onCopy: (body: string) => void
}

export function TemplateCard({ template, onEdit, onDelete, onCopy }: TemplateCardProps) {
  const cat = categoryLabels[template.category || 'custom'] || categoryLabels.custom

  return (
    <Card className="bg-[#1A1D27] border-[#1E2235] hover:border-[#2A2F45] transition-colors group">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white truncate">{template.name}</h3>
            <Badge variant="outline" className={`mt-1 text-[10px] ${cat.color}`}>
              {cat.label}
            </Badge>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onCopy(template.body)}
              className="w-7 h-7 text-[#475569] hover:text-white hover:bg-[#0F1117]"
            >
              <Copy className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(template)}
              className="w-7 h-7 text-[#475569] hover:text-white hover:bg-[#0F1117]"
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(template.id)}
              className="w-7 h-7 text-[#475569] hover:text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Body preview */}
        <p className="text-xs text-[#94A3B8] line-clamp-3 whitespace-pre-wrap leading-relaxed">
          {template.body}
        </p>

        {/* Footer */}
        <p className="text-[10px] text-[#475569]">
          {new Date(template.created_at).toLocaleDateString('es-CL', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </p>
      </CardContent>
    </Card>
  )
}
