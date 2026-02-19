'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Loader2, Mail, Save, MessageSquare, Plus, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface LeadDrawerProps {
  leadId: string | null
  open: boolean
  onClose: () => void
  mode?: 'edit' | 'create'
  workspaceId?: string | null
}

interface LeadFormData {
  status: string
  rut: string
  full_name: string
  address: string
  comuna: string
  email: string
  service: string
  promotion: string
  additional_services: string
  observations: string
  web_executive: string
  supervisor: string
  install_contact_name: string
  install_phone: string
  billing_date: string
  biometric_code: string
  order_number: string
}

const EMPTY_FORM: LeadFormData = {
  status: 'interested',
  rut: '',
  full_name: '',
  address: '',
  comuna: '',
  email: '',
  service: '',
  promotion: '',
  additional_services: '',
  observations: '',
  web_executive: '',
  supervisor: '',
  install_contact_name: '',
  install_phone: '',
  billing_date: '',
  biometric_code: '',
  order_number: '',
}

interface MessagePreview {
  id: string
  body: string
  direction: 'inbound' | 'outbound'
  created_at: string
}

export function LeadDrawer({ leadId, open, onClose, mode = 'edit', workspaceId }: LeadDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [lead, setLead] = useState<Record<string, unknown> | null>(null)
  const [formData, setFormData] = useState<LeadFormData>({ ...EMPTY_FORM })
  const [messages, setMessages] = useState<MessagePreview[]>([])
  const [newContactPhone, setNewContactPhone] = useState('')
  const [newContactName, setNewContactName] = useState('')

  useEffect(() => {
    if (mode === 'create') {
      setLead(null)
      setFormData({ ...EMPTY_FORM })
      setMessages([])
      return
    }
    if (leadId && open) {
      fetchLead(leadId)
    } else {
      setLead(null)
      setFormData({ ...EMPTY_FORM })
      setMessages([])
    }
  }, [leadId, open, mode])

  async function fetchLead(id: string) {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('pipeline_leads')
      .select('*, contact:contacts(phone, name, id)')
      .eq('id', id)
      .single()

    if (data) {
      setLead(data)
      setFormData({
        status: data.status || 'interested',
        rut: data.rut || '',
        full_name: data.full_name || '',
        address: data.address || '',
        comuna: data.comuna || '',
        email: data.email || '',
        service: data.service || '',
        promotion: data.promotion || '',
        additional_services: Array.isArray(data.additional_services) ? data.additional_services.join(', ') : '',
        observations: data.observations || '',
        web_executive: data.web_executive || '',
        supervisor: data.supervisor || '',
        install_contact_name: data.install_contact_name || '',
        install_phone: data.install_phone || '',
        billing_date: data.billing_date || '',
        biometric_code: data.biometric_code || '',
        order_number: data.order_number || '',
      })

      // Fetch last 10 messages for this contact
      const contact = data.contact as { id?: string } | null
      if (contact?.id) {
        const { data: msgs } = await supabase
          .from('messages')
          .select('id, body, direction, created_at')
          .eq('contact_id', contact.id)
          .order('created_at', { ascending: false })
          .limit(10)
        setMessages((msgs || []) as MessagePreview[])
      }
    }
    setLoading(false)
  }

  const updateField = (field: keyof LeadFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!leadId) return
    setSaving(true)
    try {
      const supabase = createClient()
      const updateData: Record<string, unknown> = {
        ...formData,
        additional_services: formData.additional_services
          ? formData.additional_services.split(',').map(s => s.trim()).filter(Boolean)
          : [],
        updated_at: new Date().toISOString(),
      }
      delete updateData.order_number // read-only
      const { error } = await supabase
        .from('pipeline_leads')
        .update(updateData)
        .eq('id', leadId)
      if (error) throw error
      toast.success('Lead actualizado')
    } catch (err: unknown) {
      toast.error('Error al guardar: ' + (err instanceof Error ? err.message : 'Error desconocido'))
    } finally {
      setSaving(false)
    }
  }

  const handleCreate = async () => {
    if (!workspaceId) { toast.error('No hay workspace'); return }
    if (!newContactPhone.trim()) { toast.error('Teléfono es obligatorio'); return }

    setSaving(true)
    try {
      const supabase = createClient()

      // Find or create contact
      let contactId: string
      const phone = newContactPhone.trim().replace(/\s/g, '')
      const { data: existing } = await supabase
        .from('contacts')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('phone', phone)
        .maybeSingle()

      if (existing) {
        contactId = existing.id
      } else {
        const { data: newContact, error: cErr } = await supabase
          .from('contacts')
          .insert({
            workspace_id: workspaceId,
            phone,
            name: newContactName.trim() || null,
            source: 'manual',
          })
          .select('id')
          .single()
        if (cErr || !newContact) throw cErr || new Error('Error creando contacto')
        contactId = newContact.id
      }

      // Create pipeline lead
      const insertData: Record<string, unknown> = {
        workspace_id: workspaceId,
        contact_id: contactId,
        status: formData.status || 'interested',
        full_name: formData.full_name || newContactName.trim() || null,
        rut: formData.rut || null,
        address: formData.address || null,
        comuna: formData.comuna || null,
        email: formData.email || null,
        service: formData.service || null,
        promotion: formData.promotion || null,
        observations: formData.observations || null,
        web_executive: formData.web_executive || null,
        supervisor: formData.supervisor || null,
        install_contact_name: formData.install_contact_name || null,
        install_phone: formData.install_phone || null,
      }

      const { error } = await supabase.from('pipeline_leads').insert(insertData)
      if (error) throw error

      toast.success('Lead creado exitosamente')
      onClose()
    } catch (err: unknown) {
      toast.error('Error: ' + (err instanceof Error ? err.message : 'Error desconocido'))
    } finally {
      setSaving(false)
    }
  }

  const handleSendToBackoffice = async () => {
    if (!leadId) return

    if (!formData.rut || !formData.address || !formData.service) {
      toast.error('Faltan datos obligatorios (RUT, Dirección, Servicio)')
      return
    }

    setSending(true)
    try {
      // Save first
      await handleSave()

      const res = await fetch('/api/pipeline/send-to-backoffice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al enviar')

      toast.success('Enviado a Backoffice correctamente')
      setFormData(prev => ({ ...prev, status: 'sent' }))
      setLead(prev => prev ? { ...prev, status: 'sent', sent_at: new Date().toISOString() } : null)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error')
    } finally {
      setSending(false)
    }
  }

  if (!open) return null

  const contact = lead?.contact as { id?: string; phone?: string; name?: string } | null

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="bg-[#1A1D27] border-l border-[#1E2235] text-white overflow-y-auto sm:max-w-lg w-full">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-white flex items-center gap-2">
            {mode === 'create' ? 'Nuevo Lead' : 'Detalles del Lead'}
            {lead?.status ? (
              <Badge variant="outline" className="ml-2 border-[#2A2F45] text-emerald-400 capitalize text-xs">
                {String(lead.status).replace('_', ' ')}
              </Badge>
            ) : null}
          </SheetTitle>
          <SheetDescription className="text-[#94A3B8]">
            {mode === 'create'
              ? 'Crea un nuevo lead de venta'
              : 'Edita la información y gestiona el estado del lead.'}
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Actions Bar — only in edit mode */}
            {mode === 'edit' && (
              <div className="flex gap-2">
                {contact?.id && (
                  <Link href={`/inbox?contactId=${contact.id}`} className="flex-1">
                    <Button variant="outline" className="w-full border-[#2A2F45] text-white hover:bg-[#2A2F45] text-xs h-9">
                      <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                      Ir al Chat
                    </Button>
                  </Link>
                )}
                <Button
                  onClick={handleSendToBackoffice}
                  disabled={sending || (lead?.status as string) === 'sent'}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs h-9"
                >
                  {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5 mr-1.5" />}
                  Enviar a BO
                </Button>
              </div>
            )}

            {/* Contact info — create mode */}
            {mode === 'create' && (
              <div className="space-y-3 p-3 bg-[#0F1117] rounded-lg border border-[#1E2235]">
                <h4 className="text-xs font-semibold text-[#94A3B8] uppercase">Contacto</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[#94A3B8] text-xs">Teléfono *</Label>
                    <Input
                      value={newContactPhone}
                      onChange={e => setNewContactPhone(e.target.value)}
                      className="bg-[#1A1D27] border-[#2A2F45] text-white h-8 text-sm"
                      placeholder="+56911234567"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[#94A3B8] text-xs">Nombre</Label>
                    <Input
                      value={newContactName}
                      onChange={e => setNewContactName(e.target.value)}
                      className="bg-[#1A1D27] border-[#2A2F45] text-white h-8 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Status */}
            <div className="space-y-1.5">
              <Label className="text-[#94A3B8] text-xs">Estado</Label>
              <Select value={formData.status} onValueChange={(val) => updateField('status', val)}>
                <SelectTrigger className="bg-[#0F1117] border-[#2A2F45] text-white h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1D27] border-[#2A2F45] text-white">
                  <SelectItem value="interested">Interesado</SelectItem>
                  <SelectItem value="verifying">Verificando</SelectItem>
                  <SelectItem value="data_complete">Datos Completos</SelectItem>
                  <SelectItem value="sent">Enviada a BO</SelectItem>
                  <SelectItem value="ingested">Ingresada</SelectItem>
                  <SelectItem value="rejected">No Ingresada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator className="bg-[#2A2F45]" />

            {/* Client Data */}
            <div className="space-y-3">
              <h3 className="font-semibold text-white text-sm">Datos del Cliente</h3>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Nombre Completo" value={formData.full_name} onChange={v => updateField('full_name', v)} span={2} />
                <FormField label="RUT" value={formData.rut} onChange={v => updateField('rut', v)} placeholder="12.345.678-9" />
                {mode === 'edit' && (
                  <div className="space-y-1.5">
                    <Label className="text-[#94A3B8] text-xs">Teléfono</Label>
                    <Input value={contact?.phone || ''} disabled className="bg-[#0F1117]/50 border-[#2A2F45] text-[#64748B] h-8 text-sm" />
                  </div>
                )}
                <FormField label="Email" value={formData.email} onChange={v => updateField('email', v)} span={2} />
                <FormField label="Dirección" value={formData.address} onChange={v => updateField('address', v)} span={2} />
                <FormField label="Comuna" value={formData.comuna} onChange={v => updateField('comuna', v)} />
              </div>
            </div>

            <Separator className="bg-[#2A2F45]" />

            {/* Service Data */}
            <div className="space-y-3">
              <h3 className="font-semibold text-white text-sm">Servicio y Venta</h3>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Plan / Servicio" value={formData.service} onChange={v => updateField('service', v)} placeholder="Fibra 600 Mega" />
                <FormField label="Promoción" value={formData.promotion} onChange={v => updateField('promotion', v)} />
                <FormField label="Servicios Adicionales" value={formData.additional_services} onChange={v => updateField('additional_services', v)} span={2} placeholder="WiFi 6, TV, etc." />
                <FormField label="Ejecutivo Web" value={formData.web_executive} onChange={v => updateField('web_executive', v)} />
                <FormField label="Supervisor" value={formData.supervisor} onChange={v => updateField('supervisor', v)} />
                <FormField label="Contacto Instalación" value={formData.install_contact_name} onChange={v => updateField('install_contact_name', v)} />
                <FormField label="Fono Instalación" value={formData.install_phone} onChange={v => updateField('install_phone', v)} />
                <FormField label="Fecha Facturación" value={formData.billing_date} onChange={v => updateField('billing_date', v)} type="date" />
                <FormField label="Código Biométrico" value={formData.biometric_code} onChange={v => updateField('biometric_code', v)} />
                {mode === 'edit' && formData.order_number && (
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-[#94A3B8] text-xs">N° Orden (auto)</Label>
                    <Input value={formData.order_number} disabled className="bg-[#0F1117]/50 border-[#2A2F45] text-[#64748B] h-8 text-sm" />
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#94A3B8] text-xs">Observaciones</Label>
                <Textarea
                  value={formData.observations}
                  onChange={e => updateField('observations', e.target.value)}
                  className="bg-[#0F1117] border-[#2A2F45] text-white text-sm min-h-[60px] resize-none"
                  rows={2}
                />
              </div>
            </div>

            {/* WhatsApp Messages Preview — only edit mode */}
            {mode === 'edit' && messages.length > 0 && (
              <>
                <Separator className="bg-[#2A2F45]" />
                <div className="space-y-2">
                  <h3 className="font-semibold text-white text-sm">Últimos Mensajes</h3>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {messages.reverse().map(msg => (
                      <div
                        key={msg.id}
                        className={`flex items-start gap-2 text-xs ${msg.direction === 'outbound' ? 'justify-end' : ''}`}
                      >
                        {msg.direction === 'inbound' && <ArrowDownLeft className="w-3 h-3 text-teal-400 mt-0.5 flex-shrink-0" />}
                        <div className={`py-1 px-2 rounded max-w-[85%] ${
                          msg.direction === 'outbound'
                            ? 'bg-emerald-500/10 text-emerald-200'
                            : 'bg-[#0F1117] text-[#94A3B8]'
                        }`}>
                          <p className="break-words">{msg.body}</p>
                          <p className="text-[9px] text-[#475569] mt-0.5">
                            {new Date(msg.created_at).toLocaleString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {msg.direction === 'outbound' && <ArrowUpRight className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <SheetFooter className="mt-6">
              {mode === 'create' ? (
                <Button onClick={handleCreate} disabled={saving} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  Crear Lead
                </Button>
              ) : (
                <Button onClick={handleSave} disabled={saving} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Guardar Cambios
                </Button>
              )}
            </SheetFooter>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

/** Reusable form input component */
function FormField({
  label, value, onChange, placeholder, type = 'text', span = 1,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; span?: number
}) {
  return (
    <div className={`space-y-1.5 ${span === 2 ? 'col-span-2' : ''}`}>
      <Label className="text-[#94A3B8] text-xs">{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-[#0F1117] border-[#2A2F45] text-white h-8 text-sm"
        placeholder={placeholder}
      />
    </div>
  )
}
