'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (authError) {
        setError(authError.message)
        return
      }

      router.push('/')
      router.refresh()
    } catch {
      setError('Ocurrió un error inesperado. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F1117] px-4">
      {/* Fondo con gradiente sutil */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5" />
      
      <div className="relative w-full max-w-md">
        {/* Logo y título */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mb-4 shadow-lg shadow-emerald-500/20">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">WhatsSend</h1>
          <p className="text-[#64748B] mt-1">Crea tu cuenta y comienza a conectar</p>
        </div>

        <Card className="border-[#1E2235] bg-[#1A1D27]/80 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-white">Crear Cuenta</CardTitle>
            <CardDescription className="text-[#64748B]">
              Completa tus datos para registrarte en WhatsSend
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-[#94A3B8]">
                  Nombre completo
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Juan Pérez"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="bg-[#0F1117] border-[#2A2F45] text-white placeholder:text-[#475569] focus:border-emerald-500 focus:ring-emerald-500/20 h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#94A3B8]">
                  Correo electrónico
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-[#0F1117] border-[#2A2F45] text-white placeholder:text-[#475569] focus:border-emerald-500 focus:ring-emerald-500/20 h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#94A3B8]">
                  Contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-[#0F1117] border-[#2A2F45] text-white placeholder:text-[#475569] focus:border-emerald-500 focus:ring-emerald-500/20 h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-[#94A3B8]">
                  Confirmar contraseña
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repite tu contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-[#0F1117] border-[#2A2F45] text-white placeholder:text-[#475569] focus:border-emerald-500 focus:ring-emerald-500/20 h-11"
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium transition-all duration-200 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  'Crear Cuenta'
                )}
              </Button>

              <div className="text-center pt-2">
                <p className="text-sm text-[#64748B]">
                  ¿Ya tienes cuenta?{' '}
                  <Link
                    href="/login"
                    className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                  >
                    Inicia sesión
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-[#475569] mt-6">
          © 2025 WhatsSend · CRM para WhatsApp
        </p>
      </div>
    </div>
  )
}
