-- Create promotions table
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  speed TEXT, -- e.g. "600 Mbps"
  price DECIMAL,
  description TEXT,
  additional_services TEXT[], -- ["WiFi 6", "Instalación gratis"]
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for promotions
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view promotions from their workspace"
  ON promotions FOR SELECT
  USING (workspace_id IN (
    SELECT id FROM workspaces WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Users can insert promotions for their workspace"
  ON promotions FOR INSERT
  WITH CHECK (workspace_id IN (
    SELECT id FROM workspaces WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Users can update promotions for their workspace"
  ON promotions FOR UPDATE
  USING (workspace_id IN (
    SELECT id FROM workspaces WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Users can delete promotions for their workspace"
  ON promotions FOR DELETE
  USING (workspace_id IN (
    SELECT id FROM workspaces WHERE owner_id = auth.uid()
  ));


-- Add new columns to contacts table
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS rut TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS comuna TEXT,
ADD COLUMN IF NOT EXISTS alt_phone TEXT;


-- Create pipeline_leads table
CREATE TABLE IF NOT EXISTS pipeline_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'interested', -- 'interested' | 'verifying' | 'data_complete' | 'sent' | 'ingested' | 'rejected'
  status_history JSONB[] DEFAULT '{}', -- [{status, changed_at, changed_by, note}]
  assigned_to UUID REFERENCES profiles(id),
  
  -- Capturable fields
  rut TEXT,
  full_name TEXT,
  address TEXT,
  comuna TEXT,
  service TEXT,
  promotion TEXT,
  additional_services TEXT[],
  observations TEXT,
  web_executive TEXT,
  supervisor TEXT,
  install_contact_name TEXT,
  install_phone TEXT,
  email TEXT,
  billing_date DATE,
  biometric_code TEXT,
  order_number TEXT,
  
  sent_at TIMESTAMPTZ,
  ingested_at TIMESTAMPTZ,
  sent_email_message_id TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for pipeline_leads
ALTER TABLE pipeline_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view leads from their workspace"
  ON pipeline_leads FOR SELECT
  USING (workspace_id IN (
    SELECT id FROM workspaces WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Users can manage leads for their workspace"
  ON pipeline_leads FOR ALL
  USING (workspace_id IN (
    SELECT id FROM workspaces WHERE owner_id = auth.uid()
  ));

-- Enable Realtime for pipeline updates
ALTER PUBLICATION supabase_realtime ADD TABLE pipeline_leads;
