import type { BotRule } from '@/types/bot-rule'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Pencil, Trash2 } from 'lucide-react'

const matchLabels: Record<string, string> = {
  exact: 'Exacta',
  contains: 'Contiene',
  starts_with: 'Empieza con',
}

interface BotRuleCardProps {
  rule: BotRule
  onEdit: (rule: BotRule) => void
  onDelete: (id: string) => void
  onToggle: (id: string, active: boolean) => void
}

export function BotRuleCard({ rule, onEdit, onDelete, onToggle }: BotRuleCardProps) {
  return (
    <Card className={`border-[#1E2235] transition-colors ${rule.is_active ? 'bg-[#1A1D27]' : 'bg-[#1A1D27]/50 opacity-60'}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-2">
            {/* Keyword + match type */}
            <div className="flex items-center gap-2 flex-wrap">
              <code className="text-sm font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                &quot;{rule.trigger_keyword}&quot;
              </code>
              <Badge variant="outline" className="text-[10px] border-[#2A2F45] text-[#64748B]">
                {matchLabels[rule.match_type] || rule.match_type}
              </Badge>
              <Badge variant="outline" className="text-[10px] border-[#2A2F45] text-[#475569]">
                P:{rule.priority}
              </Badge>
            </div>

            {/* Response */}
            <p className="text-xs text-[#94A3B8] line-clamp-2 whitespace-pre-wrap">
              → {rule.response_body}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Switch
              checked={rule.is_active}
              onCheckedChange={(checked) => onToggle(rule.id, checked)}
              className="data-[state=checked]:bg-emerald-500"
            />
            <Button variant="ghost" size="icon" onClick={() => onEdit(rule)} className="w-7 h-7 text-[#475569] hover:text-white">
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(rule.id)} className="w-7 h-7 text-[#475569] hover:text-red-400">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
