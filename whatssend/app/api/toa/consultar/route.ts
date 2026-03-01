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

    const res = await fetch(`${apiUrl}/api/toa/consultar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })

  } catch (err) {
    console.error('[TOA Proxy] Error:', err)
    return NextResponse.json({ error: 'Error conectando con TOA' }, { status: 502 })
  }
}
