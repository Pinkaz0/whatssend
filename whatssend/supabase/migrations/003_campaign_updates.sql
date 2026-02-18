-- ═══════════════════════════════════════════
-- WhatsSend — Migración 003: Campaign message_body + sent_at
-- Agrega columnas faltantes a campaigns
-- ═══════════════════════════════════════════

-- message_body: el texto del mensaje de la campaña
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS message_body TEXT;

-- sent_at: cuándo se envió la campaña
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;

-- Constraint único para contactos (necesario para upsert en webhook)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_workspace_phone'
  ) THEN
    ALTER TABLE contacts ADD CONSTRAINT unique_workspace_phone UNIQUE (workspace_id, phone);
  END IF;
END $$;
