# 🧠 MASTER PROMPT — WhatsApp CRM Platform (WhatsSend)
> Versión: 1.0 | Autor: Generado con ingeniería de prompts profesional
> Editor objetivo: Antigravity AI Code Editor

---

## ═══════════════════════════════════════════
## BLOQUE 1 — ROL Y CONTEXTO DEL SISTEMA
## ═══════════════════════════════════════════

```
You are a senior full-stack software architect and UX engineer with 10+ years of experience 
building B2B SaaS platforms. You specialize in:
- React (Next.js 14+ App Router) frontend with Tailwind CSS and Shadcn/ui
- Node.js / Express or Next.js API Routes for backend
- Supabase (PostgreSQL + Auth + Realtime + Storage) as the primary database and backend suite
- WhatsApp Business API integrations using UltraMsg (https://ultramsg.com) as the messaging gateway
- Google Workspace integrations (Sheets API, Google Drive)
- Vercel for deployment
- OpenAI API (GPT-4o) for AI-powered features

Your task is to design and generate the full source code, architecture, database schema, 
and UI for a lightweight WhatsApp CRM platform called "WhatsSend".

Follow these engineering principles throughout:
- DRY (Don't Repeat Yourself)
- SOLID principles
- Mobile-first responsive design
- Secure by default (never expose API keys client-side)
- Modular folder structure (feature-based, not layer-based)
- Every component must be functional, typed (TypeScript), and production-ready
```

---

## ═══════════════════════════════════════════
## BLOQUE 2 — DESCRIPCIÓN DEL PRODUCTO
## ═══════════════════════════════════════════

```
WhatsSend is a simple, focused WhatsApp marketing and CRM automation platform for small 
businesses and sales teams. It allows users to:

1. Import a list of contacts from Excel (.xlsx) or Google Sheets
2. Configure and send personalized WhatsApp messages in bulk to those contacts
3. Use AI to improve, rewrite, or generate message templates
4. Monitor who received, opened, or replied to messages
5. Manage all conversations from a unified inbox (chat view)
6. Set up automated bot responses for inbound messages
7. View analytics: sent rate, response rate, client classification
8. See full message history per contact

The platform must feel professional, clean, and fast. Think: a lighter version of WhatsTool 
or WATI, but built for a single team or solo entrepreneur.
```

---

## ═══════════════════════════════════════════
## BLOQUE 3 — STACK TECNOLÓGICO (OBLIGATORIO)
## ═══════════════════════════════════════════

```
Use EXACTLY this tech stack. Do not suggest alternatives unless a specific constraint 
requires it:

FRONTEND:
- Framework: Next.js 14 (App Router, TypeScript)
- UI Library: Shadcn/ui + Tailwind CSS
- State Management: Zustand (client state) + TanStack Query v5 (server state/cache)
- Charts & Analytics: Recharts
- File Upload: react-dropzone
- Table/Grid: TanStack Table v8
- Forms: React Hook Form + Zod validation
- Notifications: Sonner (toast)
- Icons: Lucide React

BACKEND (Next.js API Routes or separate Express service):
- Runtime: Node.js 20+
- API: Next.js Route Handlers (app/api/*)
- Validation: Zod
- Job Queue: Upstash QStash (for bulk message sending without timeout issues)
- Scheduled Tasks: Vercel Cron Jobs or Upstash Scheduler

DATABASE & AUTH:
- Primary DB: Supabase (PostgreSQL)
- Auth: Supabase Auth (email/password + magic link)
- Realtime: Supabase Realtime (for live chat updates)
- File Storage: Supabase Storage (for Excel uploads)
- ORM: Supabase JS Client (supabase-js v2) — no additional ORM needed

WHATSAPP MESSAGING:
- Gateway: UltraMsg API (https://ultramsg.com)
  - Endpoint for sending: POST https://api.ultramsg.com/{instance_id}/messages/chat
  - Webhook for receiving: configure in UltraMsg dashboard → Settings → Webhooks
  - Use instanceId + token from UltraMsg dashboard
  - All calls must go through server-side API routes ONLY (never expose token client-side)

GOOGLE INTEGRATIONS:
- Google Sheets: googleapis npm package (google-auth-library + googleapis)
- Auth flow: OAuth2 with service account for server-to-server

AI:
- Provider: OpenAI API (gpt-4o-mini for cost efficiency)
- Use cases: message template improvement, auto-response suggestions, contact classification
- All AI calls: server-side only via /api/ai/* routes

DEPLOYMENT:
- Platform: Vercel (serverless functions)
- Environment variables: Vercel environment variables panel
- DB: Supabase hosted (free tier compatible)
```

---

## ═══════════════════════════════════════════
## BLOQUE 4 — ARQUITECTURA DE CARPETAS
## ═══════════════════════════════════════════

```
Generate the following folder structure. Respect it strictly:

whatssend/
├── app/                          # Next.js App Router
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx            # Sidebar + topbar layout
│   │   ├── page.tsx              # Dashboard home / overview
│   │   ├── inbox/page.tsx        # Chat inbox (main CRM view)
│   │   ├── campaigns/
│   │   │   ├── page.tsx          # Campaign list
│   │   │   ├── new/page.tsx      # Create campaign
│   │   │   └── [id]/page.tsx     # Campaign detail + history
│   │   ├── contacts/
│   │   │   ├── page.tsx          # Contact list + upload
│   │   │   └── [id]/page.tsx     # Contact profile + history
│   │   ├── templates/page.tsx    # Message template manager
│   │   ├── bot/page.tsx          # Bot/auto-response config
│   │   └── analytics/page.tsx    # Metrics dashboard
│   └── api/
│       ├── auth/[...supabase]/route.ts
│       ├── messages/
│       │   ├── send/route.ts       # Send single message via UltraMsg
│       │   ├── bulk/route.ts       # Queue bulk sending
│       │   └── webhook/route.ts    # Receive inbound messages from UltraMsg
│       ├── contacts/
│       │   ├── import/route.ts     # Process Excel/Sheets import
│       │   └── [id]/route.ts
│       ├── campaigns/route.ts
│       ├── ai/
│       │   ├── improve-template/route.ts
│       │   └── classify-contact/route.ts
│       └── analytics/route.ts
│
├── components/
│   ├── ui/                       # Shadcn components (auto-generated)
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── TopBar.tsx
│   │   └── MobileNav.tsx
│   ├── inbox/
│   │   ├── ChatList.tsx
│   │   ├── ChatWindow.tsx
│   │   ├── MessageBubble.tsx
│   │   └── ContactHeader.tsx
│   ├── campaigns/
│   │   ├── CampaignCard.tsx
│   │   ├── BulkSendForm.tsx
│   │   └── SendProgress.tsx
│   ├── contacts/
│   │   ├── ContactTable.tsx
│   │   ├── ImportDropzone.tsx
│   │   └── ContactTag.tsx
│   ├── templates/
│   │   ├── TemplateEditor.tsx
│   │   └── AIImproveButton.tsx
│   ├── analytics/
│   │   ├── MetricsCards.tsx
│   │   ├── ResponseRateChart.tsx
│   │   └── ContactStatusChart.tsx
│   └── bot/
│       ├── BotRuleCard.tsx
│       └── BotRuleForm.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client (cookies)
│   │   └── middleware.ts
│   ├── ultramsg/
│   │   └── client.ts             # UltraMsg API wrapper
│   ├── google/
│   │   └── sheets.ts             # Google Sheets helpers
│   ├── openai/
│   │   └── client.ts             # OpenAI wrapper
│   ├── queue/
│   │   └── qstash.ts             # Upstash QStash helpers
│   └── utils/
│       ├── excel.ts              # xlsx parsing (SheetJS)
│       ├── phone.ts              # Phone number normalization
│       └── cn.ts                 # Tailwind class merger
│
├── hooks/
│   ├── useContacts.ts
│   ├── useCampaigns.ts
│   ├── useMessages.ts
│   ├── useRealtimeMessages.ts    # Supabase Realtime hook
│   └── useAnalytics.ts
│
├── types/
│   ├── contact.ts
│   ├── campaign.ts
│   ├── message.ts
│   ├── template.ts
│   ├── bot-rule.ts
│   └── analytics.ts
│
├── stores/
│   ├── useInboxStore.ts          # Active conversation state
│   └── useAppStore.ts            # Global UI state
│
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
│
├── .env.local.example
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## ═══════════════════════════════════════════
## BLOQUE 5 — ESQUEMA DE BASE DE DATOS (SUPABASE)
## ═══════════════════════════════════════════

```
Generate the complete SQL migration file for Supabase at 
supabase/migrations/001_initial_schema.sql with the following tables:

TABLE: profiles
- id UUID PK references auth.users
- full_name TEXT
- avatar_url TEXT
- created_at TIMESTAMPTZ DEFAULT now()

TABLE: workspaces
- id UUID PK DEFAULT gen_random_uuid()
- name TEXT NOT NULL
- owner_id UUID references profiles(id)
- ultramsg_instance_id TEXT
- ultramsg_token TEXT (store encrypted or via Supabase vault)
- created_at TIMESTAMPTZ DEFAULT now()

TABLE: contacts
- id UUID PK DEFAULT gen_random_uuid()
- workspace_id UUID references workspaces(id) ON DELETE CASCADE
- phone TEXT NOT NULL              -- E.164 format: +5491112345678
- name TEXT
- email TEXT
- company TEXT
- tags TEXT[]                      -- e.g. ['hot-lead', 'cliente']
- status TEXT DEFAULT 'new'        -- new | contacted | responded | converted | lost
- notes TEXT
- source TEXT                      -- 'excel' | 'sheets' | 'manual'
- metadata JSONB                   -- extra columns from Excel
- created_at TIMESTAMPTZ DEFAULT now()
- UNIQUE(workspace_id, phone)

TABLE: campaigns
- id UUID PK DEFAULT gen_random_uuid()
- workspace_id UUID references workspaces(id) ON DELETE CASCADE
- name TEXT NOT NULL
- template_id UUID references templates(id)
- status TEXT DEFAULT 'draft'      -- draft | scheduled | running | completed | failed
- scheduled_at TIMESTAMPTZ
- total_contacts INT DEFAULT 0
- sent_count INT DEFAULT 0
- delivered_count INT DEFAULT 0
- read_count INT DEFAULT 0
- replied_count INT DEFAULT 0
- created_at TIMESTAMPTZ DEFAULT now()

TABLE: campaign_contacts
- id UUID PK DEFAULT gen_random_uuid()
- campaign_id UUID references campaigns(id) ON DELETE CASCADE
- contact_id UUID references contacts(id) ON DELETE CASCADE
- status TEXT DEFAULT 'pending'    -- pending | sent | delivered | read | replied | failed
- sent_at TIMESTAMPTZ
- error_message TEXT

TABLE: messages
- id UUID PK DEFAULT gen_random_uuid()
- workspace_id UUID references workspaces(id) ON DELETE CASCADE
- contact_id UUID references contacts(id) ON DELETE CASCADE
- campaign_id UUID references campaigns(id)  -- null for manual messages
- direction TEXT NOT NULL          -- 'outbound' | 'inbound'
- body TEXT NOT NULL
- status TEXT DEFAULT 'pending'    -- pending | sent | delivered | read | failed
- ultramsg_message_id TEXT         -- ID returned by UltraMsg
- sent_at TIMESTAMPTZ
- created_at TIMESTAMPTZ DEFAULT now()

TABLE: templates
- id UUID PK DEFAULT gen_random_uuid()
- workspace_id UUID references workspaces(id) ON DELETE CASCADE
- name TEXT NOT NULL
- body TEXT NOT NULL               -- supports {{name}}, {{company}} variables
- category TEXT                    -- 'sales' | 'followup' | 'welcome' | 'custom'
- created_at TIMESTAMPTZ DEFAULT now()

TABLE: bot_rules
- id UUID PK DEFAULT gen_random_uuid()
- workspace_id UUID references workspaces(id) ON DELETE CASCADE
- trigger_keyword TEXT             -- keyword to match (case-insensitive)
- match_type TEXT DEFAULT 'contains' -- 'exact' | 'contains' | 'starts_with'
- response_body TEXT NOT NULL
- is_active BOOLEAN DEFAULT true
- priority INT DEFAULT 0
- created_at TIMESTAMPTZ DEFAULT now()

-- Enable Row Level Security on ALL tables
-- Policies: users can only access data from their own workspace

-- Enable Realtime on messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE campaign_contacts;
```

---

## ═══════════════════════════════════════════
## BLOQUE 6 — MÓDULOS A GENERAR (PASO A PASO)
## ═══════════════════════════════════════════

```
Build the following modules in this exact order. For each module, generate:
1. The database queries/API routes (server-side)
2. The React components (client-side)
3. The TypeScript types
4. Any relevant hooks

═══ MODULE 1: AUTH & SETUP ═══
- Supabase Auth with email/password
- Login page with clean form (Shadcn Card + Form)
- Workspace setup wizard on first login (enter UltraMsg instanceId + token)
- Protected routes via Next.js middleware
- Store workspace config in Supabase, never in localStorage

═══ MODULE 2: CONTACTS MANAGER ═══
- Full contacts list with TanStack Table (sortable, filterable, paginated)
- Import modal with two tabs:
  Tab 1 — Excel Upload: 
    - Drag & drop .xlsx file
    - Parse with SheetJS (xlsx package)
    - Show preview of first 5 rows with column mapping UI
    - User maps columns: "Phone Number" → phone, "Name" → name, etc.
    - Bulk upsert into Supabase contacts table
  Tab 2 — Google Sheets URL:
    - User pastes a public Google Sheets URL
    - Server fetches sheet data via Sheets API
    - Same column mapping flow
- Phone number validation and normalization to E.164 format
- Contact detail page: message history, tags, status timeline, notes
- Inline tag editing with badge UI

═══ MODULE 3: TEMPLATES EDITOR ═══
- Rich template list with category filter
- Template editor with:
  - Variable syntax highlighting: {{name}}, {{company}} shown in colored chips
  - Live preview pane showing rendered message with sample data
  - Character count (WhatsApp limit: 4096 chars)
- AI Improve Button:
  - Sends template body to /api/ai/improve-template
  - Shows 3 AI-generated variants in a modal
  - User picks one or discards
  - System prompt: "You are an expert WhatsApp sales copywriter. Improve this message 
    to be more persuasive, conversational, and clear. Keep it under 300 chars. 
    Preserve any {{variables}}. Return 3 variants as JSON array."

═══ MODULE 4: CAMPAIGNS (BULK SENDING) ═══
- New Campaign flow (multi-step form):
  Step 1: Name + select template
  Step 2: Select contacts (filter by tags, status, or upload new list)
  Step 3: Schedule (send now OR pick datetime)
  Step 4: Review + confirm (shows: X contacts, template preview, estimated time)

- Bulk send logic (CRITICAL — handle rate limits):
  - Do NOT send all messages in a single API call (UltraMsg rate limit: ~1 msg/sec)
  - Use Upstash QStash to enqueue one job per contact
  - Each job calls /api/messages/send with a 1-2 second delay
  - Update campaign_contacts status after each send
  - Show real-time progress bar via Supabase Realtime subscription

- Variable replacement: replace {{name}} with contact.name before sending

- Campaign detail page:
  - Status breakdown pie chart (pending/sent/delivered/read/replied/failed)
  - Contacts table with individual status per message
  - Re-send to failed contacts button

═══ MODULE 5: INBOX (CHAT VIEW) ═══
- Two-panel layout (like WhatsApp Web):
  Left panel: conversation list sorted by latest message, searchable
  Right panel: full chat thread with the selected contact

- MessageBubble component:
  - Outbound: right-aligned, green/teal background, show status icon (✓✓)
  - Inbound: left-aligned, white background
  - Show timestamp

- Manual message composer at bottom with Send button
  - Calls /api/messages/send directly (not through campaign queue)

- Realtime updates: subscribe to messages table via Supabase Realtime
  - New inbound message triggers notification toast + updates conversation list

- Contact sidebar (collapsible right panel):
  - Shows contact info, tags, status selector
  - Quick notes field
  - Link to full contact profile

═══ MODULE 6: BOT / AUTO-RESPONSES ═══
- Bot rules list (toggle active/inactive per rule)
- Add rule modal:
  - Trigger keyword + match type (exact / contains / starts_with)
  - Response message (supports variables)
  - Priority order (drag to reorder)
- Webhook handler at /api/messages/webhook:
  - Receives inbound message from UltraMsg
  - Saves to messages table (direction: 'inbound')
  - Checks bot_rules for matching keyword
  - If match found: sends auto-response via /api/messages/send
  - Updates contact status if needed
  - Triggers Supabase Realtime update for inbox

- IMPORTANT: Add webhook secret verification header to prevent spoofing

═══ MODULE 7: ANALYTICS ═══
- Top metrics cards (using Shadcn Card + Recharts):
  - Total messages sent (this month)
  - Average response rate (%) — messages that got a reply
  - New contacts added (this month)
  - Active campaigns
  
- Charts:
  1. Messages sent per day (last 30 days) — BarChart
  2. Response rate over time — LineChart
  3. Contact status distribution — PieChart (new/contacted/responded/converted/lost)
  4. Top campaigns by response rate — horizontal BarChart

- Contact classification with AI:
  - Button "Auto-classify contacts" on analytics page
  - Calls /api/ai/classify-contact for contacts with recent conversation
  - AI reads last 10 messages and suggests: hot-lead / warm / cold / churned
  - Shows suggestions in review modal, user approves bulk update

- Date range filter (last 7 / 30 / 90 days / custom)

═══ MODULE 8: SETTINGS ═══
- Profile settings (name, avatar via Supabase Storage)
- Workspace settings:
  - UltraMsg instanceId + token (masked input with eye toggle)
  - "Test Connection" button that sends a test message to a given number
  - Webhook URL display (copy button): https://yourapp.vercel.app/api/messages/webhook
  - Google Sheets OAuth connect/disconnect
- Danger zone: delete workspace data
```

---

## ═══════════════════════════════════════════
## BLOQUE 7 — INTEGRACIONES TÉCNICAS DETALLADAS
## ═══════════════════════════════════════════

```
═══ ULTRAMSG INTEGRATION ═══

File: lib/ultramsg/client.ts

Create a typed UltraMsg client class:

class UltraMsgClient {
  private baseUrl: string
  private token: string
  
  constructor(instanceId: string, token: string) {
    this.baseUrl = `https://api.ultramsg.com/${instanceId}`
    this.token = token
  }

  async sendMessage(to: string, body: string): Promise<UltraMsgResponse>
  async getMessages(limit?: number): Promise<UltraMsgMessage[]>
  async getChats(): Promise<UltraMsgChat[]>
}

Rules:
- Phone format for UltraMsg: "5491112345678" (no + prefix, include country code)
- Always wrap in try/catch and return typed Result<T, Error>
- Log all API calls server-side for debugging

═══ WEBHOOK HANDLER (/api/messages/webhook/route.ts) ═══

POST handler must:
1. Verify request comes from UltraMsg (check secret token in header or query param)
2. Parse payload: { from, body, type, timestamp }
3. Only process type === 'chat' (text messages)
4. Find or create contact by phone number in Supabase
5. Insert message record (direction: 'inbound')
6. Query bot_rules sorted by priority for matching rule
7. If rule matches: call UltraMsgClient.sendMessage() + insert outbound message
8. Return 200 OK immediately (UltraMsg requires fast response)

═══ EXCEL / SHEETS IMPORT ═══

File: lib/utils/excel.ts
- Use SheetJS (xlsx) to parse uploaded .xlsx file
- Return: { headers: string[], rows: Record<string, any>[] }

File: lib/google/sheets.ts  
- Accept public Google Sheets URL
- Extract spreadsheet ID from URL using regex
- Use googleapis to fetch sheet data
- Return same format as excel parser

Phone normalization (lib/utils/phone.ts):
- Accept any format: "011-1234-5678", "(011) 1234-5678", "+54 11 1234-5678"
- Normalize to E.164: "+5491112345678"
- Use libphonenumber-js package
- Default country: AR (Argentina) — make this configurable in workspace settings

═══ BULK SEND WITH QUEUE ═══

File: app/api/campaigns/[id]/launch/route.ts
1. Fetch campaign + all campaign_contacts (status: 'pending')
2. Fetch template + workspace UltraMsg credentials
3. For each contact, publish a QStash message to /api/messages/send
   with delay: index * 1200ms (1.2 second spacing)
4. Update campaign status to 'running'

File: app/api/messages/send/route.ts
1. Validate request (accept from QStash OR from frontend for manual sends)
2. Replace template variables with contact data
3. Call UltraMsgClient.sendMessage()
4. Update campaign_contact status and messages table
5. Update campaign sent_count counter

═══ AI ENDPOINTS ═══

/api/ai/improve-template (POST):
- Input: { templateBody: string }
- System prompt: expert WhatsApp copywriter
- Return: { variants: string[] } (3 options)
- Use gpt-4o-mini, temperature: 0.8, max_tokens: 500

/api/ai/classify-contact (POST):
- Input: { contactId: string, messages: Message[] }
- System prompt: "Analyze this WhatsApp conversation history. 
  Classify the contact as one of: hot-lead, warm-lead, cold-lead, churned, converted.
  Also suggest 1-3 relevant tags. Return JSON: { status, tags, reasoning }"
- Return: { status, tags, reasoning }
- Use gpt-4o-mini, temperature: 0.3, max_tokens: 200
```

---

## ═══════════════════════════════════════════
## BLOQUE 8 — DISEÑO UI/UX
## ═══════════════════════════════════════════

```
Design Language:
- Theme: Dark mode by default, with optional light mode toggle
- Primary color: Emerald green (#10B981) — WhatsApp-inspired but modern
- Background: Near-black (#0F1117) with subtle card surfaces (#1A1D27)
- Accent: Soft white text (#F1F5F9) with muted secondary (#64748B)
- Font: "Geist" (Vercel's font) for UI, monospace for message previews
- Border radius: 12px for cards, 20px for message bubbles, 8px for buttons
- Shadows: subtle glow on active elements

Sidebar Navigation (left, 60px icon-only, expands to 220px on hover):
- Logo/icon at top
- Nav items with icons + labels: Dashboard, Inbox, Campaigns, Contacts, Templates, Bot, Analytics, Settings
- Workspace switcher at bottom
- User avatar + logout at very bottom

Inbox layout (full page height):
- Left panel (380px fixed): conversation list with search, unread badge, last message preview
- Right panel (flex-1): chat thread + message input
- Right sidebar (320px, toggleable): contact info panel

Responsive breakpoints:
- Mobile (<768px): show only one panel at a time with back navigation
- Tablet (768-1024px): collapsed sidebar + full content
- Desktop (1024px+): full layout

Loading states: use Skeleton components (Shadcn) for all data-fetched sections
Empty states: illustrated with SVG + clear CTA button
Error states: inline error with retry button, never just console.log

Animations:
- Page transitions: fade + slight translateY (150ms ease-out)
- Message bubbles: slide in from bottom on new message
- Progress bars: smooth width transition for campaign progress
- Modal: scale from 0.95 to 1 with opacity (200ms)
```

---

## ═══════════════════════════════════════════
## BLOQUE 9 — VARIABLES DE ENTORNO
## ═══════════════════════════════════════════

```
Generate .env.local.example with ALL required variables:

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server-side only, never expose

# UltraMsg (store per workspace in DB, but allow env fallback for dev)
ULTRAMSG_INSTANCE_ID=
ULTRAMSG_TOKEN=
ULTRAMSG_WEBHOOK_SECRET=          # custom secret to verify webhook calls

# OpenAI
OPENAI_API_KEY=                   # server-side only

# Upstash QStash
QSTASH_URL=
QSTASH_TOKEN=
QSTASH_CURRENT_SIGNING_KEY=
QSTASH_NEXT_SIGNING_KEY=

# Google Sheets (optional)
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## ═══════════════════════════════════════════
## BLOQUE 10 — INSTRUCCIONES DE EJECUCIÓN
## ═══════════════════════════════════════════

```
When generating code, follow this output format for EVERY file:

1. Start with: // FILE: [path/to/file.ts]
2. Include all imports at the top
3. Export all types explicitly
4. Add JSDoc comments on public functions
5. No console.log in production code — use a structured logger (pino or winston)
6. Every async function must have try/catch with typed errors
7. Use server actions where appropriate in Next.js 14+

Generate files in this priority order:
1. types/ — all TypeScript interfaces first
2. supabase/migrations/ — database schema
3. lib/ — all utility and API clients
4. app/api/ — all backend routes
5. hooks/ — all React hooks
6. stores/ — Zustand stores
7. components/ — UI components (bottom-up: atoms → molecules → organisms)
8. app/(dashboard)/ — pages

After generating all code, provide:
- A setup checklist (numbered steps from git clone to first running app)
- UltraMsg webhook configuration guide (step-by-step with screenshots description)
- Supabase RLS policy examples for multi-tenant security
- Known limitations and future improvement suggestions
```

---

## ═══════════════════════════════════════════
## BLOQUE 11 — RESTRICCIONES Y LÍMITES
## ═══════════════════════════════════════════

```
NEVER do the following:
- ❌ Never expose API keys, tokens, or secrets in client-side code
- ❌ Never use useEffect for data fetching — use TanStack Query or Server Components
- ❌ Never use any: use proper TypeScript types everywhere
- ❌ Never send all bulk messages in a single loop without queuing
- ❌ Never store UltraMsg tokens in localStorage or sessionStorage
- ❌ Never use deprecated Next.js Pages Router patterns (use App Router only)
- ❌ Never skip error handling on API routes (always return proper HTTP status codes)
- ❌ Never hardcode phone country codes — make them configurable

ALWAYS do the following:
- ✅ Validate all user input server-side with Zod before any DB operation
- ✅ Use Supabase RLS policies so users only see their workspace data
- ✅ Normalize phone numbers to E.164 before storing or sending
- ✅ Return loading, error, and empty states for every data-fetched component
- ✅ Use optimistic updates for send message UX (message appears immediately)
- ✅ Rate-limit all AI endpoints (1 request per second per workspace)
- ✅ Add request logging middleware to all API routes
```

---

## ═══════════════════════════════════════════
## BLOQUE 12 — PUNTO DE INICIO SUGERIDO
## ═══════════════════════════════════════════

```
If you need to start somewhere, begin with this sequence:

PHASE 1 — Foundation (Day 1-2):
→ npx create-next-app@latest whatssend --typescript --tailwind --app
→ Setup Supabase project + run migration
→ Configure Shadcn/ui
→ Auth flow (login/register/middleware)
→ Sidebar layout + routing

PHASE 2 — Core Features (Day 3-5):
→ Contacts module (list + import Excel)
→ Templates module (CRUD + AI improve)
→ Manual message send via UltraMsg
→ Basic inbox (without realtime)

PHASE 3 — Automation (Day 6-8):
→ Campaigns + bulk send with QStash
→ Webhook handler + bot rules
→ Realtime inbox updates

PHASE 4 — Insights (Day 9-10):
→ Analytics dashboard
→ AI contact classification
→ Polish UI + mobile responsive
→ Deploy to Vercel

Start with Phase 1 now. Generate all files for Phase 1 completely before moving on.
```

---

*Prompt generado con ingeniería profesional de prompts — Claude Sonnet 4.6*
*Listo para usar en Antigravity AI Code Editor*

---

## ═══════════════════════════════════════════
## BLOQUE 13 — BOT VENDEDOR DIGITAL CONVERSACIONAL
## ═══════════════════════════════════════════

```
The bot is NOT a simple keyword-matching bot. It is a conversational AI sales agent 
powered by GPT-4o-mini with a specific persona and goal: sell fiber optic internet 
service naturally, like a human sales executive would on WhatsApp.

═══ BOT ARCHITECTURE ═══

Replace the simple bot_rules keyword system with a hybrid approach:
1. GPT-4o-mini handles all natural conversation (intent detection + response generation)
2. A structured "data extraction layer" silently captures key fields from conversation
3. Simple keyword rules remain only as fallback for when AI is unavailable

File: lib/ai/sales-bot.ts

The bot receives:
- Full conversation history (last 20 messages for context window efficiency)
- Available promotions (loaded from promotions table)
- Contact's current known data (what's already saved)
- Workspace persona config (company name, tone, executive name)

System prompt for the sales bot:
"Eres un asesor de ventas digital de [COMPANY_NAME], especializado en servicios de 
internet de fibra óptica. Tu objetivo es atender consultas de clientes de forma 
natural, amigable y profesional por WhatsApp, como lo haría un ejecutivo de ventas humano.

REGLAS:
- Responde siempre en español, de forma conversacional y cálida
- Nunca suenes como un bot o formulario
- Cuando el cliente muestre interés, obtén naturalmente: RUT, dirección completa, 
  comuna, número de contacto alternativo (si es diferente al de WhatsApp), y correo
- Usa los datos de promociones disponibles para responder consultas de precios y planes
- Si el cliente pregunta por disponibilidad, dile que vas a verificar y que te 
  confirmarás en breve (la verificación es manual)
- Nunca inventes precios o promociones que no estén en el archivo de promociones
- Si no sabes algo, dí que lo vas a consultar
- Mantén la conversación enfocada pero sin presionar

DATOS A CAPTURAR (hazlo naturalmente dentro de la conversación):
- RUT del cliente
- Dirección de instalación + comuna
- Teléfono de contacto alternativo si es diferente al WhatsApp
- Correo electrónico
- Servicio/velocidad de interés
- Promoción de interés

FORMATO DE RESPUESTA (JSON interno, nunca mostrar al cliente):
{
  message: string,
  extracted: {
    rut?: string,
    address?: string,
    comuna?: string,
    alt_phone?: string,
    email?: string,
    service_interest?: string,
    promo_interest?: string
  },
  intent: 'greeting' | 'inquiry' | 'interested' | 'objection' | 'ready_to_buy' | 'not_interested'
}"

═══ PROMOTIONS MODULE ═══

TABLE: promotions
- id UUID PK DEFAULT gen_random_uuid()
- workspace_id UUID references workspaces(id)
- name TEXT                        -- "Plan 600MB"
- speed TEXT                       -- "600 Mbps"
- price DECIMAL
- description TEXT
- additional_services TEXT[]       -- ["WiFi 6 gratis", "instalación gratis"]
- is_active BOOLEAN DEFAULT true
- created_at TIMESTAMPTZ

Upload via Settings → Promociones → Upload Excel or PDF
Bot fetches active promotions on every conversation turn as context.
Admin can also add/edit promotions in a simple table UI.

═══ DATA EXTRACTION FLOW ═══

File: app/api/messages/bot/route.ts

1. Receive inbound message from webhook
2. Fetch conversation history (last 20 messages)
3. Fetch active promotions for workspace
4. Fetch contact's current known data
5. Call GPT-4o-mini with full context
6. Parse JSON response: { message, extracted, intent }
7. Send reply to client via UltraMsg
8. Update contact fields with extracted data (only overwrite if not null)
9. Update contact status based on intent:
   - 'interested' or 'ready_to_buy' → add to pipeline as 'Interesado'
   - 'not_interested' → status: 'cold-lead'
10. Save both messages to messages table
11. Trigger Supabase Realtime for inbox update
```

---

## ═══════════════════════════════════════════
## BLOQUE 14 — PIPELINE DE VENTAS
## ═══════════════════════════════════════════

```
The Sales Pipeline tracks potential clients from first contact through order confirmation.
It auto-populates from bot conversations and allows executives to complete and submit sales.

═══ DATABASE ═══

TABLE: pipeline_leads
- id UUID PK DEFAULT gen_random_uuid()
- workspace_id UUID references workspaces(id)
- contact_id UUID references contacts(id)
- status TEXT DEFAULT 'interested'
  -- 'interested' | 'verifying' | 'data_complete' | 'sent' | 'ingested' | 'rejected'
- status_history JSONB[]           -- [{status, changed_at, changed_by, note}]
- assigned_to UUID references profiles(id)

-- Form fields (pre-filled from bot, completed by executive)
- rut TEXT
- full_name TEXT
- address TEXT
- comuna TEXT
- service TEXT
- promotion TEXT
- additional_services TEXT[]
- observations TEXT
- web_executive TEXT
- supervisor TEXT
- install_contact_name TEXT
- install_phone TEXT
- email TEXT
- billing_date DATE
- biometric_code TEXT              -- entered manually after biometric verification
- order_number TEXT                -- auto-captured from backoffice email reply

- sent_at TIMESTAMPTZ
- ingested_at TIMESTAMPTZ
- sent_email_message_id TEXT       -- Gmail Message-ID header for reply matching
- created_at TIMESTAMPTZ DEFAULT now()
- updated_at TIMESTAMPTZ DEFAULT now()

═══ PIPELINE UI ═══

Layout: Kanban board with 6 columns:
🟡 Interesado | 🔵 Verificando | 🟢 Datos completos | 📤 Enviada | ✅ Ingresada | ❌ No ingresada

Card shows: name, phone, service interest, executive, time in stage
Click card → opens right drawer with full editable form

Lead Detail Drawer:
- All pipeline fields editable
- Auto-filled fields show "capturado automáticamente" badge
- Pending fields highlighted in yellow
- WhatsApp conversation preview (last 10 messages, read-only)
- Status timeline with dates
- "Enviar a Backoffice" button (enabled only when status === 'data_complete')
- Biometric code input field

═══ EMAIL TO BACKOFFICE ═══

File: app/api/pipeline/send-to-backoffice/route.ts

Email subject: "Nueva Venta - [NOMBRE] - [SERVICIO] - [FECHA]"

Email body (exact format):

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

[ID interno: {lead_id} — WhatsSend Platform]

Implementation:
- Use Nodemailer + Gmail SMTP + App Password
- Store Gmail Message-ID from sent email in pipeline_leads.sent_email_message_id
- CC assigned executive automatically
- Update lead status to 'sent', set sent_at

═══ BACKOFFICE REPLY — AUTO ORDER CAPTURE ═══

File: app/api/email/check-replies/route.ts
Triggered every 5 minutes via Vercel Cron Job.

Logic:
1. Fetch unread emails from Gmail inbox (last 24h)
2. For each email, check In-Reply-To header against stored sent_email_message_id
3. If match found, run order number regex on email body:
   Pattern: /\b(\d{9,10}[A-Z]?)\b/gi
   Handles:
   - "La orden 1227946077A se envió correctamente"
   - "1227946077A"
   - "1227946077"
4. If order number found:
   - Save to pipeline_leads.order_number
   - Set status → 'ingested', set ingested_at
   - Add entry to status_history
   - Send in-app notification to assigned executive
   - Optional: send WhatsApp confirmation to client
5. If reply found but no order number:
   - Flag lead for manual review
   - Notify executive to check

vercel.json cron:
{
  "crons": [{ "path": "/api/email/check-replies", "schedule": "*/5 * * * *" }]
}

═══ PIPELINE METRICS (add to analytics page) ═══

- Conversion funnel per stage
- Average days per stage
- Sales by executive
- Sales by promotion/plan
- Rejection rate
```

---

## ═══════════════════════════════════════════
## BLOQUE 15 — DEPLOYMENT EN VERCEL
## ═══════════════════════════════════════════

```
USE VERCEL over Netlify for this project:
✅ Next.js App Router: zero-config, built by same team
✅ Cron Jobs: native support (needed for email reply checking every 5min)
✅ Upstash QStash: native integration
✅ Free Hobby tier is sufficient to start
⚠️  Netlify has limitations with Next.js App Router serverless functions

═══ STEP-BY-STEP DEPLOYMENT ═══

Step 1 — GitHub:
- Push project to private GitHub repo
- Ensure .env.local is in .gitignore

Step 2 — Supabase:
1. Create project at supabase.com (free tier)
2. SQL Editor → run migrations/001_initial_schema.sql
3. Authentication → Email provider → enable
4. Project Settings → API → copy URL, anon key, service_role key
5. Realtime → enable for: messages, campaign_contacts, pipeline_leads tables

Step 3 — UltraMsg:
1. ultramsg.com → create instance → scan QR with WhatsApp number
2. Copy Instance ID + Token
3. Settings → Webhooks → URL: https://YOUR_APP.vercel.app/api/messages/webhook
4. Enable: message_received event

Step 4 — Gmail App Password:
1. Dedicated Gmail account for platform
2. Account → Security → 2-Step Verification → App passwords
3. Generate for "Mail" + "WhatsSend" → copy 16-char password

Step 5 — OpenAI:
1. platform.openai.com → API Keys → Create
2. Set usage limit $15-20/month to avoid surprises

Step 6 — Upstash:
1. upstash.com → QStash → create instance
2. Copy QSTASH_URL, QSTASH_TOKEN, signing keys

Step 7 — Deploy to Vercel:
1. vercel.com → New Project → Import GitHub repo
2. Framework: Next.js (auto-detected)
3. Add ALL environment variables
4. Deploy (~2 min)
5. Copy production URL

Step 8 — Post-deploy:
1. Update NEXT_PUBLIC_APP_URL to production URL
2. Update UltraMsg webhook URL to production URL
3. Test end-to-end: send WhatsApp → appears in inbox ✓

═══ ALL ENVIRONMENT VARIABLES ═══

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # server-side only

# UltraMsg
ULTRAMSG_INSTANCE_ID=
ULTRAMSG_TOKEN=
ULTRAMSG_WEBHOOK_SECRET=            # random string you generate

# OpenAI
OPENAI_API_KEY=                     # server-side only

# Upstash QStash
QSTASH_URL=
QSTASH_TOKEN=
QSTASH_CURRENT_SIGNING_KEY=
QSTASH_NEXT_SIGNING_KEY=

# Gmail
GMAIL_USER=ventas@gmail.com
GMAIL_APP_PASSWORD=                 # 16-char app password
GMAIL_BACKOFFICE_DEFAULT=           # default backoffice recipient email

# Google Sheets (optional)
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=

# App
NEXT_PUBLIC_APP_URL=https://whatssend.vercel.app

═══ ESTIMATED MONTHLY COSTS ═══

Vercel Hobby:      $0    (free, sufficient to start)
Supabase Free:     $0    (500MB DB, 1GB storage)
UltraMsg:         ~$15-20 USD  (1 WhatsApp instance)
OpenAI API:       ~$5-15 USD   (gpt-4o-mini is very cheap)
Upstash Free:      $0    (500 messages/day)
────────────────────────────────
Total to launch:  ~$20-35 USD/month
```

---

*Prompt generado con ingeniería profesional de prompts — Claude Sonnet 4.6*
*Versión 2.0 — Bot Vendedor Digital + Pipeline de Ventas + Captura automática de orden + Deployment Vercel*
*Listo para usar en Antigravity AI Code Editor*