-- ═══════════════════════════════════════════
-- WhatsSend — Migración Inicial
-- ═══════════════════════════════════════════

-- ════════ TABLA: profiles ════════
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Trigger para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ════════ TABLA: workspaces ════════
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ultramsg_instance_id TEXT,
  ultramsg_token TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ════════ TABLA: contacts ════════
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  name TEXT,
  email TEXT,
  company TEXT,
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'responded', 'converted', 'lost')),
  notes TEXT,
  source TEXT CHECK (source IN ('excel', 'sheets', 'manual')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(workspace_id, phone)
);

-- ════════ TABLA: templates ════════
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT CHECK (category IN ('sales', 'followup', 'welcome', 'custom')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ════════ TABLA: campaigns ════════
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template_id UUID REFERENCES templates(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'running', 'completed', 'failed')),
  scheduled_at TIMESTAMPTZ,
  total_contacts INT DEFAULT 0,
  sent_count INT DEFAULT 0,
  delivered_count INT DEFAULT 0,
  read_count INT DEFAULT 0,
  replied_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ════════ TABLA: campaign_contacts ════════
CREATE TABLE IF NOT EXISTS campaign_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'replied', 'failed')),
  sent_at TIMESTAMPTZ,
  error_message TEXT
);

-- ════════ TABLA: messages ════════
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id),
  direction TEXT NOT NULL CHECK (direction IN ('outbound', 'inbound')),
  body TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  ultramsg_message_id TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ════════ TABLA: bot_rules ════════
CREATE TABLE IF NOT EXISTS bot_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  trigger_keyword TEXT NOT NULL,
  match_type TEXT DEFAULT 'contains' CHECK (match_type IN ('exact', 'contains', 'starts_with')),
  response_body TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  priority INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ═══════════════════════════════════════════
-- ÍNDICES
-- ═══════════════════════════════════════════

CREATE INDEX idx_contacts_workspace ON contacts(workspace_id);
CREATE INDEX idx_contacts_phone ON contacts(workspace_id, phone);
CREATE INDEX idx_contacts_status ON contacts(workspace_id, status);
CREATE INDEX idx_messages_workspace ON messages(workspace_id);
CREATE INDEX idx_messages_contact ON messages(contact_id);
CREATE INDEX idx_messages_campaign ON messages(campaign_id);
CREATE INDEX idx_messages_created_at ON messages(workspace_id, created_at DESC);
CREATE INDEX idx_campaigns_workspace ON campaigns(workspace_id);
CREATE INDEX idx_campaign_contacts_campaign ON campaign_contacts(campaign_id);
CREATE INDEX idx_bot_rules_workspace ON bot_rules(workspace_id, is_active, priority);

-- ═══════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_rules ENABLE ROW LEVEL SECURITY;

-- Perfiles: solo el propietario puede ver/editar su perfil
CREATE POLICY "Los usuarios pueden ver su propio perfil"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Los usuarios pueden actualizar su propio perfil"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Workspaces: solo el propietario
CREATE POLICY "Los usuarios pueden ver sus workspaces"
  ON workspaces FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Los usuarios pueden crear workspaces"
  ON workspaces FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Los usuarios pueden actualizar sus workspaces"
  ON workspaces FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Los usuarios pueden eliminar sus workspaces"
  ON workspaces FOR DELETE USING (auth.uid() = owner_id);

-- Contactos: acceso a través del workspace
CREATE POLICY "Acceso a contactos del workspace"
  ON contacts FOR ALL USING (
    workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
  );

-- Templates: acceso a través del workspace
CREATE POLICY "Acceso a plantillas del workspace"
  ON templates FOR ALL USING (
    workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
  );

-- Campaigns: acceso a través del workspace
CREATE POLICY "Acceso a campañas del workspace"
  ON campaigns FOR ALL USING (
    workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
  );

-- Campaign Contacts: acceso a través de la campaña
CREATE POLICY "Acceso a contactos de campaña"
  ON campaign_contacts FOR ALL USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE workspace_id IN (
        SELECT id FROM workspaces WHERE owner_id = auth.uid()
      )
    )
  );

-- Messages: acceso a través del workspace
CREATE POLICY "Acceso a mensajes del workspace"
  ON messages FOR ALL USING (
    workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
  );

-- Bot Rules: acceso a través del workspace
CREATE POLICY "Acceso a reglas de bot del workspace"
  ON bot_rules FOR ALL USING (
    workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
  );

-- ═══════════════════════════════════════════
-- REALTIME
-- ═══════════════════════════════════════════

ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE campaign_contacts;
