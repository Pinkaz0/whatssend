-- ═══════════════════════════════════════════
-- WhatsSend — Soporte para contactos inbound (webhook)
-- ═══════════════════════════════════════════

-- 1. Agregar columna last_active_at para rastrear última actividad
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

-- 2. Ampliar restricción de source para aceptar 'inbound' (mensajes entrantes del webhook)
ALTER TABLE contacts
  DROP CONSTRAINT IF EXISTS contacts_source_check;

ALTER TABLE contacts
  ADD CONSTRAINT contacts_source_check
  CHECK (source IN ('excel', 'sheets', 'manual', 'inbound'));
