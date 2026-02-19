# 🔧 PROMPT DE REPARACIÓN — WhatsSend: Conectar funcionalidad real a todas las pantallas
> Versión: 1.0 | Tipo: Fix & Implementation Prompt
> Usar en: Antigravity AI Code Editor

---

## ═══════════════════════════════════════════
## CONTEXTO Y ESTADO ACTUAL DEL PROYECTO
## ═══════════════════════════════════════════

```
You are working on WhatsSend, a WhatsApp CRM platform built with:
- Next.js 16 (App Router, TypeScript)
- Supabase (PostgreSQL + Auth + Realtime + Storage)
- Shadcn/ui + Tailwind CSS
- UltraMsg API for WhatsApp messaging
- OpenAI GPT-4o-mini for AI bot
- Zustand + TanStack Query for state management

CURRENT PROBLEM:
All screens exist visually but NONE of their functions work. Buttons don't do anything,
forms don't submit, data doesn't load from Supabase, and there are rendering bugs.

Specific issues confirmed:
1. Pipeline screen shows "// Header bg" text instead of styled column headers
2. Campaign screen buttons are non-functional (no API calls on click)
3. Contacts screen doesn't load or save data
4. Inbox/chat screen doesn't display incoming messages (UltraMsg webhook works but
   messages don't appear in the UI — Supabase Realtime not connected)
5. Bot screen has no working toggle, no prompt editor, no file upload for RAG
6. Analytics screen shows no real data
7. Templates screen CRUD doesn't work

YOUR TASK:
Fix ALL screens one by one. For each screen:
1. Connect all buttons and forms to real Supabase API calls
2. Fix any visual/rendering bugs
3. Implement missing backend API routes if they don't exist
4. Connect Supabase Realtime where needed
5. Add proper loading, error, and empty states

Do NOT redesign the UI. Keep existing layout and components. Only add functionality.
```

---

## ═══════════════════════════════════════════
## FIX 1 — PIPELINE SCREEN
## ═══════════════════════════════════════════

```
FILE: app/(dashboard)/pipeline/page.tsx (or wherever Pipeline is)

BUG: Columns show "// Header bg" — this is a template literal or comment 
that was never replaced with actual JSX/CSS.

FIND and FIX: Any instance of "// Header bg" in the component.
It should be a styled div/header for each Kanban column.

Each column header should show:
- Colored indicator (emoji or colored dot per status)
- Column title in Spanish
- Count of leads in that column (number badge)

Column definitions:
const COLUMNS = [
  { id: 'interested',    label: 'Interesado',      color: '#F59E0B' },
  { id: 'verifying',     label: 'Verificando',      color: '#3B82F6' },
  { id: 'data_complete', label: 'Datos Completos',  color: '#10B981' },
  { id: 'sent',          label: 'Enviada',          color: '#8B5CF6' },
  { id: 'ingested',      label: 'Ingresada',        color: '#06B6D4' },
  { id: 'rejected',      label: 'No Ingresada',     color: '#EF4444' },
]

FUNCTIONALITY TO IMPLEMENT:

1. DATA LOADING:
   - On mount, fetch all pipeline_leads for current workspace from Supabase
   - Query: supabase.from('pipeline_leads').select('*, contacts(*)').eq('workspace_id', workspaceId)
   - Group leads by status into the 6 columns
   - Show lead count per column in header badge

2. LEAD CARD (click to open):
   - Shows: contact name, phone, service interest, assigned executive, 
     time since created (e.g. "hace 2 días")
   - On click: opens right-side drawer with full lead detail form

3. LEAD DETAIL DRAWER:
   All fields from pipeline_leads table, editable:
   - rut, full_name, address, comuna, service, promotion
   - additional_services, observations, web_executive, supervisor
   - install_contact_name, install_phone, email, billing_date
   - biometric_code (manual input)
   - order_number (read-only, auto-captured)
   
   Auto-filled fields (came from bot): show green badge "Auto-capturado"
   Empty required fields: highlight with yellow border
   
   Status selector: dropdown to move lead between stages
   
   "Enviar a Backoffice" button:
   - Only enabled when biometric_code is filled
   - On click: calls POST /api/pipeline/send-to-backoffice
   - Shows loading spinner during send
   - On success: updates status to 'sent', shows success toast
   
   WhatsApp conversation preview:
   - Last 10 messages with this contact (from messages table)
   - Read-only, shows direction (inbound/outbound) and timestamp

4. CREATE LEAD MANUALLY button:
   - Opens empty drawer form
   - Contact selector (search existing contacts by phone/name)
   - Or create new contact inline

5. API ROUTES NEEDED:
   
   GET /api/pipeline/leads → fetch all leads for workspace
   POST /api/pipeline/leads → create new lead
   PATCH /api/pipeline/leads/[id] → update lead fields or status
   POST /api/pipeline/send-to-backoffice → send email to backoffice
   
   For send-to-backoffice:
   - Validate all required fields present
   - Send email via Nodemailer + Gmail SMTP:
     GMAIL_USER and GMAIL_APP_PASSWORD from env vars
   - Email format (exact):
     Subject: "Nueva Venta - {full_name} - {service} - {date}"
     Body:
     RUT CLIENTE: {rut}
     NOMBRE CLIENTE: {full_name}
     DIRECCIÓN: {address}
     COMUNA: {comuna}
     SERVICIO: {service}
     PROMOCIÓN: {promotion}
     SERVICIOS ADICIONALES: {additional_services}
     OBSERVACIÓN: {observations}
     EJECUTIVO WEB: {web_executive}
     SUPERVISOR: {supervisor}
     CONTACTO PARA INSTALACIÓN: {install_contact_name}
     TELÉFONO: {install_phone}
     CORREO: {email}
     FECHA DE FACT: {billing_date}
     CÓDIGO BIOMÉTRICO: {biometric_code}
   - Save sent email Message-ID to pipeline_leads.sent_email_message_id
   - Update status → 'sent'
```

---

## ═══════════════════════════════════════════
## FIX 2 — INBOX / CHAT SCREEN
## ═══════════════════════════════════════════

```
FILE: app/(dashboard)/inbox/page.tsx

PROBLEM: Messages sent via UltraMsg webhook arrive at the backend but don't 
appear in the UI. Supabase Realtime is not connected to the component.

FIXES NEEDED:

1. REALTIME SUBSCRIPTION (most critical fix):
   In the ChatWindow component, add a Supabase Realtime subscription:
   
   useEffect(() => {
     const channel = supabase
       .channel('messages-inbox')
       .on(
         'postgres_changes',
         {
           event: 'INSERT',
           schema: 'public',
           table: 'messages',
           filter: `workspace_id=eq.${workspaceId}`,
         },
         (payload) => {
           // Add new message to local state immediately
           setMessages(prev => [...prev, payload.new as Message])
           // If message is from a different contact, update conversation list
           // and show toast notification
         }
       )
       .subscribe()
     
     return () => { supabase.removeChannel(channel) }
   }, [workspaceId])

2. CONVERSATION LIST (left panel):
   - Load all contacts that have at least 1 message
   - Query: supabase.from('messages')
       .select('contact_id, contacts(name, phone), body, created_at, direction')
       .eq('workspace_id', workspaceId)
       .order('created_at', { ascending: false })
   - Group by contact, show last message preview + timestamp
   - Unread badge: count inbound messages where read_at is null
   - Search: filter by contact name or phone number
   - Realtime: subscription updates conversation list when new message arrives

3. CHAT WINDOW (right panel):
   - On contact select: load messages for that contact
   - Query: supabase.from('messages')
       .select('*')
       .eq('contact_id', contactId)
       .order('created_at', { ascending: true })
   - MessageBubble: outbound = right-aligned green, inbound = left-aligned white
   - Auto-scroll to bottom on new message
   - Show delivery status icon for outbound messages (✓ sent, ✓✓ delivered)

4. SEND MESSAGE (bottom composer):
   - Input + Send button
   - On send: call POST /api/messages/send with { contactId, body }
   - Optimistic update: add message to UI immediately before API response
   - API route sends via UltraMsg and saves to Supabase

5. CONTACT SIDEBAR (right panel, toggleable):
   - Show contact info: name, phone, tags, status
   - "Ver en Pipeline" button if contact has a pipeline lead
   - Quick notes field (saves to contacts.notes)
   - "Agregar al Pipeline" button if not already in pipeline

6. WEBHOOK HANDLER (app/api/messages/webhook/route.ts):
   Verify this route correctly:
   - Receives POST from UltraMsg
   - Parses: { data: { from, body, type } }
   - UltraMsg phone format: "5491112345678@c.us" → extract just "5491112345678"
   - Find or create contact by phone
   - Insert message to Supabase (direction: 'inbound')
   - Check bot rules / AI bot response
   - Return 200 immediately
   
   IMPORTANT: The Supabase INSERT triggers Realtime which updates the UI.
   If the webhook saves to DB correctly but UI doesn't update, the issue is
   the Realtime subscription missing or misconfigured.
```

---

## ═══════════════════════════════════════════
## FIX 3 — BOT SCREEN
## ═══════════════════════════════════════════

```
FILE: app/(dashboard)/bot/page.tsx

CURRENT STATE: Probably has static UI with no working functionality.

REQUIRED FUNCTIONALITY — this screen has 4 sections:

━━━ SECTION 1: AI Bot Toggle ━━━
- Large toggle switch: "Bot Inteligente" ON/OFF
- When ON: all inbound messages go through GPT-4o-mini sales bot
- When OFF: messages only trigger simple keyword rules (or no auto-response)
- Save state to workspace settings in Supabase:
  UPDATE workspaces SET bot_enabled = true WHERE id = workspaceId
- Show current status clearly (green = active, gray = inactive)
- Add warning when turning off: "El bot dejará de responder automáticamente"

━━━ SECTION 2: Bot Prompt Editor ━━━
- Large textarea for the system prompt
- Pre-filled with the default sales bot prompt (see Bloque 13)
- Character counter
- Variables helper: show available variables like {company_name}, {promotions}
- "Restaurar prompt por defecto" button
- "Guardar cambios" button → saves to workspaces.bot_system_prompt
- Live preview panel showing how the prompt will look with variables replaced

Default system prompt to pre-fill:
"Eres un asesor de ventas digital de {company_name}, especializado en servicios de 
internet de fibra óptica. Tu objetivo es atender consultas de clientes de forma 
natural, amigable y profesional por WhatsApp.

REGLAS:
- Responde siempre en español, de forma conversacional y cálida
- Nunca suenes como un bot o formulario  
- Cuando el cliente muestre interés, obtén: RUT, dirección, comuna, 
  teléfono alternativo y correo
- Usa solo las promociones disponibles para responder precios
- Si no sabes algo, di que lo vas a consultar

DATOS A CAPTURAR:
- RUT del cliente
- Dirección de instalación + comuna
- Teléfono alternativo (si es diferente al WhatsApp)
- Correo electrónico
- Servicio/velocidad de interés"

━━━ SECTION 3: Promotions & RAG Files ━━━
This is NOT a separate screen. Promotions are files attached to the bot as context.

UI: File upload area with list of uploaded files below

Upload section:
- Drag & drop zone accepting: .pdf, .xlsx, .csv, .txt, .docx
- Label: "Archivos de conocimiento del bot"
- Description: "Sube tus promociones, precios, cobertura o cualquier información 
  que el bot deba conocer para responder a los clientes"
- On upload: save file to Supabase Storage at path: workspaces/{workspaceId}/bot-files/
- Save file metadata to bot_files table

TABLE: bot_files
- id UUID PK
- workspace_id UUID references workspaces(id)
- name TEXT (original filename)
- file_type TEXT ('promotions' | 'coverage' | 'faq' | 'other')
- storage_path TEXT (Supabase Storage path)
- file_size INT
- is_active BOOLEAN DEFAULT true
- created_at TIMESTAMPTZ

Uploaded files list:
- Show: filename, type badge, size, upload date, active toggle, delete button
- Toggle active/inactive: only active files are sent as bot context

How bot uses files (lib/ai/sales-bot.ts):
- On each conversation turn, fetch all active bot_files for workspace
- For Excel/CSV: parse and convert to text summary
- For PDF/TXT: extract text content
- Include as context in GPT-4o-mini system prompt:
  "INFORMACIÓN DISPONIBLE:\n{fileContents}"
- This is the RAG (Retrieval Augmented Generation) mechanism

━━━ SECTION 4: Keyword Rules (fallback) ━━━
- Simple list of keyword → response rules
- Used when bot_enabled = false OR as escalation triggers
- Add rule: keyword input + response textarea + match type selector
- Toggle active/inactive per rule
- Delete rule
- These save to bot_rules table (already defined in schema)
```

---

## ═══════════════════════════════════════════
## FIX 4 — CAMPAIGNS SCREEN
## ═══════════════════════════════════════════

```
FILE: app/(dashboard)/campaigns/page.tsx

REQUIRED FUNCTIONALITY:

1. CAMPAIGNS LIST:
   - Load campaigns from Supabase on mount
   - Show: name, status badge, total contacts, sent count, response rate, created date
   - Status colors: draft=gray, running=blue, completed=green, failed=red
   - Click campaign → goes to campaign detail page

2. "NUEVA CAMPAÑA" BUTTON → opens multi-step modal/drawer:

   Step 1 — Nombre y plantilla:
   - Campaign name input
   - Template selector (load from templates table)
   - Preview selected template with variable placeholders highlighted

   Step 2 — Seleccionar contactos:
   - Option A: Select from existing contacts
     - Filter by tags (multi-select)
     - Filter by status (new/contacted/responded/etc)
     - Show count of matching contacts
     - Preview table with first 10 contacts
   - Option B: Upload new Excel file
     - Same import flow as Contacts screen
   - Show: "X contactos seleccionados"

   Step 3 — Programar envío:
   - Radio: "Enviar ahora" or "Programar para después"
   - If scheduled: datetime picker
   - Estimated time: "Envío de X mensajes tomará aproximadamente Y minutos"
     (calculate: contacts * 1.2 seconds)

   Step 4 — Confirmar:
   - Summary: campaign name, template preview, X contacts, send time
   - "Lanzar Campaña" button
   - On confirm: POST /api/campaigns with campaign data
   - Creates campaign + campaign_contacts records in Supabase
   - If "send now": triggers bulk send queue
   - Redirect to campaign detail page

3. CAMPAIGN DETAIL PAGE (app/(dashboard)/campaigns/[id]/page.tsx):
   - Header: campaign name, status, dates
   - Progress bar: sent/total
   - Stats cards: total, sent, delivered, replied, failed
   - Contacts table with individual status per message
     Columns: name, phone, status, sent_at, error (if failed)
   - "Re-enviar fallidos" button: re-queues failed contacts
   - Realtime updates via Supabase subscription on campaign_contacts

4. BULK SEND API (app/api/campaigns/[id]/launch/route.ts):
   - Fetch all campaign_contacts with status 'pending'
   - For each contact:
     - Replace template variables: {{name}} → contact.name, {{phone}} → contact.phone
     - Call UltraMsg API to send message
     - Add delay of 1200ms between each send (rate limiting)
     - Update campaign_contact status after each send
   - Update campaign.sent_count incrementally
   - Handle errors: mark failed contacts, continue with rest
   
   NOTE: For large lists (100+ contacts), use a simple recursive approach
   or Upstash QStash if configured. For now, implement as a streaming
   API route that processes contacts sequentially with delays.
```

---

## ═══════════════════════════════════════════
## FIX 5 — CONTACTS SCREEN
## ═══════════════════════════════════════════

```
FILE: app/(dashboard)/contacts/page.tsx

REQUIRED FUNCTIONALITY:

1. CONTACTS TABLE:
   - Load contacts from Supabase: supabase.from('contacts').select('*').eq('workspace_id', id)
   - Columns: name, phone, email, status, tags, created_at, actions
   - Pagination (25 per page)
   - Search: filter by name, phone, or email (client-side or server-side)
   - Sort by: name, created_at, status
   - Status filter dropdown
   - Tags filter

2. IMPORT BUTTON → opens import modal with 2 tabs:

   Tab 1 — Excel Upload:
   - Drag & drop .xlsx file using react-dropzone
   - Parse with SheetJS (xlsx package) — run client-side
   - Show preview table with first 5 rows
   - Column mapping UI: for each detected column, dropdown to map to:
     phone, name, email, company, rut, address, comuna, or "ignorar"
   - Phone column is REQUIRED (show error if not mapped)
   - "Importar X contactos" button
   - POST /api/contacts/import with mapped data
   - Show progress and result: "X importados, Y duplicados ignorados"

   Tab 2 — Google Sheets URL:
   - URL input field
   - "Cargar" button → GET /api/contacts/import-sheets?url={url}
   - Same column mapping flow
   - Same import button and result

3. ADD CONTACT MANUALLY button:
   - Simple form: phone (required), name, email, company, tags
   - POST /api/contacts
   - Phone validation: normalize to E.164 format

4. CONTACT ROW ACTIONS:
   - View/Edit: opens contact detail drawer
   - Send message: opens quick message modal → sends via UltraMsg
   - Add to pipeline: creates pipeline_lead record
   - Delete: with confirmation dialog

5. CONTACT DETAIL DRAWER/PAGE:
   - Editable fields: name, email, company, tags, status, notes
   - Message history: last 20 messages with this contact
   - Pipeline status: if in pipeline, show current stage
   - "Ver conversación" button → opens inbox filtered to this contact

6. BULK ACTIONS (when rows are selected):
   - Add tag to selected
   - Change status for selected
   - Add to campaign
   - Export selected to Excel
   - Delete selected (with confirmation)

7. API ROUTES:
   GET /api/contacts → list with filters and pagination
   POST /api/contacts → create single contact
   PATCH /api/contacts/[id] → update contact
   DELETE /api/contacts/[id] → delete contact
   POST /api/contacts/import → bulk import from parsed data
   GET /api/contacts/import-sheets → fetch and parse Google Sheets URL
```

---

## ═══════════════════════════════════════════
## FIX 6 — TEMPLATES SCREEN
## ═══════════════════════════════════════════

```
FILE: app/(dashboard)/templates/page.tsx

REQUIRED FUNCTIONALITY:

1. TEMPLATES LIST:
   - Load from Supabase: supabase.from('templates').select('*').eq('workspace_id', id)
   - Show as cards: name, category badge, body preview (first 100 chars), created date
   - Filter by category
   - Search by name

2. CREATE/EDIT TEMPLATE (modal or drawer):
   - Name input
   - Category selector: ventas | seguimiento | bienvenida | personalizado
   - Body textarea with:
     - Variable syntax: {{name}}, {{company}}, {{phone}} shown as colored chips
     - Character counter (max 4096)
     - Variable insertion buttons: click to insert {{name}} at cursor
   - Live preview: replace variables with sample data and show rendered message
   - Save button → POST or PATCH /api/templates

3. AI IMPROVE BUTTON (on each template):
   - On click: POST /api/ai/improve-template with { body: template.body }
   - Show loading state
   - Display 3 AI-generated variants in a modal
   - Each variant has "Usar esta" button
   - On select: replace template body with selected variant
   
   API route (app/api/ai/improve-template/route.ts):
   - Call OpenAI gpt-4o-mini
   - System: "Eres experto en copywriting para WhatsApp de ventas de internet fibra óptica.
     Mejora este mensaje para que sea más persuasivo y conversacional.
     Mantén las variables {{}} intactas. Devuelve SOLO un JSON array con 3 variantes:
     ["variante1", "variante2", "variante3"]"
   - Return: { variants: string[] }

4. DELETE TEMPLATE:
   - Confirmation dialog
   - Check if template is used in any active campaign before deleting
   - DELETE /api/templates/[id]

5. DUPLICATE TEMPLATE:
   - Creates copy with name "Copia de {original name}"
```

---

## ═══════════════════════════════════════════
## FIX 7 — ANALYTICS SCREEN
## ═══════════════════════════════════════════

```
FILE: app/(dashboard)/analytics/page.tsx

REQUIRED FUNCTIONALITY:

1. DATE RANGE FILTER (top of page):
   - Buttons: Hoy | 7 días | 30 días | 90 días | Personalizado
   - All queries use this date range as filter

2. METRICS CARDS (top row) — query from Supabase:
   
   a) Total mensajes enviados:
      SELECT COUNT(*) FROM messages 
      WHERE workspace_id = ? AND direction = 'outbound' AND created_at >= dateFrom
   
   b) Tasa de respuesta:
      Contacts with at least 1 inbound message / total contacts messaged * 100
   
   c) Nuevos contactos:
      SELECT COUNT(*) FROM contacts
      WHERE workspace_id = ? AND created_at >= dateFrom
   
   d) Campañas activas:
      SELECT COUNT(*) FROM campaigns
      WHERE workspace_id = ? AND status IN ('running', 'completed')
      AND created_at >= dateFrom

3. CHARTS — use Recharts:

   Chart 1 — Mensajes por día (BarChart):
   - X axis: dates, Y axis: count
   - Query: group messages by DATE(created_at), count outbound vs inbound
   - Two bars: enviados (green) + recibidos (blue)

   Chart 2 — Tasa de respuesta por campaña (horizontal BarChart):
   - For each campaign: replied_count / sent_count * 100
   - Top 5 campaigns by response rate

   Chart 3 — Estado de contactos (PieChart):
   - new | contacted | responded | converted | lost
   - Count contacts per status

   Chart 4 — Pipeline funnel (BarChart):
   - Count leads per pipeline stage

4. ALL CHARTS must:
   - Show loading skeleton while fetching
   - Show "No hay datos" empty state if no data
   - Be responsive (use ResponsiveContainer from Recharts)

5. API ROUTE: GET /api/analytics?from={date}&to={date}
   Return all metrics in a single query to avoid waterfall loading
```

---

## ═══════════════════════════════════════════
## BLOQUE ADICIONAL — CORRECCIONES GENERALES
## ═══════════════════════════════════════════

```
Apply these fixes GLOBALLY across all screens:

1. WORKSPACE CONTEXT:
   Every screen needs the current workspace_id to query Supabase.
   Create a hook: hooks/useWorkspace.ts
   - Reads workspace from Supabase for the logged-in user
   - Returns: { workspace, workspaceId, isLoading }
   - All screens use this hook to get workspaceId for queries

2. SUPABASE CLIENT IN CLIENT COMPONENTS:
   All client components must use: import { createClient } from '@/lib/supabase/client'
   All server components/API routes must use: import { createClient } from '@/lib/supabase/server'
   NEVER mix these up.

3. TANSTACK QUERY SETUP:
   Ensure QueryClientProvider wraps the app in app/layout.tsx or a providers.tsx:
   
   'use client'
   import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
   const queryClient = new QueryClient()
   export function Providers({ children }) {
     return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
   }

4. ENV VARIABLES CHECK:
   All API routes must validate env vars exist before using them:
   if (!process.env.ULTRAMSG_TOKEN) throw new Error('ULTRAMSG_TOKEN not configured')

5. ERROR BOUNDARIES:
   Wrap each page in a try/catch and show a user-friendly error message.
   Use Sonner toast for non-critical errors.

6. LOADING STATES:
   Every data fetch must show a Skeleton loader.
   Use Shadcn Skeleton component.
   Never show a blank white area while loading.

7. EMPTY STATES:
   Every list/table that could be empty needs an empty state:
   - Icon + descriptive text + CTA button
   Example: Contacts empty = "Aún no tienes contactos. Importa tu primera lista."

Fix screens in this order (most critical first):
1. Inbox (Realtime fix)
2. Pipeline (Header bg bug + functionality)
3. Bot (toggle + prompt + file upload)
4. Campaigns (full functionality)
5. Contacts (full functionality)
6. Templates (CRUD + AI improve)
7. Analytics (real data queries)
```

---

*Prompt de reparación generado con ingeniería de prompts profesional*
*WhatsSend v2.0 — Fix & Connect All Screens*
