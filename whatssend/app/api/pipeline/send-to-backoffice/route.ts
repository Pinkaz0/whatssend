import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const { leadId } = await request.json()
    
    if (!leadId) {
      return NextResponse.json({ error: 'leadId is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Fetch Lead Data
    const { data: lead, error: leadError } = await supabase
      .from('pipeline_leads')
      .select('*, contact:contacts(phone)')
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // 2. Configure Transporter
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('settings')
      .eq('owner_id', user.id)
      .single()

    const wsSettings = (workspace?.settings as any) || {}
    const googleEmail = wsSettings.googleEmail
    const googleAppKey = wsSettings.googleAppKey

    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'
    const smtpPort = parseInt(process.env.SMTP_PORT || '587')
    const smtpUser = googleEmail || process.env.SMTP_USER
    const smtpPass = googleAppKey || process.env.SMTP_PASS
    
    // Si backofficeEmail no está en env, podríamos usar los biEmails configurados,
    // pero para mantener compatibilidad, usamos el env o el primer biEmail
    const backofficeEmail = process.env.BACKOFFICE_EMAIL || (wsSettings.biEmails && wsSettings.biEmails[0])

    if (!smtpUser || !smtpPass || !backofficeEmail) {
      console.error('[Backoffice] Missing SMTP config. User needs to configure Google Mail in Settings.')
      return NextResponse.json({ error: 'Configuración SMTP de Google faltante. Configúrala en Ajustes.' }, { status: 500 })
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })

    // 3. Build Email Content
    const subject = `[NUEVA VENTA] ${lead.service} - ${lead.full_name}`
    const html = `
      <h1>Nueva Venta Ingresada</h1>
      <p><strong>Vendedor:</strong> ${user.email}</p>
      <hr />
      <h3>Datos del Cliente</h3>
      <ul>
        <li><strong>Nombre:</strong> ${lead.full_name}</li>
        <li><strong>RUT:</strong> ${lead.rut}</li>
        <li><strong>Teléfono:</strong> ${lead.contact?.phone}</li>
        <li><strong>Email:</strong> ${lead.email}</li>
        <li><strong>Dirección:</strong> ${lead.address}</li>
        <li><strong>Comuna:</strong> ${lead.comuna}</li>
      </ul>
      <hr />
      <h3>Datos del Servicio</h3>
      <ul>
        <li><strong>Plan:</strong> ${lead.service}</li>
        <li><strong>Promoción:</strong> ${lead.promotion || 'N/A'}</li>
        <li><strong>Observaciones:</strong> ${lead.observations || 'Ninguna'}</li>
      </ul>
      <hr />
      <h3>Datos Instalación (si aplica)</h3>
      <ul>
        <li><strong>Nombre:</strong> ${lead.install_contact_name || 'Mismo cliente'}</li>
        <li><strong>Teléfono:</strong> ${lead.install_phone || 'Mismo número'}</li>
      </ul>
      <br />
      <p><em>Enviado desde WhatsSend CRM</em></p>
    `

    // 4. Send Email
    const info = await transporter.sendMail({
      from: `"WhatsSend CRM" <${smtpUser}>`,
      to: backofficeEmail,
      subject: subject,
      html: html,
    })

    console.log('[Backoffice] Email sent:', info.messageId)

    // 5. Update Lead Status
    await supabase
      .from('pipeline_leads')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        sent_email_message_id: info.messageId
      })
      .eq('id', leadId)

    return NextResponse.json({ success: true, messageId: info.messageId })

  } catch (error: any) {
    console.error('[Backoffice] Error sending email:', error)
    return NextResponse.json({ error: 'Failed to send email: ' + error.message }, { status: 500 })
  }
}
