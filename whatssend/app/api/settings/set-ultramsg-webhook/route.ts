import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { url, instanceId, token } = await request.json()

    if (!url || !instanceId || !token) {
      return NextResponse.json({ error: 'Faltan parámetros de UltraMsg' }, { status: 400 })
    }

    const params = new URLSearchParams()
    params.append('token', token)
    params.append('webhook_url', url)
    params.append('webhook_message_received', 'true')
    params.append('webhook_message_create', 'false')
    params.append('webhook_message_ack', 'false')

    const response = await fetch(`https://api.ultramsg.com/${instanceId}/instance/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    })

    const data = await response.json()

    if (response.ok) {
      return NextResponse.json({ success: true, message: 'Webhook auto-registrado en UltraMsg', data })
    } else {
      console.error('[UltraMsg Webhook Error]', data)
      return NextResponse.json({ error: data.error || 'Error al conectar con UltraMsg' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[UltraMsg Webhook Catch Error]', error)
    return NextResponse.json({ error: 'Error del servidor: ' + error.message }, { status: 500 })
  }
}
