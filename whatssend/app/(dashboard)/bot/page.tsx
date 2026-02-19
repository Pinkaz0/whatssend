'use client'

import { useState, useEffect, useCallback } from 'react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { DEFAULT_SYSTEM_PROMPT } from '@/lib/ai/bot-constants'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Bot, Save, Loader2, Sparkles, Plus, Trash2, AlertCircle, FileUp, FileText, FileSpreadsheet, File as FileIcon, ChevronRight, Wand2 } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useBotFiles, type BotFile } from '@/hooks/useBotFiles'
import { useDropzone } from 'react-dropzone'

interface BotRule {
  id: string
  keyword: string
  response: string
  active: boolean
}

interface BotFilesSectionProps {
  workspaceId: string | null
  title: string
  description: string
  filePrefix?: string
  excludePrefix?: string
}

function BotFilesSection({ workspaceId, title, description, filePrefix, excludePrefix }: BotFilesSectionProps) {
  const { files, uploadFile, deleteFile, toggleActive } = useBotFiles(workspaceId)
  const [uploading, setUploading] = useState(false)

  // Filter files based on props
  const filteredFiles = files.filter(f => {
    if (filePrefix) return f.name.startsWith(filePrefix)
    if (excludePrefix) return !f.name.startsWith(excludePrefix)
    return true
  })

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!workspaceId) return
    setUploading(true)
    try {
      for (const file of acceptedFiles) {
        let type = 'other'
        if (file.name.endsWith('.pdf')) type = 'pdf'
        else if (file.name.match(/\.(xlsx|csv|xls)$/)) type = 'spreadsheet'
        else if (file.name.match(/\.(txt|md)$/)) type = 'text'
        
        let finalFile = file;
        if (filePrefix) {
           const newName = filePrefix + file.name
           // Simple rename hack: Create new File with new name
           finalFile = new File([file], newName, { type: file.type })
        }

        await uploadFile.mutateAsync({ file: finalFile, fileType: type })
      }
      toast.success('Archivos subidos correctamente')
    } catch (err) {
      toast.error('Error al subir archivos')
      console.error(err)
    } finally {
      setUploading(false)
    }
  }, [workspaceId, uploadFile, filePrefix])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
      'text/plain': ['.txt'],
      'application/vnd.ms-excel': ['.xls']
    }
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getIcon = (type: string) => {
    if (type === 'pdf') return <FileText className="w-4 h-4 text-red-400" />
    if (type === 'spreadsheet') return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
    return <FileIcon className="w-4 h-4 text-blue-400" />
  }

  return (
    <Card className="bg-[#1A1D27] border-[#1E2235] h-full">
      <CardHeader>
        <CardTitle className="text-white text-base">{title}</CardTitle>
        <CardDescription className="text-[#64748B]">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dropzone */}
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-emerald-500 bg-emerald-500/10' : 'border-[#2A2F45] hover:border-emerald-500/50 hover:bg-[#0F1117]'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 bg-[#0F1117] rounded-full border border-[#2A2F45]">
              {uploading ? (
                <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
              ) : (
                <FileUp className="w-6 h-6 text-[#94A3B8]" />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm text-white font-medium">
                {uploading ? 'Subiendo archivos...' : 'Haz clic o arrastra archivos aquí'}
              </p>
              <p className="text-xs text-[#64748B]">
                Soporta PDF, Excel, CSV, TXT (Max 10MB)
              </p>
            </div>
          </div>
        </div>

        <Separator className="bg-[#1E2235]" />

        {/* Files List */}
        {filteredFiles.length === 0 ? (
          <p className="text-xs text-[#64748B] text-center py-2">No hay archivos subidos</p>
        ) : (
          <div className="space-y-2">
            {filteredFiles.map(file => (
              <div key={file.id} className="flex items-center justify-between p-3 bg-[#0F1117] rounded-lg border border-[#2A2F45]">
                <div className="flex items-center gap-3 overflow-hidden">
                  {getIcon(file.file_type)}
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">
                        {filePrefix ? file.name.replace(filePrefix, '') : file.name}
                    </p>
                    <p className="text-[10px] text-[#64748B]">
                      {(file.file_size / 1024).toFixed(1)} KB • {new Date(file.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={file.active}
                    onCheckedChange={(val) => toggleActive.mutate({ id: file.id, active: val })}
                    className="data-[state=checked]:bg-emerald-500 scale-75"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteFile.mutate(file)}
                    className="text-[#64748B] hover:text-red-400 hover:bg-red-500/10 h-8 w-8"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function BotPage() {
  const { workspace, workspaceId, isLoading: wsLoading } = useWorkspace()
  const [saving, setSaving] = useState(false)
  const [botEnabled, setBotEnabled] = useState(false)
  const [systemPrompt, setSystemPrompt] = useState('')
  const [customInstructions, setCustomInstructions] = useState('')

  // Keyword rules
  const [rules, setRules] = useState<BotRule[]>([])
  const [loadingRules, setLoadingRules] = useState(true)
  const [newKeyword, setNewKeyword] = useState('')
  const [newResponse, setNewResponse] = useState('')
  const [savingRule, setSavingRule] = useState(false)

  // Load settings from workspace
  useEffect(() => {
    if (workspace) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ws = workspace as any
      setBotEnabled(ws.bot_enabled || false)
      setSystemPrompt(ws.bot_system_prompt || '')
      setCustomInstructions(ws.bot_custom_instructions || '')
    }
  }, [workspace])

  // Load keyword rules
  const fetchRules = useCallback(async () => {
    if (!workspaceId) return
    setLoadingRules(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('bot_rules')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
    if (!error) setRules(data || [])
    setLoadingRules(false)
  }, [workspaceId])

  useEffect(() => {
    fetchRules()
  }, [fetchRules])

  const handleSave = async () => {
    if (!workspaceId) return
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('workspaces')
        .update({
          bot_enabled: botEnabled,
          bot_system_prompt: systemPrompt,
          bot_custom_instructions: customInstructions,
        })
        .eq('id', workspaceId)

      if (error) throw error
      toast.success('Configuración del Bot guardada')
    } catch (err: unknown) {
      toast.error('Error al guardar: ' + (err instanceof Error ? err.message : 'Error'))
    } finally {
      setSaving(false)
    }
  }

  const handleToggleBot = async (checked: boolean) => {
      setBotEnabled(checked)
      if (!workspaceId) return
      const supabase = createClient()
      await supabase.from('workspaces').update({ bot_enabled: checked }).eq('id', workspaceId)
      toast.success(checked ? 'Bot activado' : 'Bot desactivado')
  }

  const handleAddRule = async () => {
    if (!workspaceId || !newKeyword.trim() || !newResponse.trim()) {
      toast.error('Keyword y respuesta son obligatorios')
      return
    }
    setSavingRule(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('bot_rules').insert({
        workspace_id: workspaceId,
        keyword: newKeyword.trim().toLowerCase(),
        response: newResponse.trim(),
        active: true,
      })
      if (error) throw error
      setNewKeyword('')
      setNewResponse('')
      toast.success('Regla añadida')
      fetchRules()
    } catch (err: unknown) {
      toast.error('Error: ' + (err instanceof Error ? err.message : 'Error'))
    } finally {
      setSavingRule(false)
    }
  }

  const handleDeleteRule = async (ruleId: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('bot_rules').delete().eq('id', ruleId)
    if (error) {
      toast.error('Error al eliminar')
    } else {
      setRules(prev => prev.filter(r => r.id !== ruleId))
      toast.success('Regla eliminada')
    }
  }

  const handleToggleRule = async (ruleId: string, active: boolean) => {
    const supabase = createClient()
    await supabase.from('bot_rules').update({ active }).eq('id', ruleId)
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, active } : r))
  }

  if (wsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 flex flex-col min-h-[calc(100vh-100px)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2A2F45] pb-6">
        <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bot className="w-7 h-7 text-emerald-400" />
            Bot de Ventas Autónomo
            </h1>
            <p className="text-[#94A3B8] mt-1">Configura tu vendedor virtual impulsado por IA.</p>
        </div>
        <div className="flex items-center gap-3 bg-[#0F1117] px-4 py-2 rounded-lg border border-[#2A2F45]">
            <span className={`text-sm font-medium ${botEnabled ? 'text-emerald-400' : 'text-[#64748B]'}`}>
                {botEnabled ? 'Encendido' : 'Apagado'}
            </span>
            <Switch
                checked={botEnabled}
                onCheckedChange={handleToggleBot}
                className="data-[state=checked]:bg-emerald-500"
            />
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex-1">
        <Tabs defaultValue="prompt" className="w-full space-y-6">
            <TabsList className="bg-[#0F1117] border border-[#2A2F45] h-11 p-1">
                <TabsTrigger value="prompt" className="data-[state=active]:bg-[#1A1D27] data-[state=active]:text-white text-[#94A3B8]">Prompt del Sistema</TabsTrigger>
                <TabsTrigger value="rag" className="data-[state=active]:bg-[#1A1D27] data-[state=active]:text-white text-[#94A3B8]">Archivos de Conocimiento</TabsTrigger>
                <TabsTrigger value="offers" className="data-[state=active]:bg-[#1A1D27] data-[state=active]:text-white text-[#94A3B8]">Ofertas</TabsTrigger>
                <TabsTrigger value="rules" className="data-[state=active]:bg-[#1A1D27] data-[state=active]:text-white text-[#94A3B8]">Reglas por Palabra Clave</TabsTrigger>
            </TabsList>

            <TabsContent value="prompt" className="space-y-4">
                <Card className="bg-[#1A1D27] border-[#1E2235]">
                    <CardHeader>
                    <CardTitle className="text-white text-base">Personalidad e Instrucciones</CardTitle>
                    <CardDescription className="text-[#64748B]">
                        Define cómo debe comportarse el bot y qué información priorizar.
                    </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-[#94A3B8]">Prompt Principal</Label>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSystemPrompt(DEFAULT_SYSTEM_PROMPT)}
                                    className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 text-xs h-7 px-2 gap-1"
                                >
                                    <Wand2 className="w-3 h-3" />
                                    Cargar Prompt Predeterminado
                                </Button>
                            </div>
                            <Textarea
                                value={systemPrompt}
                                onChange={(e) => setSystemPrompt(e.target.value)}
                                placeholder="Haz clic en 'Cargar Prompt Predeterminado' para usar el prompt de vendedora recomendado, o escribe el tuyo..."
                                className="bg-[#0F1117] border-[#2A2F45] text-white min-h-[200px] text-sm font-mono"
                            />
                            {!systemPrompt && (
                                <p className="text-xs text-amber-400/80 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    Sin prompt configurado — el bot usará el prompt vendedora predeterminado automáticamente.
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[#94A3B8]">Instrucciones Adicionales</Label>
                            <Textarea
                                value={customInstructions}
                                onChange={(e) => setCustomInstructions(e.target.value)}
                                placeholder="Reglas específicas extra (ej: 'Siempre termina con el nombre de la empresa', 'No ofrecer plan X')..."
                                className="bg-[#0F1117] border-[#2A2F45] text-white min-h-[100px] text-sm"
                            />
                        </div>
                        <div className="flex justify-end pt-2">
                            <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white min-w-[150px]"
                            >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Guardar Cambios
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="rag">
                <BotFilesSection 
                    workspaceId={workspaceId} 
                    title="Base de Conocimiento General" 
                    description="Sube manuales, políticas o información general (PDF, Excel, TXT)."
                    excludePrefix="[OFERTA]"
                />
            </TabsContent>

            <TabsContent value="offers">
                 <BotFilesSection 
                    workspaceId={workspaceId} 
                    title="Gestión de Ofertas" 
                    description="Sube archivos de ofertas (Plan Comunas, Masivo, etc.). Estos se marcarán automáticamente como ofertas."
                    filePrefix="[OFERTA]"
                />
            </TabsContent>

            <TabsContent value="rules">
                <Card className="bg-[#1A1D27] border-[#1E2235]">
                    <CardHeader>
                    <CardTitle className="text-white text-base">Reglas Directas (Sin IA)</CardTitle>
                    <CardDescription className="text-[#64748B]">
                        Si el usuario escribe exactamente estas palabras, el bot responderá esto sin consultar a la IA.
                    </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex flex-col sm:flex-row gap-3 p-4 bg-[#0F1117] rounded-lg border border-[#2A2F45]">
                            <div className="flex-1 space-y-1">
                                <Label className="text-xs text-[#64748B]">Si dice...</Label>
                                <Input
                                value={newKeyword}
                                onChange={e => setNewKeyword(e.target.value)}
                                placeholder="ej: precio"
                                className="bg-[#1A1D27] border-[#2A2F45] text-white"
                                />
                            </div>
                            <div className="flex-[2] space-y-1">
                                <Label className="text-xs text-[#64748B]">Responder...</Label>
                                <Input
                                value={newResponse}
                                onChange={e => setNewResponse(e.target.value)}
                                placeholder="ej: Los precios dependen del plan..."
                                className="bg-[#1A1D27] border-[#2A2F45] text-white"
                                onKeyDown={e => e.key === 'Enter' && handleAddRule()}
                                />
                            </div>
                            <div className="flex items-end">
                                <Button
                                onClick={handleAddRule}
                                disabled={savingRule}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white"
                                >
                                {savingRule ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>

                        <Separator className="bg-[#1E2235]" />

                        {loadingRules ? (
                             <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>
                        ) : rules.length === 0 ? (
                            <div className="text-center py-8 text-[#64748B]">No hay reglas definidas.</div>
                        ) : (
                            <div className="grid grid-cols-1 gap-2">
                                {rules.map(rule => (
                                    <div key={rule.id} className="flex items-center gap-4 p-3 bg-[#0F1117] rounded-lg border border-[#1E2235] hover:border-[#2A2F45] transition-colors">
                                        <Switch
                                            checked={rule.active}
                                            onCheckedChange={v => handleToggleRule(rule.id, v)}
                                            className="data-[state=checked]:bg-emerald-500 scale-75"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 font-mono text-xs">
                                                    {rule.keyword}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-[#94A3B8]">{rule.response}</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteRule(rule.id)}
                                            className="text-[#64748B] hover:text-red-400 hover:bg-red-500/10"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      </div>

      {/* Footer / Status Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-auto">
         {/* Capabilities */}
         <div className="bg-[#1A1D27] border border-[#1E2235] rounded-xl p-4 flex items-start gap-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
                <h3 className="text-white font-medium text-sm mb-1">Capacidades del Bot</h3>
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                    Responde saludos, consulta ofertas (RAG), captura datos de clientes, y gestiona el pipeline de ventas automáticamente.
                </p>
            </div>
         </div>

         {/* Status */}
         <div className="bg-[#1A1D27] border border-[#1E2235] rounded-xl p-4 flex items-center justify-between">
            <div>
                <h3 className="text-white font-medium text-sm mb-1">Estado del Sistema</h3>
                <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                    <span>Reglas: {rules.filter(r => r.active).length} activas</span>
                    <span>•</span>
                    <span>Prompt: {systemPrompt?.length || 0} chars</span>
                </div>
            </div>
            <div className="text-right">
                <Badge className={`text-sm px-3 py-1 ${botEnabled ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                    {botEnabled ? 'OPERATIVO' : 'DETENIDO'}
                </Badge>
            </div>
         </div>
      </div>
    </div>
  )
}
