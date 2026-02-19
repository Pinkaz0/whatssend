import { OpenAI } from 'openai'
import { createClient } from '@/lib/supabase/server'
import { Contact } from '@/types/contact'
import { DEFAULT_SYSTEM_PROMPT } from '@/lib/ai/bot-constants'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Re-export for backward compatibility with any existing imports
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
 * Solo lee archivos .txt y .md (los PDFs/Excel requieren parser adicional).
 */
async function getRagContent(workspaceId: string): Promise<{ general: string; offers: string }> {
  try {
    const supabase = await createClient()
    const { data: files } = await supabase
      .from('bot_files')
      .select('name, storage_path, file_type')
      .eq('workspace_id', workspaceId)
      .eq('active', true)

    if (!files || files.length === 0) return { general: '', offers: '' }

    const generalChunks: string[] = []
    const offerChunks: string[] = []

    for (const file of files) {
      // Solo leer archivos de texto (expansible a PDF con parser futuro)
      if (file.file_type !== 'text') {
        // Para archivos no-texto, al menos informamos el nombre al bot
        const isOffer = file.name.startsWith('[OFERTA]')
        const cleanName = file.name.replace('[OFERTA]', '').trim()
        if (isOffer) {
          offerChunks.push(`[Archivo de oferta disponible: ${cleanName}]`)
        } else {
          generalChunks.push(`[Documento disponible: ${cleanName}]`)
        }
        continue
      }

      // Descargar contenido del archivo de texto
      const { data: fileData } = await supabase.storage
        .from('workspaces')
        .download(file.storage_path)

      if (!fileData) continue

      const content = await fileData.text()
      const isOffer = file.name.startsWith('[OFERTA]')
      const cleanName = file.name.replace('[OFERTA]', '').trim()
      const snippet = content.slice(0, 3000) // máx 3k chars por archivo

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
 * Obtiene promociones activas desde la tabla promotions (server-side).
 */
async function getPromotionsContext(workspaceId: string): Promise<string> {
  try {
    const supabase = await createClient()
    const { data: promotions } = await supabase
      .from('promotions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('is_active', true)

    if (!promotions || promotions.length === 0) return 'Sin promociones activas en este momento.'

    return promotions.map((p: Record<string, unknown>) =>
      `- ${p.name}: ${p.speed} a $${p.price} (${p.description}. Incluye: ${Array.isArray(p.additional_services) ? p.additional_services.join(', ') : ''})`
    ).join('\n')
  } catch (err) {
    console.warn('[SalesBot] Promotions fetch error:', err)
    return ''
  }
}

export async function processBotMessage(
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

    // 1. Cargar contexto en paralelo
    const [ragContent, promotionsContext] = await Promise.all([
      getRagContent(workspaceId),
      getPromotionsContext(workspaceId),
    ])

    console.log('[SalesBot] System prompt source:', systemPromptOverride ? 'db' : 'default')
    console.log('[SalesBot] RAG general chars:', ragContent.general.length)
    console.log('[SalesBot] RAG offers chars:', ragContent.offers.length)
    console.log('[SalesBot] Promotions context chars:', promotionsContext.length)

    // 2. Construir prompt del sistema
    const basePrompt = systemPromptOverride || DEFAULT_SYSTEM_PROMPT

    const systemPrompt = `${basePrompt}

${customInstructions ? `INSTRUCCIONES ADICIONALES DEL SUPERVISOR:\n${customInstructions}\n` : ''}
BASE DE CONOCIMIENTO GENERAL:
${ragContent.general}

ARCHIVOS DE OFERTAS (usar como fuente de verdad para planes y precios):
${ragContent.offers || promotionsContext}

DATOS ACTUALES DEL CLIENTE:
- Nombre: ${contact.name || 'Desconocido'}
- RUT: ${contact.rut || 'No capturado'}
- Dirección: ${contact.address || 'No capturada'}
- Comuna: ${contact.comuna || 'No capturada'}
- Email: ${contact.email || 'No capturado'}

FORMATO DE RESPUESTA (JSON estricto):
{
  "message": "Texto de la respuesta para el cliente (solo texto plano con emojis, sin markdown)",
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
      max_tokens: 500,
    })

    const content = response.choices[0].message.content
    if (!content) return null

    const parsed = JSON.parse(content) as BotResponse
    console.log('[SalesBot] Response OK. Intent:', parsed.intent)
    return parsed

  } catch (error) {
    console.error('[SalesBot] Error processing message:', error)
    return null
  }
}
