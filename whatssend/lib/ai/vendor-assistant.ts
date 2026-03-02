import { generateText, tool } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createEvolutionClient } from '@/lib/whatsapp/evolution'
import { z } from 'zod'

const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY })

/**
 * processVendorAssistantMessage
 * Función que rutea y procesa todos los comandos y mensajes enviados por un VENDEDOR registrado
 * a Camila (operando en su "Modo Copiloto").
 */
export async function processVendorAssistantMessage(
  supabase: any,
  workspaceId: string,
  contact: any,
  messageBody: string,
  vendorProfile: { id: string, full_name: string | null, phone: string | null }
) {
  const vendorName = vendorProfile.full_name?.split(' ')[0] || 'Vendedor'
  
  // 1. Obtener historial del Copiloto
  const { data: messagesData } = await supabase
    .from('messages')
    .select('body, direction, created_at')
    .eq('workspace_id', workspaceId)
    .eq('contact_id', contact.id)
    .order('created_at', { ascending: true })
    .limit(15)

  const history = (messagesData || []).map((m: any) => ({
    role: m.direction === 'inbound' ? 'user' : 'assistant',
    content: m.body
  }))

  history.push({ role: 'user', content: messageBody })

  const now = new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' })
  const { INITIAL_BA_PERSONAS } = await import('@/lib/config/backoffice')
  const schedulesInfo = INITIAL_BA_PERSONAS.map(p => `${p.nombre} (${p.horario})`).join(', ')

  // 2. Prompt del Copiloto "Camila Asistente"
  const systemPrompt = `
Eres Camila, el Asistente Experto (Copiloto) en Ventas de Fibra Óptica del equipo.
Actualmente estás hablando por WhatsApp privado con uno de los Vendedores de la empresa: ${vendorName}.
Tus tareas principales como copiloto son asistirlo en su día a día en terreno.

REGLAS DE COPILOTO LIMITADAS A VENTAS:
1. IMPORTANTE: Somos el equipo de VENTAS de Movistar. Vendemos el servicio, pero NO tenemos mesa de ayuda, ni soporte técnico, ni vemos postventa de instalaciones en terreno.
2. Si el vendedor reporta problemas TÉCNICOS (ej. técnico dejó desorden, técnico fuera de ruta, orden caída en terreno, sin validación técnica):
   - NO DEBES ESCALAR EL CASO A NADIE DEL BACKOFFICE.
   - Pide el RUT (si no lo tienes), usa 'consultar_orden_toa' para ver la observación, e indícale al vendedor que le diga a su cliente que llame directo al 600 600 3000 de Movistar porque nosotros no atendemos esos casos.
3. ESCALACIONES ADMINISTRATIVAS (Agenda / Seguimiento):
   - Usa la herramienta para escalar SOLO para reagendar una venta, contactar al cliente para coordinar, o dudas estricta y puramente administrativas de ingreso.
   - HORARIOS BACKOFFICE: Hoy/Ahora es ${now}. Horarios oficiales: ${schedulesInfo}.
   - ANTES de derivar algo a Agenda o Seguimiento, usa tu lógica para verificar si esa área está dentro de su horario laboral ahora mismo. Si están fuera de horario, NO uses la herramienta escalar; explícale al vendedor que a esta hora no hay ningún back disponible.
4. Mantén tus respuestas A EXTREMA BREVEDAD (1-2 párrafos máximo), usando emojis funcionales 📋✅🚨 y tutéalo amablemente.

Si el sistema te ha enviado un mensaje que inicia con "[SISTEMA INTERNO]", significa que el monitoreo automático (CRON) detectó un cambio en una orden de ${vendorName}. Debes resumirle la alerta y preguntarle qué acción desea tomar.
`

  // 3. Generar respuesta con Tool Calling
  const result = await generateText({
    model: openai('gpt-4o'),
    system: systemPrompt,
    messages: history as any,
    tools: {
      consultar_orden_toa: tool({
        description: 'Consulta el estado EN VIVO de una orden en TOA en tiempo real.',
        inputSchema: z.object({
          orden: z.string().describe('Número de orden de 10-12 dígitos')
        }),
        execute: async ({ orden }) => {
          try {
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
            const res = await fetch(`${appUrl}/api/toa/consultar`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orden })
            })
            const data = await res.json()
            if (res.ok && data.ok) return `El estado en TOA es: ${data.datos?.estado}. Observaciones de terreno: ${data.datos?.obs || 'Ninguna'}.`
            return 'No se encontró la orden en el sistema TOA o hubo un error de conexión.'
          } catch {
            return 'Ocurrió un error al contactar el servidor de scraping.'
          }
        }
      }),
      escalar_caso_backoffice: tool({
        description: 'Escala un requerimiento urgente del vendedor según el área correcta (solo administrativo).',
        inputSchema: z.object({
          area: z.enum(['PRECHEQUEO', 'SEGUIMIENTO', 'AGENDA']).describe('AGENDA/SEGUIMIENTO solo para reagendar u orden administrativa. Nunca para fallas técnicas.'),
          mensaje_urgencia: z.string().describe('Cuerpo del mensaje que quieres que le transmitas al área.')
        }),
        execute: async ({ area, mensaje_urgencia }) => {
          try {
            const { INITIAL_BA_PERSONAS, INITIAL_BP_PERSONAS } = await import('@/lib/config/backoffice')
            
            let destino: string | undefined
            
            if (area === 'PRECHEQUEO') {
               // Lógica dinámica de turnos (copiada de sales-agent)
               const nowChile = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Santiago' }))
               const hourInt = nowChile.getHours()
               const anchorDate = new Date('2026-03-02T00:00:00-03:00')
               const diffTime = Math.max(0, nowChile.getTime() - anchorDate.getTime())
               const currentWeek = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000))
               
               const isGabrielaAMWeek = currentWeek % 2 === 0
               let bpData = INITIAL_BP_PERSONAS[0]
               
               if (isGabrielaAMWeek) {
                 bpData = hourInt < 15 ? INITIAL_BP_PERSONAS[1] : INITIAL_BP_PERSONAS[0]
               } else {
                 bpData = hourInt < 15 ? INITIAL_BP_PERSONAS[0] : INITIAL_BP_PERSONAS[1]
               }
               
               destino = bpData?.contacto || INITIAL_BA_PERSONAS[0]?.contacto
               
            } else if (area === 'SEGUIMIENTO') {
               destino = INITIAL_BA_PERSONAS.find(p => p.nombre.includes('Andrea Viloria'))?.contacto || INITIAL_BA_PERSONAS[0]?.contacto
            } else if (area === 'AGENDA') {
               destino = INITIAL_BA_PERSONAS.find(p => p.nombre.includes('Susana Soto'))?.contacto || INITIAL_BA_PERSONAS[0]?.contacto
            }
            
            if (destino) {
              const { data: ws } = await supabase.from('workspaces').select('evolution_instance').eq('id', workspaceId).single()
              if (ws?.evolution_instance) {
                const evoClient = createEvolutionClient(null, null, ws.evolution_instance)
                const header = `🚨 *ESCALACIÓN DESDE VENDEDOR (${vendorName})* 🚨\n📍 Área: ${area}\n\n`
                
                // Formatear el teléfono de destino
                let targetPhone = destino.replace(/\D/g, '')
                if (!targetPhone.includes('@')) targetPhone = `${targetPhone}@s.whatsapp.net`

                await evoClient.sendMessage(targetPhone, header + mensaje_urgencia)
                return `El caso fue derivado exitosamente al WhatsApp de ${area} (${destino}).`
              }
            }
            return 'No se encontró el WhatsApp destino del área solicitada. Recomiéndale al vendedor llamar directamente.'
          } catch {
            return 'Error al intentar despachar mensaje a Evolution API.'
          }
        }
      })
    }
  })

  const answer = result.text

  // 4. Guardar respuesta de Camila y Enviar por WhatsApp
  if (answer && answer.trim().length > 0) {
    const { data: wsData } = await supabase
      .from('workspaces')
      .select('evolution_instance, bot_enabled')
      .eq('id', workspaceId)
      .single()

    if (wsData?.evolution_instance) {
      const evoClient = createEvolutionClient(null, null, wsData.evolution_instance)
      
      // Formatear contact.phone
      let targetPhone = contact.phone.replace(/\D/g, '')
      if (!targetPhone.includes('@')) targetPhone = `${targetPhone}@s.whatsapp.net`

      await evoClient.sendMessage(targetPhone, answer)

      await supabase.from('messages').insert({
        workspace_id: workspaceId,
        contact_id: contact.id,
        direction: 'outbound',
        body: answer,
        status: 'sent',
        evolution_message_id: null,
        sent_at: new Date().toISOString()
      })
    }
  }
}
