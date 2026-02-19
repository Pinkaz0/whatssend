/**
 * UltraMsg API Client
 * Server-side only — never import in client components.
 * Uses application/x-www-form-urlencoded as required by UltraMsg API.
 */

export interface UltraMsgResponse {
  sent: string
  message: string
  id?: string
}

export type SendResult =
  | { ok: true; data: UltraMsgResponse }
  | { ok: false; error: string }

export class UltraMsgClient {
  private baseUrl: string
  private token: string

  constructor(instanceId: string, token: string) {
    this.baseUrl = `https://api.ultramsg.com/${instanceId}`
    this.token = token
  }

  /**
   * Envía un mensaje de texto vía WhatsApp.
   * @param to Número de teléfono en E.164 (ej: +5691112345678)
   * @param body Texto del mensaje
   */
  async sendMessage(to: string, body: string): Promise<SendResult> {
    // UltraMsg espera el teléfono sin el prefijo '+'
    const phone = to.startsWith('+') ? to.slice(1) : to

    try {
      const params = new URLSearchParams()
      params.append('token', this.token)
      params.append('to', phone)
      params.append('body', body)

      const response = await fetch(`${this.baseUrl}/messages/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[UltraMsg] HTTP error:', response.status, errorText)
        return { ok: false, error: `HTTP ${response.status}: ${errorText}` }
      }

      const data: UltraMsgResponse = await response.json()

      if (data.sent === 'false') {
        console.error('[UltraMsg] Send failed:', data.message)
        return { ok: false, error: data.message }
      }

      console.log('[UltraMsg] Message sent:', { to: phone, id: data.id })
      return { ok: true, data }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('[UltraMsg] Exception:', message)
      return { ok: false, error: message }
    }
  }

  /**
   * Configura la URL del webhook en UltraMsg y activa "message received".
   * Sin esto, UltraMsg no envía POST cuando llega un mensaje.
   */
  async setWebhook(webhookUrl: string): Promise<SendResult> {
    try {
      const params = new URLSearchParams()
      params.append('token', this.token)
      params.append('sendDelay', '1')
      params.append('sendDelayMax', '15')
      params.append('webhook_url', webhookUrl)
      params.append('webhook_message_received', 'true')
      params.append('webhook_message_create', 'false')
      params.append('webhook_message_ack', 'false')
      params.append('webhook_message_download_media', 'false')

      const response = await fetch(`${this.baseUrl}/instance/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[UltraMsg] setWebhook HTTP error:', response.status, errorText)
        return { ok: false, error: `HTTP ${response.status}: ${errorText}` }
      }

      const data = await response.json()
      console.log('[UltraMsg] Webhook configurado:', webhookUrl)
      return { ok: true, data: { sent: 'true', message: 'Webhook configurado', id: undefined } }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('[UltraMsg] setWebhook exception:', message)
      return { ok: false, error: message }
    }
  }

  /**
   * Verifica que las credenciales sean válidas.
   */
  async testConnection(): Promise<SendResult> {
    try {
      const params = new URLSearchParams()
      params.append('token', this.token)

      const response = await fetch(`${this.baseUrl}/instance/status?${params.toString()}`, {
        method: 'GET',
      })

      if (!response.ok) {
        const errorText = await response.text()
        return { ok: false, error: `HTTP ${response.status}: ${errorText}` }
      }

      const data = await response.json()
      console.log('[UltraMsg] Connection test:', data)

      if (data.status?.accountStatus?.status === 'authenticated') {
        return { ok: true, data: { sent: 'true', message: 'Conectado y autenticado', id: undefined } }
      }

      return { ok: true, data: { sent: 'true', message: `Estado: ${JSON.stringify(data.status)}`, id: undefined } }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      return { ok: false, error: message }
    }
  }
}

/**
 * Crea un cliente UltraMsg usando credenciales del workspace o variables de entorno.
 */
export function createUltraMsgClient(
  instanceId?: string | null,
  token?: string | null
): UltraMsgClient {
  const id = instanceId || process.env.ULTRAMSG_INSTANCE_ID
  const tok = token || process.env.ULTRAMSG_TOKEN

  if (!id || !tok) {
    throw new Error('UltraMsg credentials not configured. Set ULTRAMSG_INSTANCE_ID and ULTRAMSG_TOKEN.')
  }

  return new UltraMsgClient(id, tok)
}
