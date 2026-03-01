'use client'

import { useState } from 'react'
import {
  Plus, Filter, Download, X, Edit3, RotateCcw, Mail,
  Package, MapPin, ExternalLink
} from 'lucide-react'

import { useWorkspace } from '@/hooks/useWorkspace'
import { useRegistros, useUpsertRegistro } from '@/hooks/useRegistros'
import type { RegistroVenta } from '@/types/registro-venta'

// ─── Constants ─────────────────────────────────────────────────────────────────
const REGISTRO_FIELDS = [
  { key: 'rut',              label: 'RUT Cliente',          required: true,  ph: '12.345.678-9' },
  { key: 'nombre',           label: 'Nombre Cliente',       required: false, ph: 'Nombre completo' },
  { key: 'direccion_limpia', label: 'Dirección Limpia',     required: false, ph: 'Sin depto ni piso' },
  { key: 'direccion_inst',   label: 'Dirección Instalación',required: true,  ph: 'Con depto/piso/block (obligatorio)' },
  { key: 'comuna',          label: 'Comuna',               required: false, ph: 'Ej: Santiago' },
  { key: 'region',          label: 'Región',               required: false, ph: 'Ej: Metropolitana' },
  { key: 'servicio',        label: 'Servicio que Contrata',required: false, ph: 'Ej: Fibra 600MB' },
  { key: 'adicional',       label: 'Servicio Adicional',   required: false, ph: 'Ej: Deco adicional' },
  { key: 'promo',           label: 'Promoción',            required: false, ph: 'Nombre de la promo' },
  { key: 'ejecutivo',       label: 'Ejecutivo',            required: false, ph: 'Nombre ejecutivo' },
  { key: 'supervisor',      label: 'Supervisor',           required: false, ph: 'Nombre supervisor' },
  { key: 'contacto',        label: 'Contacto Instalación', required: false, ph: 'Nombre de quien recibe al técnico' },
  { key: 'fono',            label: 'Fono',                 required: false, ph: '9XXXXXXXX' },
  { key: 'ciclo',           label: 'Ciclo de Pago',        required: false, ph: 'Ej: 5' },
  { key: 'correo',          label: 'Correo',               required: false, ph: 'cliente@email.com' },
]

const TIPOS = [
  { id: 'bo',        label: 'Código BO',          color: '#10b981', desc: 'Emisión nueva BO N°XXXX' },
  { id: 'reemision', label: 'Reemisión de Venta', color: '#f59e0b', desc: 'Orden cancelada a reemplazar' },
  { id: 'biometria', label: 'Biometría en Calle', color: '#a78bfa', desc: 'Técnico hace el proceso in situ' },
]

const RV_EMPTY: Partial<RegistroVenta> = {
  rut: '', nombre: '', direccion_limpia: '', direccion_inst: '', comuna: '', region: '',
  servicio: '', adicional: '', promo: '', ejecutivo: '', supervisor: '', contacto: '',
  fono: '', ciclo: '', correo: '', bo: '', estado: 'pendiente_envio', tipo: 'bo',
  fecha: new Date().toLocaleDateString('es-CL'),
}

// ─── Modal Nueva/Editar ────────────────────────────────────────────────────────
function ModalRegistro({ initial, onClose, workspaceId }: { initial?: RegistroVenta | null; onClose: () => void; workspaceId: string | null }) {
  const [loading, setLoading] = useState(false)
  const isNew = !initial
  const [tipo, setTipo] = useState(initial?.tipo || 'bo')
  const [form, setForm] = useState<Partial<RegistroVenta>>(initial ? { ...initial } : { ...RV_EMPTY, workspace_id: workspaceId || '' })
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))
  const boLabel = tipo === 'bo' ? 'Código BO' : tipo === 'reemision' ? 'Nº Orden Cancelada' : null
  const boRequired = tipo === 'bo' || tipo === 'reemision'
  const valid = form.rut && form.direccion_limpia && (tipo === 'biometria' || form.bo)
  
  const upsertRegistro = useUpsertRegistro()

  const handleTOAAutofill = async () => {
    if (!form.bo || form.bo.length < 6) return
    setLoading(true)
    try {
      // Remove any prefix from the BO code for the search if needed, but here we just pass it
      const ordenNum = form.bo.replace(/\D/g, '')
      const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const res = await fetch(`${url}/api/toa/consultar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orden: ordenNum }),
      })
      const data = await res.json()
      if (res.ok && data.ok && data.datos) {
        setForm(p => ({
          ...p,
          rut: data.datos.rut || p.rut,
          nombre: data.datos.cliente || p.nombre,
          direccion_inst: data.datos.direccion || p.direccion_inst,
          comuna: data.datos.direccion?.split(',').pop()?.trim() || p.comuna,
          fono: data.datos.telefono?.split('/')[0]?.trim() || p.fono
        }))
      }
    } catch (err) {
      console.error('Error autofilling from TOA:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!valid || !workspaceId) return
    try {
      setLoading(true)
      await upsertRegistro.mutateAsync({
        ...form,
        tipo: tipo as 'bo' | 'reemision' | 'biometria',
        workspace_id: workspaceId
      })
      onClose()
    } catch (e) {
      console.error('Error guardando registro:', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="rounded-2xl border w-full max-w-md shadow-2xl overflow-hidden" style={{ background: '#0C0F1A', borderColor: '#1E2537' }}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: '#141928' }}>
          <div>
            <h3 className="text-white font-semibold text-sm">{isNew ? 'Nueva Venta' : 'Editar Venta'}</h3>
            <p className="text-[#475569] text-xs mt-0.5">Los campos * son obligatorios según tipo de venta</p>
          </div>
          <button onClick={onClose} className="text-[#475569] hover:text-[#94A3B8] transition-colors"><X style={{ width: 16, height: 16 }} /></button>
        </div>
        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Tipo selector */}
          <div>
            <label className="text-[#64748B] text-xs mb-2 block font-medium">Tipo de Venta *</label>
            <div className="grid grid-cols-3 gap-2">
              {TIPOS.map(t => (
                <button key={t.id} onClick={() => setTipo(t.id as 'bo' | 'reemision' | 'biometria')}
                  className="rounded-xl p-3 text-left border transition-all"
                  style={{ background: tipo === t.id ? t.color + '12' : '#07090F', borderColor: tipo === t.id ? t.color + '40' : '#1E2537' }}>
                  <div className="text-xs font-semibold mb-0.5" style={{ color: tipo === t.id ? t.color : '#64748b' }}>{t.label}</div>
                  <div className="text-xs leading-tight" style={{ color: '#475569' }}>{t.desc}</div>
                </button>
              ))}
            </div>
          </div>
          {/* BO field */}
          {boLabel && (
            <div>
              <label className="text-[#64748B] text-xs mb-1.5 flex items-center gap-1">
                {tipo === 'bo' ? '🏷️' : '🔁'} {boLabel} <span className="text-rose-400">*</span>
              </label>
              <div className="flex gap-2">
                <input value={form.bo || ''} onChange={e => set('bo', e.target.value)}
                  placeholder={tipo === 'bo' ? 'BO N°Q1234' : 'Nº orden cancelada'}
                  className="w-full rounded-lg px-3 py-2 text-[#E2E8F0] text-xs border focus:outline-none focus:border-emerald-500/40 transition-colors"
                  style={{ background: '#07090F', borderColor: boRequired && !form.bo ? '#f43f5e30' : '#1E2537' }} />
                {tipo === 'reemision' && (
                  <button onClick={handleTOAAutofill} disabled={loading || !form.bo}
                    className="px-3 rounded-lg border text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-medium transition-colors disabled:opacity-50">
                    {loading ? '...' : 'Llenar datos TOA'}
                  </button>
                )}
              </div>
            </div>
          )}
          {/* Fields grid */}
          <div className="grid grid-cols-2 gap-3">
            {REGISTRO_FIELDS.map(f => (
              <div key={f.key} className={f.key === 'direccion_limpia' || f.key === 'direccion_inst' || f.key === 'servicio' ? 'col-span-2' : ''}>
                <label className="text-[#64748B] text-xs mb-1.5 flex items-center gap-1">
                  {f.label} {f.required && <span className="text-rose-400">*</span>}
                </label>
                <input value={(form as Record<string, string>)[f.key] || ''} onChange={e => set(f.key, e.target.value)}
                  placeholder={f.ph}
                  className="w-full rounded-lg px-3 py-2 text-[#E2E8F0] text-xs border focus:outline-none focus:border-emerald-500/40 transition-colors"
                  style={{ background: '#07090F', borderColor: f.required && !(form as Record<string, string>)[f.key] ? '#f43f5e30' : '#1E2537' }} />
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 border-t flex gap-2.5" style={{ borderColor: '#141928' }}>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-[#64748B] text-xs font-medium transition-colors hover:border-[#475569]" style={{ background: '#07090F', borderColor: '#1E2537' }}>
            Cancelar
          </button>
          <button disabled={!valid || loading} onClick={handleSave}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all ${valid ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20' : 'text-[#475569] cursor-not-allowed'}`}
            style={valid ? {} : { background: '#141928' }}>
            {loading ? <span className="animate-spin border-2 border-white/20 border-t-white rounded-full w-4 h-4"></span> : null}
            {valid ? (isNew ? 'Registrar Venta' : 'Guardar Cambios') : 'Completa campos requeridos'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Registro Page ─────────────────────────────────────────────────────────────
export default function RegistroPage() {
  const { workspaceId } = useWorkspace()
  const { data: registros = [], isLoading } = useRegistros(workspaceId)
  
  const [sel, setSel] = useState<RegistroVenta | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [editing, setEditing] = useState<RegistroVenta | null>(null)

  return (
    <div className="p-6 h-full overflow-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-white font-semibold text-sm">Registro de Ventas</h2>
          <p className="text-[#475569] text-xs mt-0.5">Formatos enviados al Backoffice de Ingreso</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium text-[#94A3B8] border hover:border-white/10 transition-colors" style={{ background: '#0C0F1A', borderColor: '#141928' }}>
            <Filter style={{ width: 13, height: 13 }} /> Filtrar
          </button>
          <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium text-[#94A3B8] border hover:border-white/10 transition-colors" style={{ background: '#0C0F1A', borderColor: '#141928' }}>
            <Download style={{ width: 13, height: 13 }} /> Exportar
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && registros.length === 0 ? (
          <div className="col-span-full py-10 flex flex-col items-center justify-center space-y-3">
             <div className="animate-spin border-4 border-emerald-500/20 border-t-emerald-500 rounded-full w-8 h-8"></div>
             <p className="text-[#94A3B8] text-sm font-medium">Cargando registros...</p>
          </div>
        ) : (
          registros.map(rv => {
            const t = TIPOS.find(ti => ti.id === rv.tipo) || TIPOS[0]
            return (
            <button key={rv.id} onClick={() => setSel(rv)}
              className="rounded-xl border p-4 text-left hover:border-white/10 transition-all duration-200 group"
              style={{ background: '#0C0F1A', borderColor: '#141928' }}>
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold border" style={{ color: t.color, background: t.color + '10', borderColor: t.color + '25' }}>{t.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${rv.estado === 'enviada' ? 'text-emerald-400 border-emerald-500/20' : 'text-amber-400 border-amber-500/20'}`}
                  style={{ background: rv.estado === 'enviada' ? '#10b98110' : '#f59e0b10' }}>
                  {rv.estado === 'enviada' ? 'Enviada' : 'Pendiente'}
                </span>
              </div>
              <div className="font-mono font-bold text-xs mb-2" style={{ color: t.color }}>{rv.bo || 'Sin código'}</div>
              <p className="text-white font-semibold text-sm">{rv.nombre}</p>
              <p className="text-[#475569] text-xs mt-0.5">{rv.rut}</p>
              <div className="mt-3 pt-3 border-t space-y-1" style={{ borderColor: '#141928' }}>
                <div className="flex items-center gap-2 text-xs text-[#64748B]"><Package style={{ width: 11, height: 11 }} />{rv.servicio}</div>
                <div className="flex items-center gap-2 text-xs text-[#64748B]"><MapPin style={{ width: 11, height: 11 }} />{rv.comuna}</div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-2 border-t" style={{ borderColor: '#141928' }}>
                <span className="text-[#334155] text-xs">{rv.fecha}</span>
                <ExternalLink style={{ width: 12, height: 12 }} className="text-[#334155] group-hover:text-[#94A3B8] transition-colors" />
              </div>
            </button>
          )
        }))}
        {/* New card */}
        <button onClick={() => setShowNew(true)}
          className="rounded-xl border-2 border-dashed p-4 flex flex-col items-center justify-center gap-2 hover:border-emerald-500/30 transition-all group min-h-[200px]" style={{ borderColor: '#141928' }}>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
            <Plus style={{ width: 18, height: 18 }} className="text-emerald-500" />
          </div>
          <span className="text-[#475569] text-xs font-medium group-hover:text-[#94A3B8] transition-colors">Nueva venta manual</span>
        </button>
      </div>

      {/* Detail Modal */}
      {sel && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl border w-full max-w-md shadow-2xl overflow-hidden" style={{ background: '#0C0F1A', borderColor: '#1E2537' }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: '#141928' }}>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold border"
                  style={{ color: TIPOS.find(t => t.id === sel.tipo)?.color || '#10b981', background: (TIPOS.find(t => t.id === sel.tipo)?.color || '#10b981') + '10', borderColor: (TIPOS.find(t => t.id === sel.tipo)?.color || '#10b981') + '25' }}>
                  {TIPOS.find(t => t.id === sel.tipo)?.label || 'Nueva'}
                </span>
                <span className="text-white font-semibold text-sm">{sel.nombre}</span>
              </div>
              <button onClick={() => setSel(null)} className="text-[#475569] hover:text-[#94A3B8] transition-colors"><X style={{ width: 16, height: 16 }} /></button>
            </div>
            <div className="p-5 space-y-2 max-h-[55vh] overflow-y-auto">
              <div className="flex gap-3">
                <span className="text-[#475569] text-xs w-36 flex-shrink-0">{sel.tipo === 'reemision' ? '🔁 Orden Cancelada' : sel.tipo === 'biometria' ? '🟣 Tipo' : '🏷️ Código BO'}</span>
                <span className="text-[#E2E8F0] text-xs font-medium">{sel.bo || (sel.tipo === 'biometria' ? 'Biometría en calle' : '—')}</span>
              </div>
              {REGISTRO_FIELDS.map(f => (
                <div key={f.key} className="flex gap-3">
                  <span className="text-[#475569] text-xs w-36 flex-shrink-0">{f.label}</span>
                  <span className="text-[#E2E8F0] text-xs">{(sel as unknown as Record<string, string>)[f.key] || '—'}</span>
                </div>
              ))}
            </div>
            <div className="p-4 border-t flex gap-2" style={{ borderColor: '#141928' }}>
              <button onClick={() => { setEditing(sel); setSel(null) }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold border transition-colors hover:bg-white/5" style={{ borderColor: '#1E2537', color: '#94a3b8' }}>
                <Edit3 style={{ width: 13, height: 13 }} /> Editar
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold border transition-colors hover:bg-white/5" style={{ borderColor: '#1E2537', color: '#94a3b8' }}>
                <RotateCcw style={{ width: 13, height: 13 }} /> Reenviar
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20">
                <Mail style={{ width: 13, height: 13 }} /> Enviar BI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Modal */}
      {showNew && <ModalRegistro onClose={() => setShowNew(false)} workspaceId={workspaceId} />}
      {/* Edit Modal */}
      {editing && <ModalRegistro initial={editing} onClose={() => setEditing(null)} workspaceId={workspaceId} />}
    </div>
  )
}
