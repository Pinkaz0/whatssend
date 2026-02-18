'use client'

import { useState, useEffect } from 'react'
import type { Template, TemplateCategory } from '@/types/template'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

interface TemplateEditorProps {
  template?: Template | null
  onSave: (data: { name: string; body: string; category: TemplateCategory }) => Promise<void>
  onCancel: () => void
  saving: boolean
}

const CATEGORIES: { value: TemplateCategory; label: string }[] = [
  { value: 'sales', label: '💰 Ventas' },
  { value: 'followup', label: '🔄 Seguimiento' },
  { value: 'welcome', label: '👋 Bienvenida' },
  { value: 'custom', label: '✏️ Personalizada' },
]

/**
 * Renderiza el cuerpo del template resaltando variables {{var}}.
 */
function HighlightedPreview({ body }: { body: string }) {
  if (!body) {
    return <span className="text-[#475569] italic">Vista previa aparecerá aquí...</span>
  }

  const parts = body.split(/(\{\{[^}]+\}\})/)
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('{{') && part.endsWith('}}') ? (
          <span
            key={i}
            className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-mono font-medium mx-0.5"
          >
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

export function TemplateEditor({ template, onSave, onCancel, saving }: TemplateEditorProps) {
  const [name, setName] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState<TemplateCategory>('custom')

  useEffect(() => {
    if (template) {
      setName(template.name)
      setBody(template.body)
      setCategory(template.category || 'custom')
    } else {
      setName('')
      setBody('')
      setCategory('custom')
    }
  }, [template])

  const handleSubmit = async () => {
    if (!name.trim() || !body.trim()) return
    await onSave({ name: name.trim(), body: body.trim(), category })
  }

  const charCount = body.length
  const isOverLimit = charCount > 4096

  return (
    <div className="space-y-4">
      {/* Name + Category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-[#94A3B8] text-xs">Nombre de la plantilla</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Bienvenida nuevos clientes"
            className="bg-[#0F1117] border-[#2A2F45] text-white h-9 text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[#94A3B8] text-xs">Categoría</Label>
          <Select value={category} onValueChange={(val) => setCategory(val as TemplateCategory)}>
            <SelectTrigger className="bg-[#0F1117] border-[#2A2F45] text-white h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1D27] border-[#2A2F45]">
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value} className="text-white">
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Body editor */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-[#94A3B8] text-xs">Mensaje</Label>
          <span className={`text-[10px] font-mono ${isOverLimit ? 'text-red-400' : 'text-[#475569]'}`}>
            {charCount}/4096
          </span>
        </div>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Hola {{name}}, te escribimos desde {{company}}..."
          className="bg-[#0F1117] border-[#2A2F45] text-white text-sm min-h-[120px] resize-none font-mono"
        />
        <p className="text-[10px] text-[#475569]">
          Usa {'{{nombre}}'}, {'{{empresa}}'} para variables que se reemplazan por los datos del contacto.
        </p>
      </div>

      {/* Live preview */}
      <div className="space-y-2">
        <Label className="text-[#94A3B8] text-xs">Vista previa</Label>
        <div className="bg-[#0F1117] border border-[#1E2235] rounded-lg p-4 min-h-[60px]">
          <div className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed">
            <HighlightedPreview body={body} />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-2">
        <Button
          variant="outline"
          onClick={onCancel}
          className="border-[#2A2F45] text-[#94A3B8] hover:text-white hover:bg-[#0F1117]"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!name.trim() || !body.trim() || isOverLimit || saving}
          className="bg-emerald-500 hover:bg-emerald-600 text-white"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : template ? (
            'Actualizar'
          ) : (
            'Crear Plantilla'
          )}
        </Button>
      </div>
    </div>
  )
}
