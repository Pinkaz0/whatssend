-- ═══════════════════════════════════════════
-- WhatsSend — Bot Schema (bot_system_prompt + bot_files)
-- ═══════════════════════════════════════════

-- 1. Agregar columnas de configuración del bot al workspace
ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS bot_system_prompt TEXT,
  ADD COLUMN IF NOT EXISTS bot_custom_instructions TEXT;

-- 2. Crear tabla bot_files para RAG y archivos de ofertas
CREATE TABLE IF NOT EXISTS bot_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'other', -- 'pdf', 'spreadsheet', 'text', 'other'
  file_size BIGINT NOT NULL DEFAULT 0,
  storage_path TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Índice
CREATE INDEX IF NOT EXISTS idx_bot_files_workspace ON bot_files(workspace_id, active);

-- 4. RLS
ALTER TABLE bot_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso a bot_files del workspace"
  ON bot_files FOR ALL USING (
    workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
  );
