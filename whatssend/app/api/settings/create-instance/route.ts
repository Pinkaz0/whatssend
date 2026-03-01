import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/settings/create-instance
 * Crea una nueva instancia en Evolution API y obtiene el código QR
 */
export async function POST(request: NextRequest) {
  try {
    const apiUrl = process.env.EVOLUTION_API_URL || 'https://api.empathaiapp.net'
    const apiKey = process.env.EVOLUTION_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: 'La API Key Global no está configurada en el servidor (.env)' }, { status: 500 })
    }

    // Generar un random instance name
    const randomSuffix = Math.random().toString(36).substring(2, 6)
    const instanceName = `whatsventas-${Date.now()}-${randomSuffix}`

    const baseUrl = apiUrl.replace(/\/$/, '')

    const response = await fetch(`${baseUrl}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey
      },
      body: JSON.stringify({
        instanceName: instanceName,
        token: instanceName,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS",
        browser: ["WhatsVentas CRM", "Windows", "10.0"]
      })
    })

    if (!response.ok) {
        let errText = await response.text()
        try {
            const jsonErr = JSON.parse(errText)
            errText = jsonErr.message || JSON.stringify(jsonErr)
        } catch (e) {}
        return NextResponse.json({ error: `Error creando instancia: ${errText}` }, { status: response.status })
    }

    const data = await response.json()

    // data.qrcode.base64 contains the QR image
    return NextResponse.json({
      success: true,
      instanceName: instanceName,
      qrcode: data.qrcode?.base64 || data.hash?.qrcode || null
    })

  } catch (err) {
    console.error('[CreateInstance] Error:', err)
    return NextResponse.json({ error: 'Error interno al crear instancia.' }, { status: 500 })
  }
}
