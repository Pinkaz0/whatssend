-- ═══════════════════════════════════════════
-- WhatsSend — Migración 004: Google Credentials
-- Agrega credenciales de cuenta de servicio Google a workspaces
-- ═══════════════════════════════════════════

-- google_account_email: Email de la cuenta de servicio (service account email)
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS google_account_email TEXT;

-- google_private_key: Llave privada de la cuenta de servicio
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS google_private_key TEXT;
