'use client'

import { useState } from 'react'
import {
  Clock, RotateCcw, Plus, Trash2, ShieldAlert
} from 'lucide-react'
import { INITIAL_BA_PERSONAS, INITIAL_BP_PERSONAS } from '@/lib/config/backoffice'

// ─── Section Card ──────────────────────────────────────────────────────────────
function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border p-5 ${className}`} style={{ background: '#0C0F1A', borderColor: '#141928' }}>
      {children}
    </div>
  )
}

// ─── Backoffice Admin Client ────────────────────────────────────────────────────
export default function BackofficeClient() {
  const [baPersonas, setBaPersonas] = useState(INITIAL_BA_PERSONAS)
  const [bpPersonas, setBpPersonas] = useState(INITIAL_BP_PERSONAS)

  const updateBa = (id: number, field: string, value: string) => {
    setBaPersonas(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))
  }
  const addBa = () => setBaPersonas(prev => [...prev, { id: Date.now(), nombre: '', horario: '', contacto: '' }])
  const removeBa = (id: number) => setBaPersonas(prev => prev.filter(p => p.id !== id))

  const updateBp = (id: number, field: string, value: string) => {
    setBpPersonas(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))
  }
  const addBp = () => setBpPersonas(prev => [...prev, { id: Date.now(), nombre: '', horario: '', contacto: '' }])
  const removeBp = (id: number) => setBpPersonas(prev => prev.filter(p => p.id !== id))

  const rotarTurnosBp = () => {
    if (bpPersonas.length >= 2) {
      setBpPersonas(prev => {
        const next = [...prev]
        const tempHorario = next[0].horario
        next[0] = { ...next[0], horario: next[1].horario }
        next[1] = { ...next[1], horario: tempHorario }
        return next
      })
    }
  }

  return (
    <div className="p-6 h-full overflow-auto space-y-4 max-w-3xl">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-emerald-400" />
          <h2 className="text-white font-semibold text-lg">Sistema de Backoffice (Administrativo)</h2>
        </div>
        <p className="text-[#475569] text-sm mt-1">
          Aquí administras el equipo BA (Agenda) y BP (Prechequeo). Si alguien renuncia o hay nuevos ingresos, puedes editar las listas. <br/>
          (Esta vista solo es visible para Administradores).
        </p>
      </div>

      {/* ── Backoffice Agenda (BA) ── */}
      <Section>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[#fb923c] font-semibold text-sm">Backoffice Agenda (BA)</p>
              <span className="text-[#475569] text-xs">· Reagendamientos</span>
            </div>
            <p className="text-[#475569] text-xs mt-1">Personas disponibles para reagendar visitas técnicas.</p>
          </div>
          <button onClick={addBa} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium text-[#fb923c] hover:bg-[#fb923c]/10 transition-colors" style={{ borderColor: '#fb923c30' }}>
            <Plus className="w-3.5 h-3.5" /> Agregar Persona
          </button>
        </div>
        
        <div className="space-y-2">
          {baPersonas.map((p) => (
            <div key={p.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 rounded-lg border focus-within:border-[#fb923c]/50 transition-colors" style={{ background: '#07090F', borderColor: '#1E2537' }}>
              <input value={p.nombre} onChange={(e) => updateBa(p.id, 'nombre', e.target.value)} placeholder="Nombre"
                className="flex-1 w-full bg-transparent text-[#E2E8F0] text-xs font-semibold focus:outline-none placeholder-[#334155]" />
              <div className="flex items-center flex-1 w-full gap-2 border-t sm:border-t-0 sm:border-l pl-0 pt-2 sm:pt-0 sm:pl-3" style={{ borderColor: '#1E2537' }}>
                <Clock className="w-3.5 h-3.5 text-[#64748B] flex-shrink-0" />
                <input value={p.horario} onChange={(e) => updateBa(p.id, 'horario', e.target.value)} placeholder="Horario (Ej: 08:00-17:00)"
                  className="w-full bg-transparent text-[#94A3B8] text-xs focus:outline-none placeholder-[#334155]" />
              </div>
              <div className="flex items-center flex-1 w-full gap-2 border-t sm:border-t-0 sm:border-l pl-0 pt-2 sm:pt-0 sm:pl-3" style={{ borderColor: '#1E2537' }}>
                <input value={p.contacto} onChange={(e) => updateBa(p.id, 'contacto', e.target.value)} placeholder="Teléfono"
                  className="w-full bg-transparent text-[#64748B] font-mono text-xs focus:outline-none placeholder-[#334155]" />
                <button onClick={() => removeBa(p.id)} className="p-1.5 rounded-md text-rose-400 hover:bg-rose-500/10 transition-colors ml-auto sm:ml-0 flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {baPersonas.length === 0 && <p className="text-center text-[#475569] text-xs py-4">No hay personas en BA.</p>}
        </div>
      </Section>

      {/* ── Backoffice Prechequeo (BP) ── */}
      <Section>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[#38bdf8] font-semibold text-sm">Backoffice Prechequeo (BP)</p>
              <span className="text-[#475569] text-xs">· RUT + Biometría</span>
            </div>
            <p className="text-[#475569] text-xs mt-1">Personas encargadas del chequeo biométrico (Rotación de turnos mañana/tarde).</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={rotarTurnosBp} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium bg-[#38bdf8]/10 text-[#38bdf8] hover:bg-[#38bdf8]/20 transition-colors" style={{ borderColor: '#38bdf830' }}>
              <RotateCcw className="w-3.5 h-3.5" /> Rotar Turnos Ahora
            </button>
            <button onClick={addBp} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium text-[#38bdf8] hover:bg-[#38bdf8]/10 transition-colors" style={{ borderColor: '#38bdf830' }}>
              <Plus className="w-3.5 h-3.5" /> Agregar
            </button>
          </div>
        </div>
        
        <div className="space-y-2">
          {bpPersonas.map((p) => (
            <div key={p.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 rounded-lg border focus-within:border-[#38bdf8]/50 transition-colors" style={{ background: '#07090F', borderColor: '#1E2537' }}>
              <input value={p.nombre} onChange={(e) => updateBp(p.id, 'nombre', e.target.value)} placeholder="Nombre"
                className="flex-1 w-full bg-transparent text-[#E2E8F0] text-xs font-semibold focus:outline-none placeholder-[#334155]" />
              <div className="flex items-center flex-1 w-full gap-2 border-t sm:border-t-0 sm:border-l pl-0 pt-2 sm:pt-0 sm:pl-3" style={{ borderColor: '#1E2537' }}>
                <Clock className="w-3.5 h-3.5 text-[#64748B] flex-shrink-0" />
                <input value={p.horario} onChange={(e) => updateBp(p.id, 'horario', e.target.value)} placeholder="Horario (Ej: 09:00-18:00)"
                  className="w-full bg-transparent text-[#94A3B8] text-xs focus:outline-none placeholder-[#334155]" />
              </div>
              <div className="flex items-center flex-1 w-full gap-2 border-t sm:border-t-0 sm:border-l pl-0 pt-2 sm:pt-0 sm:pl-3" style={{ borderColor: '#1E2537' }}>
                <input value={p.contacto} onChange={(e) => updateBp(p.id, 'contacto', e.target.value)} placeholder="Teléfono"
                  className="w-full bg-transparent text-[#64748B] font-mono text-xs focus:outline-none placeholder-[#334155]" />
                <button onClick={() => removeBp(p.id)} className="p-1.5 rounded-md text-rose-400 hover:bg-rose-500/10 transition-colors ml-auto sm:ml-0 flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {bpPersonas.length === 0 && <p className="text-center text-[#475569] text-xs py-4">No hay personas en BP.</p>}
        </div>
      </Section>

      <div className="flex justify-end pt-2">
        <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20">
          Guardar Cambios en BD
        </button>
      </div>
    </div>
  )
}
