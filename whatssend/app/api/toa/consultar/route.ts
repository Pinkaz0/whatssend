import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/toa/consultar
 * Proxy server-side hacia el VPS para evitar Mixed Content (HTTPS → HTTP).
 * El browser no puede llamar directamente a http:// desde https://
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.TOA_API_URL

    if (!apiUrl) {
      return NextResponse.json({ error: 'TOA_API_URL no configurado' }, { status: 500 })
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000)

    try {
      const res = await fetch(`${apiUrl}/api/toa/consultar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      })
      clearTimeout(timeoutId)

      let data
      const contentType = res.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        data = await res.json()
      } else {
        const text = await res.text()
        data = { error: text || 'Respuesta inesperada del servidor TOA' }
      }
      
      return NextResponse.json(data, { status: res.status })
    } catch (fetchErr) {
      clearTimeout(timeoutId)
      throw fetchErr
    }

  } catch (err) {
    console.error('[TOA Proxy] Error Message:', err instanceof Error ? err.message : err)
    console.error('[TOA Proxy] Full Error:', err)
    return NextResponse.json({ error: 'Error conectando con TOA', details: err instanceof Error ? err.message : String(err) }, { status: 502 })
  }
}
