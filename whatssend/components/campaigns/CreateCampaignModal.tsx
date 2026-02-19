'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useContacts, useImportContacts } from '@/hooks/useContacts'
import { useTemplates } from '@/hooks/useTemplates'
import { useCreateCampaign } from '@/hooks/useCampaigns'
import type { Template } from '@/types/template'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Users, Upload, FileSpreadsheet } from 'lucide-react'
import { toast } from 'sonner'
import { useDropzone } from 'react-dropzone'
import { parseExcelBuffer, CONTACT_FIELDS, type ParsedSheet } from '@/lib/utils/excel'
import { normalizePhone } from '@/lib/utils/phone'

interface CreateCampaignModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
}

export function CreateCampaignModal({ open, onOpenChange, workspaceId }: CreateCampaignModalProps) {
  const [name, setName] = useState('')
  const [messageBody, setMessageBody] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('_none')
  
  // Audience State
  const [audienceTab, setAudienceTab] = useState('manual')
  const [manualInput, setManualInput] = useState('')
  
  // File State
  const [parsedData, setParsedData] = useState<ParsedSheet | null>(null)
  const [fileStep, setFileStep] = useState<'upload' | 'mapping'>('upload')
  const [columnMapping, setColumnMapping] = useState({ phone: '', name: '', email: '', company: '' })

  // Hooks
  const { data: templates = [] } = useTemplates(workspaceId)
  const createCampaign = useCreateCampaign()
  const importContacts = useImportContacts()
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set()) // Keep for reset mainly

  // Cuando selecciona un template, llenar el body
  useEffect(() => {
    if (selectedTemplate && selectedTemplate !== '_none') {
      const tpl = templates.find(t => t.id === selectedTemplate)
      if (tpl) setMessageBody(tpl.body)
    }
  }, [selectedTemplate, templates])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    try {
      const buffer = await file.arrayBuffer()
      const data = parseExcelBuffer(buffer)
      setParsedData(data)
      setFileStep('mapping')
      
      // Auto-map similar to ImportModal
      const autoMap: Record<string, string> = {}
      for (const field of CONTACT_FIELDS) {
        const match = data.headers.find((h) => {
          const lower = h.toLowerCase()
          if (field.key === 'phone') return lower.includes('tel') || lower.includes('phone') || lower.includes('cel') || lower.includes('número')
          if (field.key === 'name') return lower.includes('nombre') || lower.includes('name') || lower.includes('cliente')
          return false
        })
        if (match) autoMap[field.key] = match
      }
      setColumnMapping(prev => ({ ...prev, ...autoMap } as any))
    } catch (err) {
      toast.error('Error al leer archivo')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx', '.xls'] },
    maxFiles: 1,
  })

  const resetFileState = () => {
    setParsedData(null)
    setFileStep('upload')
    setColumnMapping({ phone: '', name: '', email: '', company: '' })
    setSelectedContactIds(new Set())
  }

  const handleCreate = async () => {
    if (!workspaceId) return
    if (!name.trim()) { toast.error('Ingresa un nombre'); return }
    if (!messageBody.trim()) { toast.error('Ingresa un mensaje'); return }

    try {
      let finalContactIds: string[] = []

      // Strategy based on active tab
      if (audienceTab === 'manual') {
        const lines = manualInput.split('\n').filter(l => l.trim().length > 0)
        if (lines.length === 0) { toast.error('Ingresa al menos 1 número'); return }
        
        // Parse manual numbers
        const contactsToImport = lines.map(line => {
          const [rawPhone, rawName] = line.split(',').map(s => s.trim())
          const phone = normalizePhone(rawPhone)
          return {
             workspace_id: workspaceId,
             phone: phone || rawPhone, // fallback
             name: rawName || null,
             source: 'manual' as const
          }
        }).filter(c => c.phone)

        if (contactsToImport.length === 0) { toast.error('Ningún número válido'); return }
        
        // Import/Get IDs
        const result = await importContacts.mutateAsync(contactsToImport)
        finalContactIds = result.map(c => c.id)

      } else {
        // File Upload
        if (!parsedData || !columnMapping.phone) { toast.error('Configura el archivo primero'); return }
        
        const contactsToImport = []
        for (const row of parsedData.rows) {
          const rawPhone = row[columnMapping.phone]
          if (!rawPhone) continue
          const phone = normalizePhone(String(rawPhone))
          if (!phone) continue
          
          contactsToImport.push({
            workspace_id: workspaceId,
            phone,
            name: columnMapping.name ? String(row[columnMapping.name] || '') || null : null,
            source: 'excel' as const
          })
        }

        if (contactsToImport.length === 0) { toast.error('No hay contactos válidos en el archivo'); return }
        
        const result = await importContacts.mutateAsync(contactsToImport)
        finalContactIds = result.map(c => c.id)
      }

      // Create Campaign
      await createCampaign.mutateAsync({
        workspace_id: workspaceId,
        name: name.trim(),
        template_id: selectedTemplate !== '_none' ? selectedTemplate : null,
        message_body: messageBody.trim(),
        contact_ids: finalContactIds,
      })

      toast.success(`Campaña creada con ${finalContactIds.length} contactos`)
      onOpenChange(false)
      setName('')
      setMessageBody('')
      setSelectedTemplate('_none')
      setManualInput('')
      resetFileState()
      
    } catch (err) {
      toast.error('Error al crear campaña')
      console.error(err)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1A1D27] border-[#1E2235] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Nueva Campaña</DialogTitle>
          <DialogDescription className="text-[#64748B]">Definir audiencia y mensaje</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Settings */}
          <div className="space-y-4">
             <div className="space-y-2">
                <Label className="text-[#94A3B8] text-xs">Nombre</Label>
                <Input value={name} onChange={e => setName(e.target.value)} className="bg-[#0F1117] border-[#2A2F45]" placeholder="Ej: Promo Verano"/>
             </div>
             <div className="space-y-2">
                <Label className="text-[#94A3B8] text-xs">Mensaje</Label>
                <Textarea value={messageBody} onChange={e => setMessageBody(e.target.value)} className="bg-[#0F1117] border-[#2A2F45] min-h-[120px]" placeholder="Hola {{nombre}}..."/>
             </div>
             <div className="space-y-2">
                <Label className="text-[#94A3B8] text-xs">Plantilla</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger className="bg-[#0F1117] border-[#2A2F45]"><SelectValue placeholder="Sin plantilla"/></SelectTrigger>
                  <SelectContent className="bg-[#1A1D27] border-[#2A2F45]">
                    <SelectItem value="_none">— Ninguna —</SelectItem>
                    {templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
             </div>
          </div>

          {/* Right: Audience */}
          <div className="space-y-4 border-l border-[#2A2F45] pl-6">
            <Label className="text-[#94A3B8] text-xs">Audiencia</Label>
            <Tabs value={audienceTab} onValueChange={setAudienceTab} className="w-full">
              <TabsList className="bg-[#0F1117] border border-[#2A2F45] w-full">
                <TabsTrigger value="manual" className="flex-1">Manual</TabsTrigger>
                <TabsTrigger value="file" className="flex-1">Archivo</TabsTrigger>
              </TabsList>
              
              <TabsContent value="manual" className="space-y-3 mt-4">
                <Label className="text-xs text-[#64748B]">Ingresa números (uno por línea), opcionalmente con nombre separado por coma.</Label>
                <Textarea 
                  value={manualInput}
                  onChange={e => setManualInput(e.target.value)}
                  placeholder="59170000000, Juan Perez&#10;59171111111, Maria"
                  className="bg-[#0F1117] border-[#2A2F45] font-mono text-xs min-h-[200px]"
                />
              </TabsContent>

              <TabsContent value="file" className="space-y-3 mt-4">
                {fileStep === 'upload' ? (
                  <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer ${isDragActive ? 'border-emerald-500 bg-emerald-500/10' : 'border-[#2A2F45] hover:border-[#3A3F55]'}`}>
                    <input {...getInputProps()}/>
                    <Upload className="w-8 h-8 text-[#64748B] mx-auto mb-2"/>
                    <p className="text-xs text-[#94A3B8]">Arrastra Excel (.xlsx)</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                       <span className="text-xs text-emerald-400 font-medium">Archivo cargado ({parsedData?.rows.length} filas)</span>
                       <Button variant="ghost" size="sm" onClick={resetFileState} className="h-6 text-[10px] text-red-400 hover:text-red-300">Cambiar</Button>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-[10px] text-[#64748B]">Columna Teléfono</Label>
                      <Select value={columnMapping.phone} onValueChange={v => setColumnMapping({...columnMapping, phone: v})}>
                        <SelectTrigger className="h-7 text-xs bg-[#0F1117] border-[#2A2F45]"><SelectValue/></SelectTrigger>
                        <SelectContent className="bg-[#1A1D27] border-[#2A2F45]">
                          {parsedData?.headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] text-[#64748B]">Columna Nombre (Opcional)</Label>
                       <Select value={columnMapping.name} onValueChange={v => setColumnMapping({...columnMapping, name: v})}>
                        <SelectTrigger className="h-7 text-xs bg-[#0F1117] border-[#2A2F45]"><SelectValue placeholder="No mapear"/></SelectTrigger>
                        <SelectContent className="bg-[#1A1D27] border-[#2A2F45]">
                           <SelectItem value="">— No mapear —</SelectItem>
                           {parsedData?.headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                        </SelectContent>
                       </Select>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-[#2A2F45]">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-[#2A2F45] text-[#94A3B8] hover:text-white hover:bg-[#0F1117]">Cancelar</Button>
          <Button onClick={handleCreate} disabled={createCampaign.isPending || (audienceTab === 'file' && !columnMapping.phone) || (audienceTab === 'manual' && !manualInput.trim())} className="bg-emerald-500 hover:bg-emerald-600 text-white">
            {createCampaign.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>}
            Crear Campaña
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
