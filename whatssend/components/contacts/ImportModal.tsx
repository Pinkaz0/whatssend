'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { parseExcelBuffer, CONTACT_FIELDS, type ContactFieldKey, type ParsedSheet } from '@/lib/utils/excel'
import { normalizePhone } from '@/lib/utils/phone'
import { useImportContacts } from '@/hooks/useContacts'
import type { ContactInsert } from '@/types/contact'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, FileSpreadsheet, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface ImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
}

type ImportStep = 'upload' | 'mapping' | 'result'

export function ImportModal({ open, onOpenChange, workspaceId }: ImportModalProps) {
  const [step, setStep] = useState<ImportStep>('upload')
  const [parsedData, setParsedData] = useState<ParsedSheet | null>(null)
  const [columnMapping, setColumnMapping] = useState<Record<ContactFieldKey, string>>({
    phone: '',
    name: '',
    email: '',
    company: '',
  })
  const [importResult, setImportResult] = useState<{ success: number; skipped: number } | null>(null)

  const importContacts = useImportContacts()

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    try {
      const buffer = await file.arrayBuffer()
      const data = parseExcelBuffer(buffer)
      setParsedData(data)

      // Auto-mapeo por nombres similares
      const autoMap: Record<string, string> = {}
      for (const field of CONTACT_FIELDS) {
        const match = data.headers.find((h) => {
          const lower = h.toLowerCase()
          if (field.key === 'phone') return lower.includes('tel') || lower.includes('phone') || lower.includes('cel') || lower.includes('número') || lower.includes('numero') || lower.includes('whatsapp')
          if (field.key === 'name') return lower.includes('nombre') || lower.includes('name') || lower.includes('cliente')
          if (field.key === 'email') return lower.includes('email') || lower.includes('correo') || lower.includes('mail')
          if (field.key === 'company') return lower.includes('empresa') || lower.includes('company') || lower.includes('negocio')
          return false
        })
        if (match) autoMap[field.key] = match
      }
      setColumnMapping({ ...columnMapping, ...autoMap } as Record<ContactFieldKey, string>)
      setStep('mapping')
    } catch (err) {
      toast.error('Error al leer archivo', {
        description: err instanceof Error ? err.message : 'Formato no soportado',
      })
    }
  }, [columnMapping])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
  })

  const handleImport = async () => {
    if (!parsedData || !columnMapping.phone) {
      toast.error('Debes mapear al menos el campo Teléfono')
      return
    }

    const contacts: ContactInsert[] = []
    let skipped = 0

    for (const row of parsedData.rows) {
      const rawPhone = row[columnMapping.phone]
      if (!rawPhone) { skipped++; continue }

      const phone = normalizePhone(String(rawPhone))
      if (!phone) { skipped++; continue }

      contacts.push({
        workspace_id: workspaceId,
        phone,
        name: columnMapping.name ? String(row[columnMapping.name] || '') || null : null,
        email: columnMapping.email ? String(row[columnMapping.email] || '') || null : null,
        company: columnMapping.company ? String(row[columnMapping.company] || '') || null : null,
        source: 'excel',
      })
    }

    if (contacts.length === 0) {
      toast.error('No se encontraron contactos válidos para importar')
      return
    }

    try {
      await importContacts.mutateAsync(contacts)
      setImportResult({ success: contacts.length, skipped })
      setStep('result')
      toast.success(`${contacts.length} contactos importados`)
    } catch (err) {
      toast.error('Error al importar', {
        description: err instanceof Error ? err.message : 'Error desconocido',
      })
    }
  }

  const handleClose = () => {
    setStep('upload')
    setParsedData(null)
    setImportResult(null)
    setColumnMapping({ phone: '', name: '', email: '', company: '' })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#1A1D27] border-[#1E2235] text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white">
            {step === 'upload' && 'Importar Contactos'}
            {step === 'mapping' && 'Mapear Columnas'}
            {step === 'result' && 'Importación Completa'}
          </DialogTitle>
          <DialogDescription className="text-[#64748B]">
            {step === 'upload' && 'Sube un archivo Excel (.xlsx) con tu lista de contactos'}
            {step === 'mapping' && 'Asocia las columnas de tu archivo con los campos del contacto'}
            {step === 'result' && 'Resultado de la importación'}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div
            {...getRootProps()}
            className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
              isDragActive
                ? 'border-emerald-500 bg-emerald-500/5'
                : 'border-[#2A2F45] hover:border-[#3A3F55]'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-10 h-10 text-[#475569] mb-3" />
            <p className="text-sm text-[#94A3B8] text-center">
              {isDragActive
                ? 'Suelta el archivo aquí...'
                : 'Arrastra un archivo Excel o haz clic para seleccionar'}
            </p>
            <p className="text-xs text-[#475569] mt-1">.xlsx, .xls</p>
          </div>
        )}

        {/* Step 2: Column Mapping */}
        {step === 'mapping' && parsedData && (
          <div className="space-y-4">
            {/* Mapping selectors */}
            <div className="space-y-3">
              {CONTACT_FIELDS.map((field) => (
                <div key={field.key} className="flex items-center gap-3">
                  <div className="w-24 flex-shrink-0">
                    <span className="text-sm text-[#94A3B8]">
                      {field.label}
                      {field.required && <span className="text-red-400 ml-0.5">*</span>}
                    </span>
                  </div>
                  <Select
                    value={columnMapping[field.key] || '_none'}
                    onValueChange={(val) =>
                      setColumnMapping({ ...columnMapping, [field.key]: val === '_none' ? '' : val })
                    }
                  >
                    <SelectTrigger className="bg-[#0F1117] border-[#2A2F45] text-white h-9">
                      <SelectValue placeholder="Seleccionar columna" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1D27] border-[#2A2F45]">
                      <SelectItem value="_none" className="text-[#475569]">
                        — No mapear —
                      </SelectItem>
                      {parsedData.headers.map((h) => (
                        <SelectItem key={h} value={h} className="text-white">
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            {/* Preview */}
            <div className="border border-[#1E2235] rounded-lg overflow-hidden">
              <div className="bg-[#0F1117] px-3 py-2 text-xs text-[#64748B] flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Vista previa ({parsedData.rows.length} filas)
              </div>
              <div className="max-h-36 overflow-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#1E2235]">
                      {parsedData.headers.slice(0, 4).map((h) => (
                        <th key={h} className="px-3 py-1.5 text-left text-[#64748B] font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.rows.slice(0, 3).map((row, i) => (
                      <tr key={i} className="border-b border-[#1E2235]/50">
                        {parsedData.headers.slice(0, 4).map((h) => (
                          <td key={h} className="px-3 py-1.5 text-[#94A3B8] truncate max-w-[120px]">
                            {String(row[h] || '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setStep('upload')}
                className="border-[#2A2F45] text-[#94A3B8] hover:text-white hover:bg-[#0F1117]"
              >
                Atrás
              </Button>
              <Button
                onClick={handleImport}
                disabled={!columnMapping.phone || importContacts.isPending}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                {importContacts.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  `Importar ${parsedData.rows.length} contactos`
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Result */}
        {step === 'result' && importResult && (
          <div className="flex flex-col items-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-lg font-semibold text-white">
                {importResult.success} contactos importados
              </p>
              {importResult.skipped > 0 && (
                <p className="text-sm text-[#64748B] flex items-center gap-1 justify-center">
                  <AlertCircle className="w-3.5 h-3.5 text-yellow-400" />
                  {importResult.skipped} omitidos (teléfono inválido)
                </p>
              )}
            </div>
            <Button
              onClick={handleClose}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              Cerrar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
