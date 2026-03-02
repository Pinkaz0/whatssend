import { generateText, tool } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { createEvolutionClient } from '@/lib/whatsapp/evolution'
import { INITIAL_BA_PERSONAS, INITIAL_BP_PERSONAS } from '@/lib/config/backoffice'

// Initialize OpenAI provider
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Tipos de Estado de Camila (Blueprint)
export type AgentState = 
  // --- NUEVA ARQUITECTURA CAMILA V1.0 ---
  | 'CONTACTO_INICIAL'
  | 'CALIFICACION_RAPIDA'
  | 'PRECHEQUEO_PENDIENTE'
  | 'EVALUACION_RESULTADO'
  | 'OFERTA_ENVIADA'
  | 'DATOS_VENTA'
  | 'VENTA_INGRESADA'
  | 'INSTALACION_PENDIENTE'
  // --- LEGACY ---
  | 'PRECHEQUE_PENDIENTE'
  | 'BIOMETRIA_PENDIENTE'
  | 'BIOMETRIA_OK'
  | 'ESPERANDO_CODIGO'
  | 'CODIGO_DISPONIBLE'
  | 'FORMATO_ENVIADO_BI'
  | 'ORDEN_INGRESADA'
  | 'SEGUIMIENTO_TOA'
  | 'COMPLETADA'
  | 'CANCELADA'
  | 'DESCARTADA'

export async function processAgentMessage(
  supabase: any,
  workspaceId: string,
  remoteJid: string,
  messageText: string,
  workspaceConfig: any
) {
  // 1. Obtener o crear la sesión de Camila
  let { data: session } = await supabase
    .from('agent_sessions')
    .select('*')
    .eq('remote_jid', remoteJid)
    .single()

  if (!session) {
    const { data: newSession, error: createError } = await supabase
      .from('agent_sessions')
      .insert({
        remote_jid: remoteJid,
        workspace_id: workspaceId,
        estado: 'CONTACTO_INICIAL',
        context: {}
      })
      .select()
      .single()

    if (createError) {
      console.error('[Camila] Error creating session:', createError)
      return null
    }
    session = newSession

    // Inyectar contexto inicial para que no salude como robot y entienda que empieza recién
    await supabase.from('agent_messages').insert({
      session_id: session.id,
      role: 'system',
      content: `[INSTRUCCIÓN INICIAL]: Acabas de recibir el primer mensaje de este prospecto. Saluda UNA SOLA VEZ, de forma muy natural y corta. Si el cliente ya te dio su RUT en su primer mensaje, NO SE LO PIDAS DE NUEVO.`
    })
  }

  // 2. Guardar mensaje del usuario
  await supabase.from('agent_messages').insert({
    session_id: session.id,
    role: 'user',
    content: messageText
  })

  // 3. Obtener el historial completo
  const { data: rawHistory } = await supabase
    .from('agent_messages')
    .select('role, content')
    .eq('session_id', session.id)
    .order('created_at', { ascending: true })

  // 3.5 Filtrar historial para ocultarle a Camila nuestros logs de depuración
  const history = (rawHistory || []).filter((m: any) => !(m.content || '').startsWith('[DEBUG-LOG]'))

  // 4. Cargar RAG (Archivos y Prompts configurados en UI)
  const ragContent = await getRagContent(supabase, workspaceId)
  
  const botSystemPrompt = workspaceConfig?.bot_system_prompt 
    || `Eres Camila, una super agente de ventas de Fibra Óptica Movistar que opera por WhatsApp. Tu comportamiento, personalidad, voz y reglas están definidos para vender con excelencia.`
  
  const botCustomInstructions = workspaceConfig?.bot_custom_instructions
    ? `\n\nINSTRUCCIONES DEL SÚPER AGENTE (Administrador):\n${workspaceConfig.bot_custom_instructions}`
    : ''
    
  // 4.5 Detectar Tono del Cliente
  const tone = detectTone(history)
  console.log(`[Camila] Estado actual: ${session.estado} | Tono detectado: ${tone}`)

  // 5. Seleccionar el System Prompt basado en el Estado
  const systemPrompt = getSystemPromptForState(
    session.estado, 
    botSystemPrompt, 
    botCustomInstructions, 
    ragContent.general, 
    ragContent.offers,
    tone
  )

  // 5.5 Guardar Log Silencioso en BD para Auditoría del Usuario
  await supabase.from('agent_messages').insert({
    session_id: session.id,
    role: 'system',
    content: `[DEBUG-LOG]\n=== ESTADO ===\n${session.estado}\n=== TONO ===\n${tone}\n=== SYSTEM PROMPT INYECTADO ===\n${systemPrompt}`
  })

  // 6. Llamar a GPT-4o vía Vercel AI SDK con Tools
  try {
    const { text, toolCalls, toolResults } = await generateText({
      model: openai('gpt-4o'),
      system: systemPrompt,
      messages: history.map((m: any) => ({
        role: m.role,
        content: m.content
      })),
      tools: {
        solicitar_precheque: tool({
          description: 'Solicita al equipo humano de BackOffice que verifique la factibilidad técnica y crediticia de un cliente. Úsalo SOLO cuando el cliente ya te dio su RUT y Dirección y te solicitó explícitamente validar la cobertura. NO LO USES SI FALTAN ESTOS DATOS.',
          inputSchema: z.object({
            rut: z.string().describe('El RUT del cliente, sin puntos y con guión. Ej: 19345678-9'),
            direccion: z.string().describe('La dirección completa que entregó el cliente (calle, número, comuna).'),
            mensaje_para_andrea: z.string().describe('Redacta un mensaje saludando: "Hola [nombre de back], me llamo Camila y soy una vendedora virtual, me puedes ayudar a verificar el rut y factibilidad de [datos]".')
          }),
          execute: async ({ rut, direccion, mensaje_para_andrea }) => {
            console.log(`[Camila Tool] Ejecutando solicitar_precheque -> RUT: ${rut}, Dir: ${direccion}`)
            
            try {
              // Cálculo dinámico de rotación semanal de turnos (Ana y Gabriela)
              const nowChile = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Santiago' }))
              const hourInt = nowChile.getHours()
              
              // Fecha Ancla: Lunes 02 de Marzo de 2026 (Semana de Gabriela AM)
              const anchorDate = new Date('2026-03-02T00:00:00-03:00')
              const diffTime = Math.max(0, nowChile.getTime() - anchorDate.getTime())
              const currentWeek = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000))
              
              let bpData = INITIAL_BP_PERSONAS[0] // Default Ana
              
              // Si currentWeek es par (0, 2, 4...) -> Gabriela AM, Ana PM
              // Si currentWeek es impar (1, 3, 5...) -> Ana AM, Gabriela PM
              const isGabrielaAMWeek = currentWeek % 2 === 0
              
              if (isGabrielaAMWeek) {
                // Semana par desde el ancla: Gabriela AM, Ana PM
                // AM es hasta las 15:00 hrs
                bpData = hourInt < 15 ? INITIAL_BP_PERSONAS[1] : INITIAL_BP_PERSONAS[0]
              } else {
                // Semana impar desde el ancla: Ana AM, Gabriela PM
                bpData = hourInt < 15 ? INITIAL_BP_PERSONAS[0] : INITIAL_BP_PERSONAS[1]
              }

              const bpPhone = bpData && bpData.contacto ? bpData.contacto.replace(/\D/g, '') : '56900000000'
              const bpName = bpData && bpData.nombre ? bpData.nombre.split(' ')[0] : 'nuestro equipo'
              
              const prechequeoPhone = workspaceConfig?.prechequeo_phone || process.env.PRECHEQUEO_PHONE || bpPhone
              
              const evoClient = createEvolutionClient(
                null, 
                null, 
                workspaceConfig.evolution_instance
              )

              const textMsg = `🤖✨ *NUEVA SOLICITUD DE PRECHEQUEO*\n\n${mensaje_para_andrea}\n\n*📌 Datos a Verificar:*\n*RUT:* ${rut}\n*Dirección:* ${direccion}\n\n⚠️ Por favor, indícame en texto el *VCP*, *LC* y si la factibilidad está *OK*.`
              
              await evoClient.sendMessage(prechequeoPhone, textMsg)

              // 2. Simular el envío al backoffice en la DB y darle una pista a la IA
              await supabase.from('agent_messages').insert({
                session_id: session.id,
                role: 'system',
                content: `[SISTEMA INTERNO]: Envié los datos a **${bpName}** (Área de Prechequeo). AHORA: Dile al cliente "Genial, ya le pasé los datos a ${bpName} para la validación de cobertura." E INMEDIATAMENTE APROVECHA PARA VENDER: Háblale de la superioridad tecnológica de la fibra Movistar, pregúntale para qué usa más el internet e inclina la balanza hacia la venta técnica (velocidad simétrica, estabilidad, decos). NO hagas plática casual, eres una VENDEDORA cerradora. NO vuelvas a pedir RUT ni dirección.`
              })
              
              // 3. Avanzar el estado de la máquina en DB directo
              await supabase
                .from('agent_sessions')
                .update({ 
                  estado: 'PRECHEQUEO_PENDIENTE',
                  context: { ...session.context, rut, direccion }
                })
                .eq('id', session.id)

              return { 
                success: true, 
                message: `Prechequeo enviado a ${bpName}. Empieza a VENDER los atributos de nuestra Fibra Óptica para calentar el cierre mientras esperamos. No repitas saludos.` 
              }
            } catch (err) {
              console.error('[Camila Tool] Falló el envío a Andrea', err)
              return {
                success: false,
                message: `No se pudo enviar la solicitud al backoffice en este momento.`
              }
            }
          }
        }),
        ingresar_venta_backoffice: tool({
          description: 'Envía el formato de ingreso de venta al Backoffice de Ingreso cuando el cliente ya aceptó y recogiste todos los datos.',
          inputSchema: z.object({
            rut: z.string(),
            nombre_completo: z.string(),
            direccion_completa: z.string(),
            comuna: z.string(),
            plan_seleccionado: z.string(),
            correo_cliente: z.string(),
            telefono_contacto: z.string()
          }),
          execute: async (datos) => {
            console.log('[Camila Tool] Ejecutando ingresar_venta_backoffice', datos)
            try {
              // Enviar el Payload de Venta por correo electrónico (SMTP Dinámico de Base de Datos que creamos)
              // Insertamos temporalmente en pipeline_leads o mandamos directo a BackOffice
              const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
              
              // Hacemos una inserción rápida del Lead en Pipeline_leads (o asimilado) para que el API Endpoint SMTP lo lea
              const { data: newLead } = await supabase.from('pipeline_leads').insert({
                workspace_id: workspaceId,
                contact_id: session.contact_id, // Necesitaríamos contact_id en la session
                full_name: datos.nombre_completo,
                rut: datos.rut,
                address: datos.direccion_completa,
                comuna: datos.comuna,
                service: datos.plan_seleccionado,
                email: datos.correo_cliente,
                install_phone: datos.telefono_contacto,
                status: 'new'
              }).select('id').single()

              if (newLead) {
                // Invocamos el endpoint de correo (Nodemailer) del Paso 2
                fetch(`${appUrl}/api/pipeline/send-to-backoffice`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ leadId: newLead.id })
                }).catch(e => console.error('[Camila] Falló el trigger de mail', e))
              }

              await supabase.from('agent_messages').insert({
                  session_id: session.id,
                  role: 'system',
                  content: `[SISTEMA INTERNO]: Formato de ingreso procesado y enviado por correo Gmail al Backoffice. Dile al cliente que su venta fue ingresada con éxito y que un instalador lo contactará.`
              })
              // Avanzar el estado de la sesión
              await supabase.from('agent_sessions').update({ estado: 'VENTA_INGRESADA' }).eq('id', session.id)
              return { success: true, message: 'Venta ingresada correctamente' }
            } catch (err) {
              console.error('[Camila] Error al ingresar venta', err)
              return { success: false, message: 'Fallo al procesar ingreso.' }
            }
          }
        }),
        crear_caso_tecnico: tool({
          description: 'Crea un caso técnico (Escenario B: sin vacancia, problema de cableado, etc) y lo envía internamente para habilitar la factibilidad.',
          inputSchema: z.object({
            rut: z.string(),
            direccion_completa: z.string(),
            entre_calles: z.string(),
            correo_cliente: z.string(),
            telefono_contacto: z.string(),
            problema_direccion: z.string()
          }),
          execute: async (datos) => {
            console.log('[Camila Tool] Ejecutando crear_caso_tecnico')
            await supabase.from('agent_messages').insert({
                session_id: session.id,
                role: 'system',
                content: `[SISTEMA INTERNO]: Caso técnico reportado al usuario. Comenta al cliente que lo estás gestionando.`
            })
            return { success: true, message: 'Caso técnico creado' }
          }
        })
      }
    })

    // 7. Guardar respuesta final de Camila al usuario (si la hay)
    if (text) {
      await supabase.from('agent_messages').insert({
        session_id: session.id,
        role: 'assistant',
        content: text
      })
    }

    // 7.5 Guardar Log de Tools (Razonamiento de la IA)
    if (toolCalls && toolCalls.length > 0) {
      await supabase.from('agent_messages').insert({
        session_id: session.id,
        role: 'system',
        content: `[DEBUG-LOG]\n=== TOOLS EJECUTADOS ===\n${JSON.stringify(toolCalls, null, 2)}`
      })
    }

    // 8. Actualizar el estado si es necesario (Por ahora usando análisis simple, luego Tool Calling)
    const newState = determineNextState(session.estado, text)
    if (newState !== session.estado) {
      await supabase
        .from('agent_sessions')
        .update({ estado: newState })
        .eq('id', session.id)
    }

    return text

  } catch (err) {
    console.error('[Camila] AI Generation Error:', err)
    return null
  }
}

function detectTone(history: any[]): string {
  if (history.length === 0) return 'neutro'
  
  // Analizamos los últimos 2 mensajes del usuario
  const userMessages = history.filter((m: any) => m.role === 'user').slice(-2)
  const recentText = userMessages.map((m: any) => (m.content || '').toLowerCase()).join(' ')
  
  if (!recentText) return 'neutro'
  
  // Molesto
  const molestoHins = ['pesimo', 'mal', 'molest', 'harto', 'cansad', 'estaf', 'robo', 'mierda', 'puta', '😡', '🤬', 'callense', 'molestar']
  if (molestoHins.some(h => recentText.includes(h))) return 'molesto'
  
  // Entusiasta
  const entusiastaHins = ['jaja', 'sii', 'buenisimo', 'bacan', 'excelente', 'genial', 'dale', '😊', '🙌', '🎉', 'quiero', 'interesa']
  if (entusiastaHins.some(h => recentText.includes(h))) return 'entusiasta'
  
  // Apurado
  const apuradoHins = ['rapido', 'al tiro', 'ahora', 'cuanto se demora', 'luego', 'ya']
  if (apuradoHins.some(h => recentText.includes(h)) || (recentText.length > 0 && recentText.length < 15)) return 'apurado'
  
  return 'neutro'
}

function getSystemPromptForState(
  state: AgentState, 
  baseIdentity: string,
  instructions: string,
  ragGeneral: string,
  ragOffers: string,
  tone: string
) {
  
  const masterInstruction = `
# INSTRUCCIÓN MAESTRA — SUPER AGENTE CAMILA
${baseIdentity}
${instructions}

## CÓMO DEBES OPERAR:
1. IDENTIFICA tu ESTADO actual: \`\${estado_actual}\` (indicado abajo).
2. DETECTA el TONO del cliente: \`\${tono_actual}\` (indicado abajo).
   - molesto: empática, seria, 0 emojis, 0 humor
   - entusiasta: jocosa, directa, 1-2 emojis
   - apurado: eficiente, cero rodeos
   - neutro: cálida, cercana, 1 emoji máx
3. CONSULTA el RAG para precios, reglas y promos.
4. EJECUTA EL TEST PRE-RESPUESTA ANTES DE HABLAR:
   - ¿Ya le pregunté esto arriba? (Revisa el historial. Si el cliente ya dio su RUT o dirección, ¡NO LO PIDAS DE NUEVO!).
   - ¿Respondí fluidamente o soné como robot de atención?
   - ¿Usé alguna frase PROHIBIDA?
   - ¿Más de 3 líneas? Probablemente sobra.
5. NUNCA reveles que eres una IA. NO reveles procesos internos. No menciones "Backoffice" al cliente, diles que TÚ estás verificando.`

  let stateInstructions = ''
  switch (state) {
    case 'CONTACTO_INICIAL':
      stateInstructions = `Fase Actual: CONTACTO_INICIAL.
## LOGICA: 
Preséntate como Camila de Movistar Fibra (saluda UNA SOLA VEZ, si ya lo hiciste arriba, no repitas). 
Tu objetivo es pedir de forma muy amable el RUT y la dirección exacta. 
¡REGLA DE ORO!: Antes de escribir, revisa el chat arriba. Si el cliente YA TE ESCRIBIÓ SU RUT O DIRECCIÓN, avanza directo alabando sus detalles en lugar de volver a pedirlos.`
      break
    
    case 'PRECHEQUE_PENDIENTE':
    case 'PRECHEQUEO_PENDIENTE':
      stateInstructions = `Fase Actual: PRECHEQUEO_PENDIENTE.
## LOGICA: 
¡IMPORTANTE! Ya enviaste exitosamente los datos a factibilidad técnica mediante la herramienta. 
REGLAS ESTRICTAS PARA ESTA FASE:
1. NO uses NUNCA MÁS la herramienta 'solicitar_precheque'. ¡Ya la usaste! 
2. NO vuelvas a saludar (el cliente ya sabe quién eres).
3. NO le pidas de nuevo el RUT ni la dirección, ya lo ingresaste.
4. NO le digas que estás esperando a "Andrea" si el sistema te indicó otro nombre.
5. TU ÚNICA MISIÓN AHORA: ¡MANTÉN LA TEMPERATURA DE LA VENTA ALTA! Véndele la necesidad. Háblale de la superioridad de la fibra Movistar (velocidad simétrica, estabilidad, decos gratis). ERES UNA VENDEDORA EXPERTA EN TERRENO, tu objetivo es que el cliente desee el servicio mientras espera. ¡NO hagas charlita casual "de amigos", vende beneficios!`
      break
      
    case 'EVALUACION_RESULTADO':
      stateInstructions = `Fase Actual: EVALUACION_RESULTADO.
## LOGICA: 
Acabas de recibir la respuesta de validación técnica (ej: APROBADO o RECHAZADO, VCP, LC).
Evalúa:
- Si no aprueba por RIESGO (Escenario A): Dile empáticamente que por un tema del sistema no avanza, pídele el RUT de otra persona mayor de edad. NUNCA digas VCP o 'política'.
- Si hay problema TÉCNICO en dirección (Escenario B): Dile que hay un tema con la cobertura y que registrarás un caso para habilitarlo. Pregunta datos faltantes (correo, entre calles).
- Si está OK (Escenario C): Aprueba y avanza ofreciendo la oferta!`
      break

    case 'OFERTA_ENVIADA':
      stateInstructions = `Fase Actual: OFERTA_ENVIADA / CIERRE MÁGICO.
## LOGICA: 
El cliente ya tiene luz verde. Tu misión es CERRAR. 
PRESENTA máximo 2 opciones, recomendando la que consideres mejor con convicción ("Te conviene esta porque..."). 
Responde objeciones con Framework VARE (Validar, Aclarar, Re-encuadrar, Encaminar al cierre).`
      break
      
    case 'DATOS_VENTA':
      stateInstructions = `Fase Actual: DATOS_VENTA.
## LOGICA: 
El cliente YA ACEPTÓ EL PLAN! 🎉 Felicítalo. 
Recopila los datos con mucha naturalidad (NO todo de golpe): correo electrónico, número de contacto adicional, y avísale que le llegará un SMS de MoviStar para biometría (validación de identidad obligatoria super rápida).`
      break
    
    case 'VENTA_INGRESADA':
      stateInstructions = `Fase Actual: VENTA_INGRESADA.
## LOGICA: 
Se ingresó la orden en el sistema con éxito. Confírmale que ya está listo ("¡Tu venta fue ingresada! 🎉"). Avísale que luego le contactarán para agenda.`
      break
      
    default:
      stateInstructions = `Fase Actual: INSTALACION_PENDIENTE / POST_VENTA.
## LOGICA: 
Atiende dudas posventa con amabilidad. Usa tono de acompañamiento ("Ya somos de la casa").`
      break
  }

  const knowledgeBase = `\n\n=== BASE DE CONOCIMIENTO (RAG) ===\n${ragGeneral !== '' ? ragGeneral : 'Sin archivos extra.\n'}\n=== OFERTAS DISPONIBLES ===\n${ragOffers !== '' ? ragOffers : 'No hay ofertas subidas, revisa la configuración.\n'}`

  return `${masterInstruction}\n\n[VARIABLES DINÁMICAS]\n\${estado_actual} = ${state}\n\${tono_actual} = ${tone}\n\n${stateInstructions}${knowledgeBase}`
}

function determineNextState(currentState: AgentState, assistantReply: string): AgentState {
  // Ahora las herramientas (Tools) hacen el cambio de estado de forma determinista 
  // en la base de datos (ej. al llamar solicitar_precheque). 
  // Ya no dependemos de hackear el string de respuesta.
  return currentState
}

// Function para parsear los archivos BOT
async function getRagContent(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<{ general: string; offers: string }> {
  try {
    const generalChunks: string[] = []
    const offerChunks: string[] = []

    // 1. Cargar RAG Nativo de Camila desde JSON
    try {
      const fs = await import('fs')
      const path = await import('path')
      const ragPath = path.join(process.cwd(), 'rag', 'rag_camila_movistar.json')
      if (fs.existsSync(ragPath)) {
        const ragData = JSON.parse(fs.readFileSync(ragPath, 'utf-8'))
        const localRag = ragData.documentos.map((doc: any) => 
          `### [${doc.tipo}] ${doc.titulo}\nTags Relacionados: ${doc.tags?.join(', ')}\n${doc.contenido}`
        ).join('\n\n')
        generalChunks.push(`--- BASE DE CONOCIMIENTO NATIVA (MANUAL DE VENTAS CAMILA) ---\n${localRag}`)
      }
    } catch (err) {
      console.error('[Camila RAG] Error cargando JSON RAG local:', err)
    }

    // 1.5 Cargar Ofertas Comerciales desde JSON
    try {
      const fs = await import('fs')
      const path = await import('path')
      const ofertasPath = path.join(process.cwd(), 'rag', 'ofertas_marzo.json')
      if (fs.existsSync(ofertasPath)) {
        const ofertasData = JSON.parse(fs.readFileSync(ofertasPath, 'utf-8'))
        const formattedOffers = ofertasData.map((oferta: any) => 
          `- Segmento: ${oferta.Segmento} | Plan: ${oferta.Plan} | Precio Oferta: $${oferta.PrecioPromocion.toLocaleString('es-CL')} (Precio Normal: $${oferta.PrecioNormalLleno.toLocaleString('es-CL')}) | Beneficio Extra: ${oferta.BeneficioExtra} | Promo: ${oferta.CondicionesPromo}`
        ).join('\n')
        offerChunks.push(`--- OFERTAS ACTIVAS (MARZO) ---\n${formattedOffers}`)
      }
    } catch (err) {
      console.error('[Camila RAG] Error cargando Ofertas JSON local:', err)
    }

    // 2. Cargar archivos dinámicos desde Supabase
    const { data: files, error } = await supabase
      .from('bot_files')
      .select('name, storage_path, file_type')
      .eq('workspace_id', workspaceId)
      .eq('active', true)

    if (!error && files && files.length > 0) {
      for (const file of files) {
        const isOffer = file.name.startsWith('[OFERTA]')
        const cleanName = file.name.replace('[OFERTA]', '').trim()

        if (file.file_type !== 'text') continue

        const { data: fileData, error: dlError } = await supabase.storage
          .from('workspaces')
          .download(file.storage_path)

        if (dlError || !fileData) continue

        const content = await fileData.text()
        const snippet = content.slice(0, 4000)

        if (isOffer) {
          offerChunks.push(`--- ${cleanName} ---\n${snippet}`)
        } else {
          generalChunks.push(`--- ${cleanName} ---\n${snippet}`)
        }
      }
    }

    return {
      general: generalChunks.join('\n\n'),
      offers: offerChunks.join('\n\n'),
    }
  } catch (err) {
    return { general: '', offers: '' }
  }
}
