'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Upload, RefreshCw, Download, Eye, Send,
  CalendarClock, Mail, AlertTriangle, X, Check
} from 'lucide-react'

import { useWorkspace } from '@/hooks/useWorkspace'
import { useVentas, useUpsertVenta } from '@/hooks/useVentas'
import type { VentaTOA } from '@/types/venta-toa'
import { createClient } from '@/lib/supabase/client'

// ─── Constants ─────────────────────────────────────────────────────────────────

const EC: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  'AGENDADA':     { bg: 'bg-sky-500/10',    text: 'text-sky-400',     border: 'border-sky-500/20',     dot: 'bg-sky-400' },
  'EN PROCESO':   { bg: 'bg-amber-500/10',  text: 'text-amber-400',   border: 'border-amber-500/20',   dot: 'bg-amber-400' },
  'NO REALIZADA': { bg: 'bg-rose-500/10',   text: 'text-rose-400',    border: 'border-rose-500/20',    dot: 'bg-rose-400' },
  'COMPLETADA':   { bg: 'bg-emerald-500/10',text: 'text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-400' },
  'PENDIENTE':    { bg: 'bg-slate-500/10',  text: 'text-slate-400',   border: 'border-slate-500/20',   dot: 'bg-slate-500' },
}

const TOA_FIELDS = [
  { key: 'orden',         label: '🔢 Orden' },
  { key: 'estado',        label: '📊 Estado' },
  { key: 'cliente',       label: '👤 Cliente' },
  { key: 'rut',           label: '🪪 RUT' },
  { key: 'direccion',     label: '📍 Dirección' },
  { key: 'telefono',      label: '📞 Teléfonos' },
  { key: 'fecha_emision', label: '📆 Fecha Emisión' },
  { key: 'fecha_agenda',  label: '📅 Fecha Agenda' },
  { key: 'bloque',        label: '⏰ Bloque Horario' },
  { key: 'ventana',       label: '🚪 Ventana Llegada' },
  { key: 'fibra',         label: '📌 Fibra' },
  { key: 'obs',           label: '🗒️ Observaciones' },
  { key: 'tecnico',       label: '🛠️ Técnico' },
]

// ─── Badge Component ───────────────────────────────────────────────────────────
function Badge({ estado }: { estado: string }) {
  const e = EC[estado] || EC['PENDIENTE']
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${e.bg} ${e.text} border ${e.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${e.dot}`} />
      {estado}
    </span>
  )
}

// ─── Modal Agregar Venta ───────────────────────────────────────────────────────
function ModalAgregarVenta({ onClose, onAdd }: { onClose: () => void, onAdd: (orden: string) => void }) {
  const [orden, setOrden] = useState('')
  const [error, setError] = useState('')
  const valid = orden.trim().length >= 6

  const handleGuardar = () => {
    if (!valid) return
    onAdd(orden)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="rounded-2xl border w-full max-w-sm shadow-2xl overflow-hidden" style={{ background: '#0C0F1A', borderColor: '#1E2537' }}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: '#141928' }}>
          <div>
            <h3 className="text-white font-semibold text-sm">Agregar Venta</h3>
            <p className="text-[#475569] text-xs mt-0.5">Ingresa el número de orden — la consulta se hará en segundo plano</p>
          </div>
          <button onClick={onClose} className="text-[#475569] hover:text-[#94A3B8] transition-colors"><X style={{ width: 16, height: 16 }} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-[#94A3B8] text-xs font-medium mb-2 block">🔢 Número de Orden TOA *</label>
            <input
              value={orden}
              onChange={e => { setOrden(e.target.value.replace(/\D/g, '')); setError('') }}
              placeholder="Ej: 1233441422"
              className="w-full rounded-xl px-4 py-3 text-white text-sm font-mono tracking-widest border focus:outline-none transition-colors text-center"
              style={{ background: '#07090F', borderColor: error ? '#f43f5e50' : orden && valid ? '#10b98130' : '#1E2537', fontSize: 16, letterSpacing: 2 }}
              maxLength={12}
            />
            {error && <p className="text-rose-400 text-xs mt-1.5">{error}</p>}
            {valid && <p className="text-emerald-500 text-xs mt-1.5 flex items-center gap-1"><Check style={{ width: 11, height: 11 }} /> Orden válida</p>}
          </div>
          {valid && (
            <div className="p-3 rounded-xl border" style={{ background: '#07090F', borderColor: '#141928' }}>
              <p className="text-[#475569] text-xs">Al guardar, se añadirá a la tabla y se consultará a TOA en segundo plano.</p>
            </div>
          )}
        </div>
        <div className="p-4 border-t flex gap-2.5" style={{ borderColor: '#141928' }}>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-[#64748B] text-xs font-medium hover:text-[#94A3B8] transition-colors" style={{ background: '#07090F', borderColor: '#1E2537' }}>
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={!valid}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all ${valid ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20' : 'text-[#475569] cursor-not-allowed'}`}
            style={valid ? {} : { background: '#141928' }}
          >
            Guardar Orden
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Ventas Page ──────────────────────────────────────────────────────────
export default function VentasPage() {
  const router = useRouter()
  const { workspaceId } = useWorkspace()
  const { data: ventas = [], isLoading } = useVentas(workspaceId)
  const upsertVenta = useUpsertVenta()

  const [localPlaceholders, setLocalPlaceholders] = useState<VentaTOA[]>([])
  const [sel, setSel] = useState<VentaTOA | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)
  const [updatingAll, setUpdatingAll] = useState(false)
  const [importingExcel, setImportingExcel] = useState(false)
  const [loadingOrders, setLoadingOrders] = useState<Set<string>>(new Set())
  const [sendingMsg, setSendingMsg] = useState(false)
  const excelInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Mezclar ventas de DB con placeholders locales
  const displayVentas = [
    ...localPlaceholders.filter(p => !ventas.find(v => v.orden === p.orden)), 
    ...ventas
  ].sort((a,b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())

  const handleAddOrder = async (orden: string) => {
    if (!workspaceId) return
    const isNew = !displayVentas.find(v => v.orden === orden)
    if (isNew) {
      const placeholder: VentaTOA = {
         id: `temp-${orden}`, workspace_id: workspaceId,
         orden, estado: 'PENDIENTE', cliente: 'Buscando en TOA...', rut: '—', fibra: '—',
         fecha_emision: '—', fecha_agenda: '—', bloque: '—', ventana: '—', tecnico: '—', obs: '', telefono: '', direccion: '',
         created_at: new Date().toISOString(), updated_at: new Date().toISOString()
      }
      setLocalPlaceholders(prev => [placeholder, ...prev])
    }
    setLoadingOrders(prev => new Set(prev).add(orden))

    try {
      const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const res = await fetch(`${url}/api/toa/consultar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orden }),
      })
      const data = await res.json()
      
      if (res.ok && data.ok && data.datos) {
        const d = data.datos;
        const noEncontrada = d.estado === 'No encontrada';
        try {
          await upsertVenta.mutateAsync({
            workspace_id: workspaceId,
            orden,
            estado: d.estado || 'PENDIENTE',
            cliente: noEncontrada ? '—' : (d.cliente || 'Desconocido'),
            rut: noEncontrada ? '—' : (d.rut || ''),
            fibra: noEncontrada ? '—' : (d.fibra || '—'),
            fecha_emision: noEncontrada ? '—' : (d.fechaEmision || ''),
            fecha_agenda: noEncontrada ? '—' : (d.fechaAgenda || ''),
            bloque: noEncontrada ? '—' : (d.bloque || ''),
            ventana: noEncontrada ? '—' : (d.ventana || ''),
            tecnico: noEncontrada ? '—' : (d.tecnico || ''),
            obs: d.obs || '',
            telefono: noEncontrada ? '—' : (d.telefono || ''),
            direccion: noEncontrada ? '—' : (d.direccion || '')
          })
          // The query will auto-invalidate and fetch the new row!
        } catch (e) {
          console.error("Error saving to supabase", e)
        }
      } else {
        setLocalPlaceholders(prev => prev.map(v => v.orden === orden ? { ...v, estado: 'NO REALIZADA', obs: data.detail || 'Error TOA' } : v))
      }
    } catch (err: any) {
      console.error('Error', err)
      setLocalPlaceholders(prev => prev.map(v => v.orden === orden ? { ...v, estado: 'NO REALIZADA', obs: 'Error de red TOA' } : v))
    } finally {
      setLoadingOrders(prev => {
        const newSet = new Set(prev)
        newSet.delete(orden)
        return newSet
      })
    }
  }

  const upd = async (o: string) => { 
    setUpdating(o); 
    try {
      const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const res = await fetch(`${url}/api/toa/consultar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orden: o }),
      })
      const data = await res.json()
      if (res.ok && data.ok && workspaceId) {
        const d = data.datos;
        const noEncontrada = d.estado === 'No encontrada';
        await upsertVenta.mutateAsync({
          workspace_id: workspaceId,
          orden: o,
          estado: d.estado,
          cliente: noEncontrada ? '—' : d.cliente,
          rut: noEncontrada ? '—' : d.rut,
          fibra: noEncontrada ? '—' : d.fibra,
          fecha_emision: noEncontrada ? '—' : d.fechaEmision,
          fecha_agenda: noEncontrada ? '—' : d.fechaAgenda,
          bloque: noEncontrada ? '—' : d.bloque,
          ventana: noEncontrada ? '—' : d.ventana,
          tecnico: noEncontrada ? '—' : d.tecnico,
          obs: d.obs,
          telefono: noEncontrada ? '—' : d.telefono,
          direccion: noEncontrada ? '—' : d.direccion
        })
      }
    } catch (err: any) {
      console.error('Error actualizando:', err)
    } finally {
      setUpdating(null)
    }
  }

  // Actualizar todas las órdenes existentes desde TOA
  const handleActualizarTodo = async () => {
    if (!workspaceId || updatingAll) return
    setUpdatingAll(true)
    const ordenes = ventas.map(v => v.orden).filter(Boolean)
    for (const o of ordenes) {
      await upd(o)
    }
    setUpdatingAll(false)
  }

  // Importar Excel con columna de órdenes
  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !workspaceId) return
    setImportingExcel(true)
    try {
      const { read, utils } = await import('xlsx')
      const buffer = await file.arrayBuffer()
      const wb = read(buffer, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows: Record<string, string>[] = utils.sheet_to_json(ws, { defval: '' })

      // Buscar columna que parezca contener N° de orden
      const orderKeys = Object.keys(rows[0] || {}).filter(k =>
        /orden|order|n.?orden|numero|number/i.test(k)
      )
      const key = orderKeys[0] || Object.keys(rows[0] || {})[0]

      const ordenes = rows
        .map(r => String(r[key] || '').replace(/\D/g, ''))
        .filter(o => o.length >= 6)

      // Procesar una a una con pausa de 2s entre cada orden
      for (let i = 0; i < ordenes.length; i++) {
        await handleAddOrder(ordenes[i])
        if (i < ordenes.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000)) // 2s entre cada consulta TOA
        }
      }
    } catch (err) {
      console.error('Error leyendo Excel:', err)
    } finally {
      setImportingExcel(false)
      if (excelInputRef.current) excelInputRef.current.value = ''
    }
  }

  const handleNotify = async (v: VentaTOA, type: 'notify' | 'reschedule') => {
    if (!workspaceId) return
    if (!v.telefono || v.telefono === '—') {
      alert('Esta orden no tiene teléfono asignado.')
      return
    }

    setSendingMsg(true)
    try {
      // Create contact if needed, then send message
      let phone = v.telefono.replace(/\D/g, '')
      if (!phone.startsWith('569')) phone = `569${phone}` // Basic CL normalization, adjust if needed
      
      // Upsert contact so we can log the message
      const { data: contact } = await supabase
        .from('contacts')
        .upsert({ workspace_id: workspaceId, phone, name: v.cliente }, { onConflict: 'workspace_id, phone' })
        .select('id')
        .single()
        
      if (!contact) throw new Error('Could not create contact')

      const bodyMsg = type === 'notify' ? 
        `Hola ${v.cliente}, te escribimos para confirmar tu instalación de ${v.fibra} agendada para el ${v.fecha_agenda} en el bloque ${v.bloque}.` :
        `Hola ${v.cliente}, notamos que tu orden de instalación no pudo ser realizada. Te contactamos para reagendar a la brevedad posible.`

      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           workspaceId,
           contactId: contact.id,
           body: bodyMsg,
           preview_url: false
        })
      })
      const data = await res.json()
      if (res.ok && data.id) {
        alert('Mensaje enviado exitosamente')
      } else {
        alert('Error: ' + (data.error || 'Mensaje no enviado'))
      }
    } catch (err) {
      console.error(err)
      alert('Error de red al intentar enviar mensaje')
    } finally {
      setSendingMsg(false)
    }
  }

  const LEYENDA = [
    { icon: Eye,           color: 'text-sky-400 bg-sky-500/10',     label: 'Ver TOA' },
    { icon: RefreshCw,     color: 'text-emerald-400 bg-emerald-500/10', label: 'Actualizar TOA' },
    { icon: Send,          color: 'text-violet-400 bg-violet-500/10', label: 'Notificar cliente' },
    { icon: CalendarClock, color: 'text-amber-400 bg-amber-500/10', label: 'Reagendar (BA)' },
    { icon: Mail,          color: 'text-teal-400 bg-teal-500/10',   label: 'Enviar venta (BI)' },
  ]

  // KPIs
  const kpis = [
    { l: 'Total',          v: displayVentas.length.toString(), c: '#fff' },
    { l: 'Agendadas',      v: displayVentas.filter(v => v.estado === 'AGENDADA').length.toString(),     c: '#38bdf8' },
    { l: 'Completadas',    v: displayVentas.filter(v => v.estado === 'COMPLETADA').length.toString(),   c: '#10b981' },
    { l: 'No Realizadas',  v: displayVentas.filter(v => v.estado === 'NO REALIZADA').length.toString(), c: '#f43f5e' },
    { l: 'Pendientes',     v: displayVentas.filter(v => v.estado === 'PENDIENTE').length.toString(),    c: '#64748b' },
  ]

  return (
    <div className="p-6 h-full overflow-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* input oculto para Excel */}
        <input
          ref={excelInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={handleExcelImport}
        />
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
        >
          <Plus style={{ width: 13, height: 13 }} /> Agregar Venta
        </button>
        <button
          onClick={() => excelInputRef.current?.click()}
          disabled={importingExcel}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium text-[#94A3B8] hover:text-[#E2E8F0] border transition-colors hover:border-white/10 disabled:opacity-50"
          style={{ background: '#0C0F1A', borderColor: '#141928' }}
        >
          <Upload style={{ width: 13, height: 13 }} />
          {importingExcel ? 'Importando...' : 'Importar Excel'}
        </button>
        <button
          onClick={handleActualizarTodo}
          disabled={updatingAll || ventas.length === 0}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium text-[#94A3B8] hover:text-[#E2E8F0] border transition-colors hover:border-white/10 disabled:opacity-50"
          style={{ background: '#0C0F1A', borderColor: '#141928' }}
        >
          <RefreshCw style={{ width: 13, height: 13 }} className={updatingAll ? 'animate-spin' : ''} />
          {updatingAll ? 'Actualizando...' : 'Actualizar Todo TOA'}
        </button>
        <div className="ml-auto">
          <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium text-[#94A3B8] hover:text-[#E2E8F0] border transition-colors hover:border-white/10" style={{ background: '#0C0F1A', borderColor: '#141928' }}>
            <Download style={{ width: 13, height: 13 }} /> Exportar
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {kpis.map(k => (
          <div key={k.l} className="rounded-xl border p-3 text-center" style={{ background: '#0C0F1A', borderColor: '#141928' }}>
            <div className="text-xl font-bold" style={{ color: k.c }}>{k.v}</div>
            <div className="text-[#475569] text-xs mt-0.5">{k.l}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ background: '#0C0F1A', borderColor: '#141928' }}>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: 900 }}>
            <thead>
              <tr className="border-b" style={{ borderColor: '#141928' }}>
                {['🔢 Orden', '👤 Cliente / RUT', '📌 Fibra', '📊 Estado', '📅 Fecha Agenda', '⏰ Bloque', '🚪 Ventana', '🛠️ Técnico', '🗒️ Obs.', 'Acciones'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-[#475569] px-3 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && displayVentas.length === 0 ? (
                <tr><td colSpan={10} className="p-4 text-center text-xs text-[#64748B]">Cargando ventas...</td></tr>
              ) : displayVentas.length === 0 ? (
                <tr><td colSpan={10} className="p-4 text-center text-xs text-[#64748B]">Sin registros de ventas TOA</td></tr>
              ) : displayVentas.map((v) => (
                <tr key={v.orden + v.rut} className="border-b transition-colors hover:bg-white/[0.02]" style={{ borderColor: '#0F1219' }}>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                       <span className="text-emerald-500 font-mono font-bold text-xs">#{v.orden}</span>
                       {loadingOrders.has(v.orden) && <RefreshCw className="animate-spin text-emerald-400" style={{ width: 12, height: 12 }} />}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-[#E2E8F0] font-medium text-xs">{v.cliente || <span className="text-[#334155]">—</span>}</div>
                    <div className="text-[#475569] text-xs font-mono">{v.rut}</div>
                  </td>
                  <td className="px-3 py-3 text-[#94A3B8] text-xs whitespace-nowrap">{v.fibra}</td>
                  <td className="px-3 py-3"><Badge estado={v.estado} /></td>
                  <td className="px-3 py-3 text-[#94A3B8] text-xs whitespace-nowrap">{v.fecha_agenda}</td>
                  <td className="px-3 py-3 text-[#64748B] text-xs whitespace-nowrap">{v.bloque}</td>
                  <td className="px-3 py-3 text-[#64748B] text-xs whitespace-nowrap">{v.ventana}</td>
                  <td className="px-3 py-3 text-[#94A3B8] text-xs whitespace-nowrap">{v.tecnico}</td>
                  <td className="px-3 py-3">
                    {v.obs
                      ? <span className="text-amber-400 text-xs flex items-center gap-1"><AlertTriangle style={{ width: 11, height: 11 }} />{v.obs.slice(0, 18)}…</span>
                      : <span className="text-[#334155] text-xs">—</span>}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setSel(v)} title="Ver TOA" className="p-1.5 rounded-lg transition-colors bg-sky-500/10 text-sky-400 hover:bg-sky-500/20"><Eye style={{ width: 12, height: 12 }} /></button>
                      <button onClick={() => upd(v.orden)} title="Actualizar TOA" className="p-1.5 rounded-lg transition-colors bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"><RefreshCw style={{ width: 12, height: 12 }} className={updating === v.orden ? 'animate-spin' : ''} /></button>
                      <button onClick={() => handleNotify(v, 'notify')} title="Notificar cliente" className="p-1.5 rounded-lg transition-colors bg-violet-500/10 text-violet-400 hover:bg-violet-500/20"><Send style={{ width: 12, height: 12 }} /></button>
                      {v.estado === 'NO REALIZADA' && <button onClick={() => handleNotify(v, 'reschedule')} title="Reagendar BA" className="p-1.5 rounded-lg transition-colors bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"><CalendarClock style={{ width: 12, height: 12 }} /></button>}
                      {v.orden !== '—' && <button title="Enviar venta al BI" className="p-1.5 rounded-lg transition-colors bg-teal-500/10 text-teal-400 hover:bg-teal-500/20"><Mail style={{ width: 12, height: 12 }} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-5 flex-wrap pt-1">
        {LEYENDA.map(l => (
          <span key={l.label} className="flex items-center gap-1.5 text-xs text-[#475569]">
            <span className={`p-1 rounded-md ${l.color}`}><l.icon style={{ width: 10, height: 10 }} /></span>
            {l.label}
          </span>
        ))}
      </div>

      {/* Modal TOA Detalle */}
      {sel && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl border w-full max-w-sm shadow-2xl" style={{ background: '#0C0F1A', borderColor: '#1E2537' }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: '#141928' }}>
              <div>
                <h3 className="text-white font-semibold text-sm">Resumen TOA</h3>
                <p className="text-[#475569] text-xs">Orden #{sel.orden}</p>
              </div>
              <button onClick={() => setSel(null)} className="text-[#475569] hover:text-[#94A3B8] transition-colors"><X style={{ width: 16, height: 16 }} /></button>
            </div>
            <div className="p-5 space-y-2 max-h-[55vh] overflow-y-auto">
              {TOA_FIELDS.map(f => (
                <div key={f.key} className="flex gap-3">
                  <span className="text-[#475569] text-xs w-36 flex-shrink-0">{f.label}</span>
                  <span className="text-[#E2E8F0] text-xs font-medium">{(sel as unknown as Record<string, string>)[f.key] || '—'}</span>
                </div>
              ))}
            </div>
            <div className="p-4 border-t flex gap-2.5" style={{ borderColor: '#141928' }}>
              {sel.estado === 'NO REALIZADA' && (
                <button 
                  onClick={() => handleNotify(sel, 'reschedule')}
                  disabled={sendingMsg}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold border transition-colors hover:bg-amber-500/15 disabled:opacity-50" style={{ background: '#0C0F1A', borderColor: '#f59e0b30', color: '#fbbf24' }}>
                  <CalendarClock style={{ width: 13, height: 13 }} /> Reagendar BA
                </button>
              )}
              <button 
                onClick={() => handleNotify(sel, 'notify')}
                disabled={sendingMsg}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold border transition-colors hover:bg-emerald-500/15 disabled:opacity-50" style={{ background: '#0C0F1A', borderColor: '#10b98130', color: '#10b981' }}>
                <Send style={{ width: 13, height: 13 }} /> Notificar Cliente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Agregar Venta */}
      {showAdd && <ModalAgregarVenta onClose={() => setShowAdd(false)} onAdd={handleAddOrder} />}
    </div>
  )
}
