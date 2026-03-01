/**
 * Evolution API Client
 * Server-side only — never import in client components.
 */

export interface EvolutionResponse {
  key?: {
    remoteJid: string
    fromMe: boolean
    id: string
  }
  message?: any
  messageTimestamp?: number
  status?: string
}

export type SendResult =
  | { ok: true; data: EvolutionResponse }
  | { ok: false; error: string }

export class EvolutionClient {
  private baseUrl: string
  private apiKey: string
  private instanceName: string

  constructor(apiUrl: string, apiKey: string, instanceName: string) {
    // Remove trailing slashes from URL
    this.baseUrl = apiUrl.replace(/\/$/, '')
    this.apiKey = apiKey
    this.instanceName = instanceName
  }

  /**
   * Envía un mensaje de texto vía WhatsApp.
   * @param to Número de teléfono (ej: 56911123456)
   * @param body Texto del mensaje
   */
  async sendMessage(to: string, body: string): Promise<SendResult> {
    // Evolution API expects format like 56912345678 (no plus)
    const phone = to.startsWith('+') ? to.slice(1) : to

    try {
      const response = await fetch(`${this.baseUrl}/message/sendText/${this.instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey
        },
        body: JSON.stringify({
          number: phone,
          text: body,
          delay: 1200,
          linkPreview: true
        }),
      })

      if (!response.ok) {
        let errorText = await response.text()
        try {
          const jsonError = JSON.parse(errorText)
          errorText = jsonError.message || JSON.stringify(jsonError)
        } catch (e) {
          // Keep raw text if not JSON
        }
        console.error('[Evolution API] HTTP error:', response.status, errorText)
        return { ok: false, error: `HTTP ${response.status}: ${errorText}` }
      }

      const data: EvolutionResponse = await response.json()
      
      console.log('[Evolution API] Message sent:', { to: phone, id: data?.key?.id })
      return { ok: true, data }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('[Evolution API] Exception:', message)
      return { ok: false, error: message }
    }
  }

  /**
   * Verifica que las credenciales sean válidas revisando el estado de la conexión de la instancia
   */
  async testConnection(): Promise<SendResult> {
    try {
      const response = await fetch(`${this.baseUrl}/instance/connectionState/${this.instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': this.apiKey
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        return { ok: false, error: `HTTP ${response.status}: ${errorText}` }
      }

      const data = await response.json()
      console.log('[Evolution API] Connection test:', data)

      if (data?.instance?.state === 'open') {
         return { ok: true, data: { status: 'open' } }
      }

      return { ok: false, error: `Estado: ${data?.instance?.state || 'desconocido'}` }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      return { ok: false, error: message }
    }
  }
}

/**
 * Crea un cliente Evolution API usando credenciales del workspace o variables de entorno.
 */
export function createEvolutionClient(
  apiUrl?: string | null,
  apiKey?: string | null,
  instanceName?: string | null
): EvolutionClient {
  const url = apiUrl || process.env.EVOLUTION_API_URL || 'https://api.empathaiapp.net'
  const key = apiKey || process.env.EVOLUTION_API_KEY
  const instance = instanceName || process.env.EVOLUTION_INSTANCE

  if (!url || !key || !instance) {
    throw new Error('Evolution API credentials not configured. Configure them in settings or set ENV vars.')
  }

  return new EvolutionClient(url, key, instance)
}
