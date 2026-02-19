import { OpenAI } from 'openai'
import { SupabaseClient } from '@supabase/supabase-js'
import { Contact } from '@/types/contact'
import { DEFAULT_SYSTEM_PROMPT } from '@/lib/ai/bot-constants'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Re-export for backward compatibility
export { DEFAULT_SYSTEM_PROMPT }

interface BotResponse {
  message: string
  extracted: {
    rut?: string
    address?: string
    comuna?: string
    alt_phone?: string
    email?: string
    service_interest?: string
    promo_interest?: string
  }
  intent: 'greeting' | 'inquiry' | 'interested' | 'objection' | 'ready_to_buy' | 'not_interested' | 'unknown'
}

/**
 * Obtiene contenido de texto de archivos RAG activos del workspace desde Supabase Storage.
 * Acepta un cliente Supabase ya autenticado para funcionar en contextos sin sesión (webhook).
 */
async function getRagContent(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<{ general: string; offers: string }> {
  try {
    const { data: files, error } = await supabase
      .from('bot_files')
      .select('name, storage_path, file_type')
      .eq('workspace_id', workspaceId)
      .eq('active', true)

    if (error) {
      console.warn('[SalesBot] getRagContent error:', error.message)
      return { general: '', offers: '' }
    }

    if (!files || files.length === 0) {
      console.log('[SalesBot] No bot_files found for workspace:', workspaceId)
      return { general: 'Sin archivos de conocimiento activos.', offers: 'Sin archivos de ofertas activos.' }
    }

    console.log('[SalesBot] Found', files.length, 'bot_files')

    const generalChunks: string[] = []
    const offerChunks: string[] = []

    for (const file of files) {
      const isOffer = file.name.startsWith('[OFERTA]')
      const cleanName = file.name.replace('[OFERTA]', '').trim()

      // Solo descargar archivos de texto (txt/md). PDFs y spreadsheets solo aportan nombre.
      if (file.file_type !== 'text') {
        const note = `[Archivo disponible: ${cleanName} — tipo: ${file.file_type}]`
        if (isOffer) offerChunks.push(note)
        else generalChunks.push(note)
        continue
      }

      const { data: fileData, error: dlError } = await supabase.storage
        .from('workspaces')
        .download(file.storage_path)

      if (dlError || !fileData) {
        console.warn('[SalesBot] Could not download file:', file.name, dlError?.message)
        continue
      }

      const content = await fileData.text()
      const snippet = content.slice(0, 4000) // máx 4k chars por archivo

      if (isOffer) {
        offerChunks.push(`--- ${cleanName} ---\n${snippet}`)
      } else {
        generalChunks.push(`--- ${cleanName} ---\n${snippet}`)
      }
    }

    return {
      general: generalChunks.join('\n\n') || 'Sin archivos de conocimiento activos.',
      offers: offerChunks.join('\n\n') || 'Sin archivos de ofertas activos.',
    }
  } catch (err) {
    console.warn('[SalesBot] RAG fetch error:', err)
    return { general: '', offers: '' }
  }
}

/**
 * Obtiene promociones activas desde la tabla promotions.
 * Acepta un cliente Supabase ya autenticado.
 */
async function getPromotionsContext(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<string> {
  try {
    const { data: promotions, error } = await supabase
      .from('promotions')
      .select('name, speed, price, description, additional_services')
      .eq('workspace_id', workspaceId)
      .eq('is_active', true)

    if (error) {
      console.warn('[SalesBot] getPromotions error:', error.message)
      return ''
    }

    if (!promotions || promotions.length === 0) {
      return 'Sin promociones activas en este momento.'
    }

    console.log('[SalesBot] Found', promotions.length, 'promotions')

    return promotions.map((p) =>
      `- ${p.name}: ${p.speed ?? ''} a $${p.price ?? '?'} (${p.description ?? ''}. Incluye: ${Array.isArray(p.additional_services) ? p.additional_services.join(', ') : ''})`
    ).join('\n')
  } catch (err) {
    console.warn('[SalesBot] Promotions fetch error:', err)
    return ''
  }
}

/**
 * Procesa un mensaje entrante con IA.
 * @param supabase - Cliente Supabase autenticado (service role desde el webhook)
 * @param workspaceId - ID del workspace
 * @param contact - Datos del contacto
 * @param messageHistory - Historial de mensajes para contexto
 * @param customInstructions - Instrucciones adicionales del supervisor
 * @param systemPromptOverride - Prompt personalizado del workspace (si existe)
 */
export async function processBotMessage(
  supabase: SupabaseClient,
  workspaceId: string,
  contact: Contact,
  messageHistory: { role: 'user' | 'assistant', content: string }[],
  customInstructions?: string,
  systemPromptOverride?: string
): Promise<BotResponse | null> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error('[SalesBot] OPENAI_API_KEY not set')
      return null
    }

    // 1. Cargar contexto en paralelo (usando el supabase pasado como param)
    const [ragContent, promotionsContext] = await Promise.all([
      getRagContent(supabase, workspaceId),
      getPromotionsContext(supabase, workspaceId),
    ])

    console.log('[SalesBot] System prompt source:', systemPromptOverride ? 'custom (db)' : 'default')
    console.log('[SalesBot] RAG general chars:', ragContent.general.length)
    console.log('[SalesBot] RAG offers chars:', ragContent.offers.length)
    console.log('[SalesBot] Promotions context chars:', promotionsContext.length)

    // 2. Construir prompt del sistema
    const basePrompt = systemPromptOverride || DEFAULT_SYSTEM_PROMPT

    // Si hay archivos de ofertas, úsalos como fuente de verdad. Si no, usa las promociones de DB.
    const offersSection = ragContent.offers && ragContent.offers !== 'Sin archivos de ofertas activos.'
      ? ragContent.offers
      : promotionsContext

    const systemPrompt = `${basePrompt}

${customInstructions ? `INSTRUCCIONES ADICIONALES DEL SUPERVISOR:\n${customInstructions}\n` : ''}
BASE DE CONOCIMIENTO GENERAL:
${ragContent.general}

PLANES Y OFERTAS DISPONIBLES (usa como única fuente de verdad para precios y planes):
${offersSection}

DATOS ACTUALES DEL CLIENTE:
- Nombre: ${contact.name || 'Desconocido'}
- RUT: ${contact.rut || 'No capturado'}
- Dirección: ${contact.address || 'No capturada'}
- Comuna: ${contact.comuna || 'No capturada'}
- Email: ${contact.email || 'No capturado'}

FORMATO DE RESPUESTA (JSON estricto):
{
  "message": "Texto de la respuesta para el cliente (texto plano con emojis, sin markdown)",
  "extracted": {
    "rut": null,
    "address": null,
    "comuna": null,
    "alt_phone": null,
    "email": null,
    "service_interest": null,
    "promo_interest": null
  },
  "intent": "greeting" | "inquiry" | "interested" | "objection" | "ready_to_buy" | "not_interested" | "unknown"
}

IMPORTANTE: "extracted" debe contener SOLO los datos NUEVOS que el cliente acaba de proporcionar en este turno. Si no dio datos nuevos, todos los campos deben ser null.`

    // 3. Llamar a OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messageHistory.map(m => ({ role: m.role, content: m.content }))
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 600,
    })

    const content = response.choices[0].message.content
    if (!content) return null

    const parsed = JSON.parse(content) as BotResponse
    console.log('[SalesBot] Response OK. Intent:', parsed.intent, '| Msg preview:', parsed.message.slice(0, 60))
    return parsed

  } catch (error) {
    console.error('[SalesBot] Error processing message:', error)
    return null
  }
}
