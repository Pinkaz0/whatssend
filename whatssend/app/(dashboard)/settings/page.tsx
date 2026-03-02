'use client'

import { useState, useEffect } from 'react'
import {
  Wifi, WifiOff, MessageSquare, Phone, Plus, Trash2, Loader2, Save, X, CheckCircle2, AlertCircle, QrCode, AlertTriangle, Mail
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'



// ─── Section Card ──────────────────────────────────────────────────────────────
function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border p-5 ${className}`} style={{ background: '#0C0F1A', borderColor: '#141928' }}>
      {children}
    </div>
  )
}

// ─── Settings Page ─────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [connected, setConnected] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ok?: boolean; message?: string} | null>(null)
  const [instanceName, setInstanceName] = useState('')
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [showQrModal, setShowQrModal] = useState(false)
  const [notification, setNotification] = useState<{title: string, message: string, type: 'success' | 'error' | 'info'} | null>(null)
  const [creating, setCreating] = useState(false)

  const [biEmails, setBiEmails] = useState<string[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [agentPhone, setAgentPhone] = useState('')
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [googleEmail, setGoogleEmail] = useState('')
  const [googleAppKey, setGoogleAppKey] = useState('')
  const [savingGoogle, setSavingGoogle] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingPhone, setSavingPhone] = useState(false)
  const [savingEmails, setSavingEmails] = useState(false)
  const [savingUltraMsg, setSavingUltraMsg] = useState(false)
  const [registeringWebhook, setRegisteringWebhook] = useState(false)
  const [ultraMsgInstance, setUltraMsgInstance] = useState('')
  const [ultraMsgToken, setUltraMsgToken] = useState('')
  const [clearing, setClearing] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const supabase = createClient()

  // Load existing config
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/settings/get-settings')
        
        if (!res.ok) {
          console.error('Failed to load settings:', res.status)
          return
        }
        
        const data = await res.json()
        
        if (data.evolutionInstance) {
          setInstanceName(data.evolutionInstance)
          setConnected(true)
        }
        
        if (data.settings?.biEmails) {
          setBiEmails(data.settings.biEmails)
        }
        if (data.settings?.googleEmail) {
          setGoogleEmail(data.settings.googleEmail)
        }
        if (data.settings?.googleAppKey) {
          setGoogleAppKey(data.settings.googleAppKey)
        }
        
        // Cargar el teléfono del perfil del usuario logueado
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUserEmail(user.email || '')
          const { data: profile } = await supabase
            .from('profiles')
            .select('phone, full_name')
            .eq('id', user.id)
            .single()
            
          if (profile?.phone) {
            setAgentPhone(profile.phone)
          }
          if (profile?.full_name) {
            setUserName(profile.full_name)
          }

          // Cargar Workspace para Ultramsg temporal
          const { data: workspace } = await supabase
            .from('workspaces')
            .select('ultramsg_instance_id, ultramsg_token')
            .eq('owner_id', user.id)
            .single()
            
          if (workspace) {
            setUltraMsgInstance(workspace.ultramsg_instance_id || '')
            setUltraMsgToken(workspace.ultramsg_token || '')
          }
        }

      } catch (err) {
        console.error('Error loading config:', err)
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  const handleClearInbox = async () => {
    setClearing(true)
    setShowClearConfirm(false)
    try {
      const res = await fetch('/api/workspace/clear-inbox', { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) {
        setNotification({ title: '✅ Bandeja limpiada', message: 'Todos los mensajes y contactos fueron eliminados.', type: 'success' })
      } else {
        setNotification({ title: 'Error', message: data.error || 'No se pudo limpiar la bandeja.', type: 'error' })
      }
    } catch {
      setNotification({ title: 'Error', message: 'Error de red al limpiar la bandeja.', type: 'error' })
    } finally {
      setClearing(false)
    }
  }

  const addEmail = () => {
    if (newEmail.trim() && newEmail.includes('@')) {
      setBiEmails(prev => [...prev, newEmail.trim()])
      setNewEmail('')
    }
  }

  const removeEmail = (idx: number) => {
    setBiEmails(prev => prev.filter((_, i) => i !== idx))
  }

  const handleTestConnection = async () => {
    if (!instanceName) {
      setTestResult({ ok: false, message: 'Falta nombre de instancia.' })
      return
    }
    
    setTesting(true)
    setTestResult(null)
    
    try {
      const res = await fetch('/api/settings/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceName })
      })
      const data = await res.json()
      
      if (res.ok && data.success) {
        setConnected(true)
        setQrCode(null)
        setShowQrModal(false)
        setTestResult({ ok: true, message: 'Conexión exitosa' })

        // Auto-guardar la instancia en la BD para que no se pierda al recargar
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: workspace } = await supabase
            .from('workspaces')
            .select('id')
            .eq('owner_id', user.id)
            .single()
            
        if (workspace) {
            // Use backend API to bypass RLS
            const saveRes = await fetch('/api/settings/save-instance', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ instanceName, userId: user.id })
            })
            const saveData = await saveRes.json()
            if (!saveRes.ok) console.error('Auto save error:', saveData.error)
            
            // Auto registrar webhook
            try {
              await fetch('/api/settings/set-webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ instanceName })
              })
            } catch(e) {
              console.error("Set webhook failed on auto-save", e)
            }
          }
        }

      } else {
        setConnected(false)
        setTestResult({ ok: false, message: data.error || 'Error de conexión' })
      }
    } catch (err) {
      setConnected(false)
      setTestResult({ ok: false, message: 'Error de red' })
    } finally {
      setTesting(false)
    }
  }

  const handleSaveConnection = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setNotification({ title: 'Error de Sesión', message: 'No se detectó tu sesión de usuario. Intenta recargar la página.', type: 'error' })
        return
      }
      
      if (!instanceName) {
        setNotification({ title: 'Sin Instancia', message: 'Primero crea una instancia antes de guardar.', type: 'error' })
        return
      }

      // Use backend API with service role to bypass RLS
      const saveRes = await fetch('/api/settings/save-instance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceName, userId: user.id })
      })
      const saveData = await saveRes.json()
      
      if (!saveRes.ok) throw new Error(saveData.error || 'Error guardando instancia')
      
      // Register webhook
      if (instanceName) {
        try {
          await fetch('/api/settings/set-webhook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ instanceName })
          })
        } catch(e) {
          console.error("Set webhook failed", e)
        }
      }

      setNotification({ title: 'Conexión Guardada', message: `Instancia '${instanceName}' guardada correctamente.`, type: 'success' })
    } catch (err: any) {
      console.error('Save error:', err)
      setNotification({ title: 'Error', message: err.message || 'Ocurrió un error al guardar la conexión.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveEmails = async () => {
    setSavingEmails(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id, settings')
        .eq('owner_id', user.id)
        .single()
        
      if (!workspace) return
      
      const currentSettings = workspace.settings as any || {}
      
      const { error } = await supabase
        .from('workspaces')
        .update({
          settings: {
            ...currentSettings,
            biEmails
          }
        })
        .eq('id', workspace.id)
        
      if (error) throw error

      setNotification({ title: 'Correos Guardados', message: 'La lista de correos BI ha sido actualizada.', type: 'success' })
    } catch (err) {
      console.error('Save error:', err)
      setNotification({ title: 'Error', message: 'Ocurrió un error al guardar los correos.', type: 'error' })
    } finally {
      setSavingEmails(false)
    }
  }

  const handleSaveGoogle = async () => {
    setSavingGoogle(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id, settings')
        .eq('owner_id', user.id)
        .single()
        
      if (!workspace) return
      
      const currentSettings = workspace.settings as any || {}
      
      const { error } = await supabase
        .from('workspaces')
        .update({
          settings: {
            ...currentSettings,
            googleEmail,
            googleAppKey
          }
        })
        .eq('id', workspace.id)
        
      if (error) throw error

      setNotification({ title: 'Credenciales Guardadas', message: 'La configuración de Google Mail ha sido actualizada.', type: 'success' })
    } catch (err) {
      console.error('Save error:', err)
      setNotification({ title: 'Error', message: 'Ocurrió un error al guardar las credenciales.', type: 'error' })
    } finally {
      setSavingGoogle(false)
    }
  }

  const handleSavePhone = async () => {
    setSavingPhone(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { error } = await supabase
        .from('profiles')
        .update({ phone: agentPhone })
        .eq('id', user.id)
        
      if (error) throw error

      setNotification({ title: 'Teléfono Guardado', message: 'Camila ahora te notificará a este número.', type: 'success' })
    } catch (err) {
      console.error('Save error:', err)
      setNotification({ title: 'Error', message: 'Ocurrió un error al guardar el teléfono.', type: 'error' })
    } finally {
      setSavingPhone(false)
    }
  }

  const handleSaveUltraMsg = async () => {
    setSavingUltraMsg(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { error } = await supabase
        .from('workspaces')
        .update({
          ultramsg_instance_id: ultraMsgInstance,
          ultramsg_token: ultraMsgToken
        })
        .eq('owner_id', user.id)
        
      if (error) throw error

      setNotification({ title: 'UltraMsg Guardado', message: 'Tus credenciales de UltraMsg han sido actualizadas.', type: 'success' })
    } catch (err) {
      console.error('Save error:', err)
      setNotification({ title: 'Error', message: 'Ocurrió un error al guardar UltraMsg.', type: 'error' })
    } finally {
      setSavingUltraMsg(false)
    }
  }

  const handleRegisterUltraMsgWebhook = async () => {
    if (!ultraMsgInstance || !ultraMsgToken) {
      setNotification({ title: 'Faltan Datos', message: 'Guarda primero tu Instance ID y Token', type: 'error' })
      return
    }

    setRegisteringWebhook(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', user.id)
        .single()
        
      if (!workspace) throw new Error('Workspace not found')

      const appBase = window.location.origin
      const webhookUrl = `${appBase}/api/messages/webhook?workspace_id=${workspace.id}`

      const res = await fetch('/api/settings/set-ultramsg-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          instanceId: ultraMsgInstance,
          token: ultraMsgToken
        })
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setNotification({ title: 'Webhook Registrado', message: 'Se ha configurado automáticamente en UltraMsg.', type: 'success' })
      } else {
        setNotification({ title: 'Error en UltraMsg', message: data.error || 'Ocurrió un error.', type: 'error' })
      }
    } catch (err) {
      console.error(err)
      setNotification({ title: 'Error', message: 'Ocurrió un error al registrar el Webhook.', type: 'error' })
    } finally {
      setRegisteringWebhook(false)
    }
  }

  const handleCreateInstance = async () => {
    setCreating(true)
    setQrCode(null)
    setTestResult(null)
    
    try {
      const res = await fetch('/api/settings/create-instance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setInstanceName(data.instanceName)
        if (data.qrcode && typeof data.qrcode === 'string') {
          let qr = data.qrcode
          if (!qr.startsWith('data:image')) qr = `data:image/png;base64,${qr}`
          setQrCode(qr)
        }
        setShowQrModal(true)
      } else {
        setNotification({ title: 'Error al Crear', message: data.error || 'Ocurrió un error al crear la instancia.', type: 'error' })
      }
    } catch(err) {
      console.error(err)
      setNotification({ title: 'Error de Red', message: 'No se pudo conectar con el servidor para crear la instancia.', type: 'error' })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="p-6 h-full overflow-auto space-y-4 max-w-2xl">
      {loading ? (
        <div className="flex h-full items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      ) : (
        <>
          {/* ── Perfil ── */}
      <Section>
        <p className="text-white font-semibold text-xs mb-4">Perfil</p>
        <div className="grid grid-cols-2 gap-3">
          {[['Nombre', userName || 'Cargando...'], ['Email', userEmail || 'Cargando...']].map(([l, v]) => (
            <div key={l}>
              <label className="text-[#475569] text-xs mb-1.5 block">{l}</label>
              <input
                defaultValue={v}
                readOnly
                className="w-full rounded-lg px-3 py-2.5 text-[#E2E8F0] text-xs focus:outline-none focus:border-emerald-500/40 transition-colors border bg-[#07090F]"
                style={{ borderColor: '#1E2537' }}
              />
            </div>
          ))}
        </div>

        {/* Notificaciones de Camila */}
        <div className="mt-5 pt-4 border-t border-[#141928]">
          <label className="text-white text-xs font-medium flex items-center gap-2 mb-2">
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            Teléfono para Notificaciones de Camila
          </label>
          <p className="text-[#94A3B8] text-[11px] mb-3">
            Camila te enviará notificaciones por WhatsApp a este número cuando haya quiebres o instalaciones exitosas.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="+56912345678"
              value={agentPhone}
              onChange={(e) => setAgentPhone(e.target.value)}
              className="flex-1 rounded-lg px-3 py-2 text-[#E2E8F0] text-sm focus:outline-none focus:border-emerald-500/40 transition-colors border"
              style={{ background: '#07090F', borderColor: '#1E2537' }}
            />
            <button
              onClick={handleSavePhone}
              disabled={savingPhone}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {savingPhone ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar Número
            </button>
          </div>
        </div>
      </Section>

      {/* ── WhatsApp / Evolution API ── */}
      <Section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white font-semibold text-xs">WhatsApp / Evolution API</p>
            <p className="text-[#475569] text-xs mt-0.5">Configura tu instancia para enviar y recibir mensajes.</p>
          </div>
          <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold border ${connected ? 'text-emerald-400 border-emerald-500/20' : 'text-rose-400 border-rose-500/20'}`}
            style={{ background: connected ? '#10b98110' : '#f43f5e10' }}>
            {connected ? <Wifi style={{ width: 11, height: 11 }} /> : <WifiOff style={{ width: 11, height: 11 }} />}
            {connected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-[#475569] text-xs mb-1.5 block">Nombre de Instancia (Auto-generado)</label>
            <input
              value={instanceName}
              readOnly
              placeholder="Haz clic en 'Crear Nueva Instancia'"
              className="w-full rounded-lg px-3 py-2.5 text-[#E2E8F0] text-xs focus:outline-none focus:border-emerald-500/40 transition-colors border placeholder-[#334155] opacity-70 cursor-not-allowed"
              style={{ background: '#07090F', borderColor: '#1E2537' }}
            />
          </div>

          {connected ? (
            <div className="pt-2 flex flex-col gap-2 rounded-lg border border-emerald-500/20 px-4 py-3 bg-emerald-500/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 text-xs font-semibold">Dispositivo vinculado correctamente</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleTestConnection}
                    disabled={testing}
                    className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline transition-colors disabled:opacity-50"
                  >
                    {testing ? 'Verificando...' : 'Verificar'}
                  </button>
                  <span className="text-[#1E2537]">|</span>
                  <button
                    onClick={() => {
                      setConnected(false)
                      setInstanceName('')
                      setTestResult(null)
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300 hover:underline transition-colors"
                  >
                    Desvincular
                  </button>
                </div>
              </div>
              {testResult && (
                <span className={`text-xs ${testResult.ok ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {testResult.message}
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleCreateInstance}
                disabled={creating || saving}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {creating ? 'Creando...' : 'Crear Nueva Instancia'}
              </button>
              <button
                onClick={handleTestConnection}
                disabled={testing || !instanceName}
                className="px-4 py-2 rounded-lg bg-[#1E2537] text-white text-xs font-semibold hover:bg-[#2A3441] transition-colors disabled:opacity-50"
              >
                {testing ? 'Probando...' : 'Probar Conexión'}
              </button>
              {testResult && (
                <span className={`text-xs ${testResult.ok ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {testResult.message}
                </span>
              )}
            </div>
          )}
          
          <div className="pt-2 border-t border-[#1E2537]">
            <button 
              onClick={handleSaveConnection}
              disabled={saving || !instanceName}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Guardando...' : 'Guardar Conexión'}
            </button>
          </div>
        </div>
      </Section>

      {/* ── Backoffice de Ingreso (BI) — User editable ── */}
      <Section>
        <div className="flex items-center justify-between mb-1">
          <p className="text-[#a78bfa] font-semibold text-xs">Backoffice de Ingreso (BI)</p>
        </div>
        <p className="text-[#475569] text-xs mb-4">Correos BI donde se envían los formatos de venta. Aparecen como opciones en Registro de Ventas.</p>
        <div className="space-y-2 mb-3">
          {biEmails.map((email, i) => (
            <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg border" style={{ background: '#07090F', borderColor: '#1E2537' }}>
              <span className="text-[#E2E8F0] text-xs flex-1 font-mono">{email}</span>
              <button onClick={() => removeEmail(i)} className="p-1 rounded-md text-rose-400 hover:bg-rose-500/10 transition-colors">
                <Trash2 style={{ width: 12, height: 12 }} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addEmail()}
            placeholder="correo@movistar.cl"
            className="flex-1 rounded-lg px-3 py-2 text-[#E2E8F0] text-xs border focus:outline-none focus:border-emerald-500/40 transition-colors placeholder-[#334155]"
            style={{ background: '#07090F', borderColor: '#1E2537' }}
          />
          <button onClick={addEmail} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[#a78bfa]/10 text-[#a78bfa] text-xs font-semibold border border-[#a78bfa]/20 hover:bg-[#a78bfa]/20 transition-colors">
            <Plus style={{ width: 12, height: 12 }} /> Agregar
          </button>
        </div>
        
        <div className="mt-4 pt-4 border-t border-[#1E2537]">
          <button 
            onClick={handleSaveEmails}
            disabled={savingEmails}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-[#a78bfa] text-white text-xs font-semibold hover:bg-[#9333ea] transition-colors shadow-lg shadow-[#a78bfa]/20 disabled:opacity-50"
          >
            {savingEmails ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {savingEmails ? 'Guardando...' : 'Guardar Correos BI'}
          </button>
        </div>
      </Section>

      {/* ── Configuración Google Mail ── */}
      <Section>
        <div className="flex items-center justify-between mb-1">
          <p className="text-blue-400 font-semibold text-xs flex items-center gap-2">
            <Mail className="w-4 h-4" /> Correo Institucional (Google)
          </p>
        </div>
        <p className="text-[#475569] text-xs mb-4">Credenciales SMTP/IMAP para enviar y leer correos con el Backoffice de Ingreso y TOA.</p>
        
        <div className="space-y-4">
          <div>
            <label className="text-[#475569] text-xs mb-1.5 block">Correo Electrónico (Gmail / Google Workspace)</label>
            <input
              type="email"
              value={googleEmail}
              onChange={(e) => setGoogleEmail(e.target.value)}
              placeholder="ventas@tuempresa.com"
              className="w-full rounded-lg px-3 py-2.5 text-[#E2E8F0] text-xs focus:outline-none focus:border-blue-500/40 transition-colors border bg-[#07090F] placeholder-[#334155]"
              style={{ borderColor: '#1E2537' }}
            />
          </div>
          <div>
            <label className="text-[#475569] text-xs mb-1.5 block">Contraseña de Aplicación (App Key)</label>
            <input
              type="password"
              value={googleAppKey}
              onChange={(e) => setGoogleAppKey(e.target.value)}
              placeholder="••••••••••••••••"
              className="w-full rounded-lg px-3 py-2.5 text-[#E2E8F0] text-xs focus:outline-none focus:border-blue-500/40 transition-colors border bg-[#07090F] placeholder-[#334155]"
              style={{ borderColor: '#1E2537' }}
            />
            <p className="text-[#64748B] text-[10px] mt-1.5">No uses tu clave personal. Genera una <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">Contraseña de Aplicación aquí</a>.</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-[#1E2537]">
          <button 
            onClick={handleSaveGoogle}
            disabled={savingGoogle}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50"
          >
            {savingGoogle ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {savingGoogle ? 'Guardando...' : 'Guardar Credenciales'}
          </button>
        </div>
      </Section>

      {/* ── Zona de Peligro ── */}
      <Section className="border-rose-500/20">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-rose-500/10 flex-shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex-1">
            <p className="text-rose-400 font-semibold text-sm">Zona de Peligro</p>
            <p className="text-[#475569] text-xs mt-1">
              Estas acciones son irreversibles. Úsalas solo si necesitas limpiar datos de prueba.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => setShowClearConfirm(true)}
                disabled={clearing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                style={{ borderColor: '#f43f5e30' }}
              >
                {clearing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                {clearing ? 'Limpiando...' : 'Limpiar toda la bandeja'}
              </button>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Confirmar Limpiar Bandeja ── */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-[#0C0F1A] border border-rose-500/30 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-[#1E2537]">
              <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" /> ¿Confirmar limpieza?
              </h3>
            </div>
            <div className="p-5">
              <p className="text-[#94A3B8] text-sm leading-relaxed">
                Esto eliminará <strong className="text-white">todos los mensajes de la bandeja</strong> de tu workspace. Los contactos y campañas <strong className="text-emerald-400">no se tocarán</strong>. Esta acción <strong className="text-rose-400">no se puede deshacer</strong>.
              </p>
            </div>
            <div className="p-4 bg-[#07090F] border-t border-[#1E2537] flex gap-2.5 justify-end">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-medium rounded-lg transition-colors border border-white/10"
              >
                Cancelar
              </button>
              <button
                onClick={handleClearInbox}
                disabled={clearing}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg transition-colors shadow-lg shadow-rose-500/20"
              >
                {clearing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Sí, limpiar todo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Zona de Limpieza ── */}
          <Section className="border-red-900/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-400 font-semibold text-xs mb-1">Zona de Peligro</p>
                <p className="text-[#64748B] text-xs">Borrar todos los mensajes y contactos de la bandeja.</p>
              </div>
              
              {!showClearConfirm ? (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs font-medium transition-colors"
                >
                  Limpiar Bandeja
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-3 py-2 rounded-lg bg-[#1E293B] hover:bg-[#334155] text-white text-xs font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleClearInbox}
                    disabled={clearing}
                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors flex items-center space-x-2"
                  >
                    {clearing ? <Loader2 className="w-3 h-3 animate-spin"/> : <Trash2 className="w-3 h-3" />}
                    <span>{clearing ? 'Limpiando...' : 'Sí, Borrar Todo'}</span>
                  </button>
                </div>
              )}
            </div>
          </Section>

          {/* ── UltraMsg (Solo para erml1903) ── */}
          {(userEmail?.toLowerCase() === 'erml1903@hotmail.com') && (
            <Section className="border-purple-500/30">
              <p className="text-purple-400 font-semibold text-xs mb-1 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4" />
                <span>UltraMsg (Legado - Acceso Temporal)</span>
              </p>
              <p className="text-[#64748B] text-xs mb-4">
                Uso exclusivo para transición. Estos mensajes saltan Evolution API.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[#475569] text-xs mb-1.5 block">Instance ID</label>
                  <input
                    type="text"
                    value={ultraMsgInstance}
                    onChange={(e) => setUltraMsgInstance(e.target.value)}
                    placeholder="Ej. instance83492"
                    className="w-full bg-[#0F1423] border border-[#1E293B] rounded-lg px-3 py-2 text-white text-xs placeholder-[#475569] focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                
                <div>
                  <label className="text-[#475569] text-xs mb-1.5 block">Token</label>
                  <input
                    type="text"
                    value={ultraMsgToken}
                    onChange={(e) => setUltraMsgToken(e.target.value)}
                    placeholder="Ej. dkx92md..."
                    className="w-full bg-[#0F1423] border border-[#1E293B] rounded-lg px-3 py-2 text-white text-xs placeholder-[#475569] focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                
                <div className="bg-[#0F1423] border border-[#1E293B] rounded-lg p-3">
                  <p className="text-[#64748B] text-[11px] mb-1">Tu URL de Webhook:</p>
                  <code className="text-emerald-500 text-xs select-all">https://whatssend-w6tu.vercel.app/api/messages/webhook</code>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 mt-4">
                  <button
                    onClick={handleSaveUltraMsg}
                    disabled={savingUltraMsg}
                    className="w-full sm:w-auto px-5 py-2 flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex flex-row items-center justify-center disabled:opacity-50 transition-colors"
                  >
                    {savingUltraMsg ? <Loader2 className="w-4 h-4 animate-spin" /> : '1. Guardar Credenciales'}
                  </button>
                  <button
                    onClick={handleRegisterUltraMsgWebhook}
                    disabled={registeringWebhook}
                    className="w-full sm:w-auto px-5 py-2 flex-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex flex-row items-center justify-center disabled:opacity-50 transition-colors"
                  >
                    {registeringWebhook ? <Loader2 className="w-4 h-4 animate-spin" /> : '2. Auto-Registrar Webhook'}
                  </button>
                </div>
              </div>
            </Section>
          )}

      {/* ── QR Modal ── */}
      {showQrModal && qrCode && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-[#0C0F1A] border border-[#1E2537] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#1E2537]">
              <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                <QrCode className="w-4 h-4 text-indigo-400" /> Vincular Dispositivo
              </h3>
              <button 
                onClick={() => { setShowQrModal(false); setQrCode(null) }}
                className="p-1.5 rounded-md hover:bg-white/5 transition-colors text-[#64748B] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6 flex flex-col items-center">
              <div className="bg-white p-2 rounded-xl shadow-inner mb-4">
                <img src={qrCode} alt="WhatsApp QR Code" className="w-60 h-60 object-contain" />
              </div>
              <p className="text-white text-sm font-medium mb-1 text-center">Escanea este código con WhatsApp</p>
              <p className="text-[#64748B] text-xs text-center">
                Abre WhatsApp en tu teléfono, ve a Dispositivos Vinculados, toca en "Vincular un dispositivo" y apunta tu cámara a esta pantalla. Luego presiona <strong className="text-white font-semibold">Probar Conexión</strong>.
              </p>
            </div>
            
            {/* Footer */}
            <div className="p-4 bg-[#07090F] border-t border-[#1E2537] flex justify-end">
              <button 
                onClick={() => setShowQrModal(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-medium rounded-lg transition-colors border border-white/10"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Notification Modal ── */}
      {notification && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="w-full max-w-sm bg-[#0C0F1A] border border-[#1E2537] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#1E2537]">
              <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                {notification.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : notification.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                ) : (
                  <MessageSquare className="w-4 h-4 text-indigo-400" />
                )}
                {notification.title}
              </h3>
              <button 
                onClick={() => setNotification(null)}
                className="p-1.5 rounded-md hover:bg-white/5 transition-colors text-[#64748B] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-5">
              <p className="text-[#E2E8F0] text-sm leading-relaxed">
                {notification.message}
              </p>
            </div>
            
            {/* Footer */}
            <div className="p-4 bg-[#07090F] border-t border-[#1E2537] flex justify-end">
              <button 
                onClick={() => setNotification(null)}
                className={`px-4 py-2 text-white text-xs font-semibold rounded-lg transition-colors ${
                  notification.type === 'success' ? 'bg-emerald-500 hover:bg-emerald-600' :
                  notification.type === 'error' ? 'bg-rose-500 hover:bg-rose-600' :
                  'bg-indigo-500 hover:bg-indigo-600'
                }`}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  )
}
