'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useBotRules, useCreateBotRule, useUpdateBotRule, useDeleteBotRule } from '@/hooks/useBotRules'
import { BotRuleEditor } from '@/components/bot/BotRuleEditor'
import { BotRuleCard } from '@/components/bot/BotRuleCard'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { BotRule, MatchType } from '@/types/bot-rule'
import { Bot, Plus } from 'lucide-react'
import { toast } from 'sonner'

export default function BotPage() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [editingRule, setEditingRule] = useState<BotRule | null>(null)
  const [showEditor, setShowEditor] = useState(false)

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

  const { data: rules = [], isLoading } = useBotRules(workspaceId)
  const createRule = useCreateBotRule()
  const updateRule = useUpdateBotRule()
  const deleteRule = useDeleteBotRule()

  const handleSave = async (data: { trigger_keyword: string; match_type: MatchType; response_body: string; priority: number }) => {
    if (!workspaceId) return
    try {
      if (editingRule) {
        await updateRule.mutateAsync({ id: editingRule.id, ...data })
        toast.success('Regla actualizada')
      } else {
        await createRule.mutateAsync({ workspace_id: workspaceId, ...data })
        toast.success('Regla creada')
      }
      setShowEditor(false)
      setEditingRule(null)
    } catch {
      toast.error('Error al guardar regla')
    }
  }

  const handleToggle = async (id: string, active: boolean) => {
    try {
      await updateRule.mutateAsync({ id, is_active: active })
      toast.success(active ? 'Regla activada' : 'Regla desactivada')
    } catch {
      toast.error('Error al cambiar estado')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteRule.mutateAsync(id)
      toast.success('Regla eliminada')
    } catch {
      toast.error('Error al eliminar')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bot className="w-6 h-6 text-emerald-400" />
            Bot de Respuestas
          </h1>
          <p className="text-[#64748B] text-sm mt-1">
            {rules.filter(r => r.is_active).length} de {rules.length} regla{rules.length !== 1 ? 's' : ''} activa{rules.filter(r => r.is_active).length !== 1 ? 's' : ''}
          </p>
        </div>
        {!showEditor && (
          <Button
            onClick={() => { setEditingRule(null); setShowEditor(true) }}
            className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Regla
          </Button>
        )}
      </div>

      {/* How it works */}
      <Card className="bg-[#0F1117] border-[#1E2235]">
        <CardContent className="p-4">
          <p className="text-xs text-[#64748B] leading-relaxed">
            <span className="text-emerald-400 font-semibold">¿Cómo funciona?</span> Cuando un mensaje entrante coincide con una palabra clave,
            el bot responde automáticamente. Las reglas se evalúan por prioridad (menor número = mayor prioridad).
            Solo se activa la primera coincidencia.
          </p>
        </CardContent>
      </Card>

      {/* Editor */}
      {showEditor && (
        <Card className="bg-[#1A1D27] border-[#1E2235]">
          <CardContent className="p-5">
            <BotRuleEditor
              rule={editingRule}
              onSave={handleSave}
              onCancel={() => { setShowEditor(false); setEditingRule(null) }}
              saving={createRule.isPending || updateRule.isPending}
            />
          </CardContent>
        </Card>
      )}

      {/* Rules list */}
      {!showEditor && (
        isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 bg-[#1E2235] rounded-xl" />
            ))}
          </div>
        ) : rules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-[#1A1D27] flex items-center justify-center mb-6">
              <Bot className="w-9 h-9 text-[#475569]" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Sin reglas de bot</h3>
            <p className="text-sm text-[#64748B] max-w-xs mb-4">
              Crea reglas para que el bot responda automáticamente a palabras clave.
            </p>
            <Button
              onClick={() => { setEditingRule(null); setShowEditor(true) }}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear primera regla
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map(rule => (
              <BotRuleCard
                key={rule.id}
                rule={rule}
                onEdit={(r) => { setEditingRule(r); setShowEditor(true) }}
                onDelete={handleDelete}
                onToggle={handleToggle}
              />
            ))}
          </div>
        )
      )}
    </div>
  )
}
