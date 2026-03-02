import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes max for background processing

export async function GET(request: NextRequest) {
  try {
    // 1. Validate Cron Secret (Para evitar llamadas públicas)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Bypass RLS for cron job
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    // 2. Traer todas las ventas pendientes de TOA de todos los workspaces activos
    const { data: ventasPendientes, error: fetchError } = await supabaseAdmin
      .from('ventas_toa')
      .select('*, workspace:workspaces(id, evolution_instance, bot_enabled)')
      .in('estado', ['PENDIENTE', 'REAGENDADO', 'INGRESADA'])
      .order('created_at', { ascending: true })
      
    if (fetchError || !ventasPendientes) {
      console.error('[CRON TOA] Error fetching sales:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch pending sales' }, { status: 500 })
    }

    if (ventasPendientes.length === 0) {
      return NextResponse.json({ message: 'No pending sales to process' }, { status: 200 })
    }

    const toaApiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.TOA_API_URL || 'http://89.167.104.163:8000'
    let processed = 0
    let notificationsSent = 0

    // 3. Iterar cada venta y consultar su estado contra el VPS TOA original
    for (const venta of ventasPendientes) {
      if (!venta.orden || venta.orden === '—') continue
      
      const workspace = venta.workspace as any
      if (!workspace || !workspace.bot_enabled || !workspace.evolution_instance) continue // Solo si tienen a Camila viva

      try {
        const res = await fetch(`${toaApiUrl}/api/toa/consultar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orden: venta.orden })
        })

        const data = await res.json()
        
        if (res.ok && data.ok && data.datos) {
          const d = data.datos
          const nuevoEstado = d.estado || 'PENDIENTE'
          
          // 4. Si el estado cambió, lo guardamos en BD
          if (nuevoEstado !== venta.estado && nuevoEstado !== 'No encontrada') {
            await supabaseAdmin
              .from('ventas_toa')
              .update({
                estado: nuevoEstado,
                obs: d.obs || venta.obs
              })
              .eq('id', venta.id)

            // 5. [MAGIA] Disparamos un Webhook Invisible a Camila Copiloto
            // Para eso, inyectamos un mensaje falso en Evolution API viniendo desde el número del sistema (o el propio dueño)
            
            const internalMessageText = `[SISTEMA INTERNO] Camila, urgente: La orden ${venta.orden} (RUT: ${venta.rut}) acaba de cambiar de estado a "${nuevoEstado}". Su observación de técnico es: "${d.obs || 'Ninguna'}". Avísame como vendedor tu recomendación brevemente.`
            
            // Tratamos de encontrar el número del dueño o vendedor para enviarle el aviso
            const { data: profile } = await supabaseAdmin
              .from('profiles')
              .select('phone')
              .eq('id', workspace.owner_id) // IDEALMENTE SERÍA EL ID DEL CREADOR DE LA VENTA, asumo owner temporalmente
              .single()

            if (profile?.phone) {
              const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
              // Hacemos un fetch recursivo a nuestro POST de webhook actuando como si el sistema fuera el teléfono del vendedor enviando la orden a si mismo
              await fetch(`${appUrl}/api/messages/webhook`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  instance: workspace.evolution_instance,
                  data: {
                    key: {
                      remoteJid: `${profile.phone}@s.whatsapp.net`,
                      fromMe: true, // Magia: Al ser fromMe true y remoteJid == phone, el webhhok lo toma como Copilot Direct Command.
                    },
                    message: {
                      conversation: internalMessageText
                    },
                    pushName: "Sistema de Monitoreo TOA"
                  },
                  sender: `${profile.phone}@s.whatsapp.net`
                })
              })
              notificationsSent++
            }
          }
          processed++
        }
      } catch (err) {
        console.error(`[CRON TOA] Error procesando venta ${venta.orden}:`, err)
      }
      
      // Esperar 1 segundo entre iteraciones para no saturar el VPS TOA
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    return NextResponse.json({ 
      message: 'Cron execution completed', 
      stats: { pendingFound: ventasPendientes.length, processed, notificationsTriggered: notificationsSent }
    }, { status: 200 })

  } catch (error) {
    console.error('[CRON TOA] Critical error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
