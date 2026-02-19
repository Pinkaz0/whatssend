'use client'

// Pruebas locales con ngrok: true = usa la URL de ngrok como base del webhook. Cambiar a false al terminar.
const USE_NGROK_WEBHOOK_FOR_TESTING = true
const NGROK_WEBHOOK_BASE = 'https://af4f-181-43-210-243.ngrok-free.app'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Settings,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  XCircle,
  Copy,
  ExternalLink,
  Wifi,
} from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [configuringWebhook, setConfiguringWebhook] = useState(false)

  // Workspace data
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [workspaceName, setWorkspaceName] = useState('')
  const [instanceId, setInstanceId] = useState('')
  const [token, setToken] = useState('')
  const [showToken, setShowToken] = useState(false)

  // Profile data
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')

  // Google Integration
  const [googleEmail, setGoogleEmail] = useState('')
  const [googleKey, setGoogleKey] = useState('')
  const [showGoogleKey, setShowGoogleKey] = useState(false)

  // Webhook URL: en pruebas (ngrok) una sola URL. En producción usa NEXT_PUBLIC_APP_URL (Vercel) o origin.
  const [webhookUrl, setWebhookUrl] = useState('')
  useEffect(() => {
    const base = USE_NGROK_WEBHOOK_FOR_TESTING
      ? NGROK_WEBHOOK_BASE
      : (process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : ''))
    if (!base) return
    const path = '/api/messages/webhook'
    const query = !USE_NGROK_WEBHOOK_FOR_TESTING && workspaceId ? `?workspace_id=${workspaceId}` : ''
    setWebhookUrl(`${base}${path}${query}`)
  }, [workspaceId])

  // Cargar datos al montar
  useEffect(() => {
    async function loadSettings() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setEmail(user.email || '')

      // Profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      if (profile) setFullName(profile.full_name || '')

      // Workspace
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id, name, ultramsg_instance_id, ultramsg_token, google_account_email, google_private_key')
        .eq('owner_id', user.id)
        .limit(1)
        .maybeSingle()

      if (workspace) {
        setWorkspaceId(workspace.id)
        setWorkspaceName(workspace.name)
        setInstanceId(workspace.ultramsg_instance_id || '')
        setToken(workspace.ultramsg_token || '')
        setGoogleEmail(workspace.google_account_email || '')
        setGoogleKey(workspace.google_private_key || '')
      }

      setLoading(false)
    }

    loadSettings()
  }, [])

  // Guardar credenciales UltraMsg
  const handleSave = async () => {
    if (!workspaceId && !workspaceName) {
      toast.error('Ingresa un nombre para tu workspace')
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if (workspaceId) {
        // Actualizar workspace existente
        const { error } = await supabase
          .from('workspaces')
          .update({
            name: workspaceName,
            ultramsg_instance_id: instanceId || null,
            ultramsg_token: token || null,
            google_account_email: googleEmail || null,
            google_private_key: googleKey || null,
          })
          .eq('id', workspaceId)

        if (error) throw error
      } else {
        // Crear nuevo workspace
        const { data, error } = await supabase
          .from('workspaces')
          .insert({
            name: workspaceName || 'Mi Workspace',
            owner_id: user.id,
            ultramsg_instance_id: instanceId || null,
            ultramsg_token: token || null,
            google_account_email: googleEmail || null,
            google_private_key: googleKey || null,
          })
          .select('id')
          .single()

        if (error) throw error
        setWorkspaceId(data.id)
      }

      // Actualizar perfil
      await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id)

      toast.success('Configuración guardada')
      setConnectionStatus('idle')
    } catch (err) {
      console.error('[Settings] Save error:', err)
      toast.error('Error al guardar configuración')
    } finally {
      setSaving(false)
    }
  }

  // Probar conexión UltraMsg
  const handleTestConnection = async () => {
    if (!instanceId || !token) {
      toast.error('Ingresa el Instance ID y Token primero')
      return
    }

    setTesting(true)
    setConnectionStatus('idle')
    try {
      const res = await fetch('/api/settings/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceId, token }),
      })

      const data = await res.json()

      if (data.success) {
        setConnectionStatus('success')
        toast.success('Conexión exitosa', { description: data.message })
      } else {
        setConnectionStatus('error')
        toast.error('Conexión fallida', { description: data.error })
      }
    } catch {
      setConnectionStatus('error')
      toast.error('Error de conexión')
    } finally {
      setTesting(false)
    }
  }

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl)
    toast.success('URL copiada al portapapeles')
  }

  const handleSetWebhookInUltraMsg = async () => {
    if (!webhookUrl) return
    setConfiguringWebhook(true)
    try {
      const res = await fetch('/api/settings/set-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Webhook configurado', { description: data.message })
      } else {
        toast.error('Error', { description: data.error })
      }
    } catch {
      toast.error('Error al configurar webhook')
    } finally {
      setConfiguringWebhook(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-emerald-400" />
          Configuración
        </h1>
        <p className="text-[#64748B] mt-1">
          Administra tu perfil y credenciales de UltraMsg
        </p>
      </div>

      {/* Perfil */}
      <Card className="bg-[#1A1D27] border-[#1E2235]">
        <CardHeader>
          <CardTitle className="text-white text-lg">Perfil</CardTitle>
          <CardDescription className="text-[#64748B]">
            Tu información personal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[#94A3B8]">Nombre completo</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Tu nombre"
              className="bg-[#0F1117] border-[#2A2F45] text-white placeholder:text-[#475569] focus:border-emerald-500 h-10"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[#94A3B8]">Email</Label>
            <Input
              value={email}
              disabled
              className="bg-[#0F1117] border-[#2A2F45] text-[#64748B] h-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Workspace */}
      <Card className="bg-[#1A1D27] border-[#1E2235]">
        <CardHeader>
          <CardTitle className="text-white text-lg">Workspace</CardTitle>
          <CardDescription className="text-[#64748B]">
            Configuración de tu espacio de trabajo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[#94A3B8]">Nombre del workspace</Label>
            <Input
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="Mi Empresa"
              className="bg-[#0F1117] border-[#2A2F45] text-white placeholder:text-[#475569] focus:border-emerald-500 h-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* UltraMsg */}
      <Card className="bg-[#1A1D27] border-[#1E2235]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white text-lg">UltraMsg</CardTitle>
              <CardDescription className="text-[#64748B]">
                Credenciales para enviar y recibir mensajes de WhatsApp
              </CardDescription>
            </div>
            {connectionStatus === 'success' && (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                <CheckCircle className="w-3 h-3 mr-1" />
                Conectado
              </Badge>
            )}
            {connectionStatus === 'error' && (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                <XCircle className="w-3 h-3 mr-1" />
                Error
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Instance ID */}
          <div className="space-y-2">
            <Label className="text-[#94A3B8]">Instance ID</Label>
            <Input
              value={instanceId}
              onChange={(e) => { setInstanceId(e.target.value); setConnectionStatus('idle') }}
              placeholder="instance12345"
              className="bg-[#0F1117] border-[#2A2F45] text-white placeholder:text-[#475569] focus:border-emerald-500 h-10 font-mono text-sm"
            />
          </div>

          {/* Token */}
          <div className="space-y-2">
            <Label className="text-[#94A3B8]">Token</Label>
            <div className="relative">
              <Input
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e) => { setToken(e.target.value); setConnectionStatus('idle') }}
                placeholder="••••••••••••••••"
                className="bg-[#0F1117] border-[#2A2F45] text-white placeholder:text-[#475569] focus:border-emerald-500 h-10 font-mono text-sm pr-10"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] hover:text-white transition-colors"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Test Connection */}
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={testing || !instanceId || !token}
            className="border-[#2A2F45] text-[#94A3B8] hover:text-white hover:bg-[#0F1117] hover:border-emerald-500/50"
          >
            {testing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Wifi className="w-4 h-4 mr-2" />
            )}
            Probar Conexión
          </Button>

          <Separator className="bg-[#1E2235]" />

          {/* Webhook URL (única por workspace; en pruebas usa base ngrok) */}
          <div className="space-y-2">
            <Label className="text-[#94A3B8]">Webhook URL</Label>
            <p className="text-xs text-[#475569]">
              Para recibir mensajes en la bandeja, UltraMsg debe tener esta URL y la opción &quot;message received&quot; activada. Usa el botón para configurarlo automáticamente.
            </p>
            {USE_NGROK_WEBHOOK_FOR_TESTING && (
              <p className="text-xs text-amber-500/90">
                Modo pruebas: usando ngrok. Al terminar, pon USE_NGROK_WEBHOOK_FOR_TESTING = false en settings/page.tsx.
              </p>
            )}
            <div className="flex items-center gap-2">
              <Input
                value={webhookUrl}
                readOnly
                className="bg-[#0F1117] border-[#2A2F45] text-emerald-400 h-10 font-mono text-xs flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyWebhookUrl}
                className="border-[#2A2F45] text-[#64748B] hover:text-white hover:bg-[#0F1117] h-10 w-10 flex-shrink-0"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={handleSetWebhookInUltraMsg}
              disabled={configuringWebhook || !instanceId || !token || !webhookUrl}
              className="border-[#2A2F45] text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50"
            >
              {configuringWebhook ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Configurar webhook en UltraMsg
            </Button>
          </div>

          {/* Link to UltraMsg */}
          <a
            href="https://ultramsg.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Abrir panel de UltraMsg
          </a>
        </CardContent>
      </Card>

      {/* Google Sheets Integration */}
      <Card className="bg-[#1A1D27] border-[#1E2235]">
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="#4285F4"/><path d="M12 6v12l4-4-4 4-4-4" stroke="#34A853" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Integración Google Sheets
          </CardTitle>
          <CardDescription className="text-[#64748B]">
            Credenciales de Service Account para importar contactos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[#94A3B8]">Google Account Email</Label>
            <Input
              value={googleEmail}
              onChange={(e) => setGoogleEmail(e.target.value)}
              placeholder="service-account@project.iam.gserviceaccount.com"
              className="bg-[#0F1117] border-[#2A2F45] text-white placeholder:text-[#475569] h-10 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[#94A3B8]">Private Key</Label>
            <div className="relative">
              <Input
                type={showGoogleKey ? 'text' : 'password'}
                value={googleKey}
                onChange={(e) => setGoogleKey(e.target.value)}
                placeholder="-----BEGIN PRIVATE KEY-----..."
                className="bg-[#0F1117] border-[#2A2F45] text-white placeholder:text-[#475569] h-10 font-mono text-xs pr-10"
              />
              <button
                type="button"
                onClick={() => setShowGoogleKey(!showGoogleKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] hover:text-white transition-colors"
              >
                {showGoogleKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botón Guardar */}
      <div className="flex justify-end pb-6">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium px-8 shadow-lg shadow-emerald-500/20"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            'Guardar Configuración'
          )}
        </Button>
      </div>
    </div>
  )
}
