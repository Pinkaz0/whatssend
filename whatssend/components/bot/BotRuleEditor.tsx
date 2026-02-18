'use client'

import { useState, useEffect } from 'react'
import type { BotRule, MatchType } from '@/types/bot-rule'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

interface BotRuleEditorProps {
  rule?: BotRule | null
  onSave: (data: { trigger_keyword: string; match_type: MatchType; response_body: string; priority: number }) => Promise<void>
  onCancel: () => void
  saving: boolean
}

const MATCH_TYPES: { value: MatchType; label: string; description: string }[] = [
  { value: 'exact', label: 'Exacta', description: 'El mensaje debe ser exactamente la keyword' },
  { value: 'contains', label: 'Contiene', description: 'El mensaje contiene la keyword' },
  { value: 'starts_with', label: 'Empieza con', description: 'El mensaje empieza con la keyword' },
]

export function BotRuleEditor({ rule, onSave, onCancel, saving }: BotRuleEditorProps) {
  const [keyword, setKeyword] = useState('')
  const [matchType, setMatchType] = useState<MatchType>('contains')
  const [response, setResponse] = useState('')
  const [priority, setPriority] = useState(10)

  useEffect(() => {
    if (rule) {
      setKeyword(rule.trigger_keyword)
      setMatchType(rule.match_type)
      setResponse(rule.response_body)
      setPriority(rule.priority)
    } else {
      setKeyword('')
      setMatchType('contains')
      setResponse('')
      setPriority(10)
    }
  }, [rule])

  const handleSubmit = async () => {
    if (!keyword.trim() || !response.trim()) return
    await onSave({
      trigger_keyword: keyword.trim().toLowerCase(),
      match_type: matchType,
      response_body: response.trim(),
      priority,
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-[#94A3B8] text-xs">Palabra clave</Label>
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder='Ej: "precio", "hola", "info"'
            className="bg-[#0F1117] border-[#2A2F45] text-white h-9 text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[#94A3B8] text-xs">Tipo de coincidencia</Label>
          <Select value={matchType} onValueChange={(v) => setMatchType(v as MatchType)}>
            <SelectTrigger className="bg-[#0F1117] border-[#2A2F45] text-white h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1D27] border-[#2A2F45]">
              {MATCH_TYPES.map(mt => (
                <SelectItem key={mt.value} value={mt.value} className="text-white">
                  <div>
                    <span className="font-medium">{mt.label}</span>
                    <span className="text-[#475569] ml-1.5 text-xs">— {mt.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[#94A3B8] text-xs">Respuesta automática</Label>
        <Textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          placeholder="Hola! Gracias por contactarnos..."
          className="bg-[#0F1117] border-[#2A2F45] text-white text-sm min-h-[80px] resize-none"
        />
      </div>

      <div className="space-y-2 max-w-[120px]">
        <Label className="text-[#94A3B8] text-xs">Prioridad</Label>
        <Input
          type="number"
          value={priority}
          onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
          min={0}
          max={100}
          className="bg-[#0F1117] border-[#2A2F45] text-white h-9 text-sm"
        />
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button variant="outline" onClick={onCancel} className="border-[#2A2F45] text-[#94A3B8] hover:text-white hover:bg-[#0F1117]">
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!keyword.trim() || !response.trim() || saving}
          className="bg-emerald-500 hover:bg-emerald-600 text-white"
        >
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          {rule ? 'Actualizar' : 'Crear Regla'}
        </Button>
      </div>
    </div>
  )
}
