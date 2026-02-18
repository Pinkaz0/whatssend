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

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message === 'Invalid login credentials'
          ? 'Credenciales inválidas. Verifica tu email y contraseña.'
          : authError.message
        )
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
          <p className="text-[#64748B] mt-1">Tu plataforma CRM para WhatsApp</p>
        </div>

        <Card className="border-[#1E2235] bg-[#1A1D27]/80 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-white">Iniciar Sesión</CardTitle>
            <CardDescription className="text-[#64748B]">
              Ingresa tus credenciales para acceder a tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-[#94A3B8]">
                    Contraseña
                  </Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                    Ingresando...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>

              <div className="text-center pt-2">
                <p className="text-sm text-[#64748B]">
                  ¿No tienes cuenta?{' '}
                  <Link
                    href="/register"
                    className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                  >
                    Regístrate aquí
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
