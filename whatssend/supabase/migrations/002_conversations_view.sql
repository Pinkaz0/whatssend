-- ═══════════════════════════════════════════
-- WhatsSend — Migración 002: Conversations View
-- Optimiza la carga de la lista de chats del inbox
-- ═══════════════════════════════════════════

-- Índice para obtener el último mensaje de cada contacto rápidamente
CREATE INDEX IF NOT EXISTS idx_messages_contact_latest
  ON messages(workspace_id, contact_id, created_at DESC);

-- Vista: conversations_view
-- Agrupa los últimos mensajes por contacto para la lista del inbox
CREATE OR REPLACE VIEW conversations_view AS
SELECT
  c.id AS contact_id,
  c.workspace_id,
  c.name AS contact_name,
  c.phone AS contact_phone,
  c.tags AS contact_tags,
  c.status AS contact_status,
  lm.body AS last_message_body,
  lm.direction AS last_message_direction,
  lm.created_at AS last_message_at,
  COALESCE(unread.count, 0)::INT AS unread_count
FROM contacts c
LEFT JOIN LATERAL (
  SELECT m.body, m.direction, m.created_at
  FROM messages m
  WHERE m.contact_id = c.id
  ORDER BY m.created_at DESC
  LIMIT 1
) lm ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*)::INT AS count
  FROM messages m
  WHERE m.contact_id = c.id
    AND m.direction = 'inbound'
    AND m.status != 'read'
) unread ON true
WHERE lm.created_at IS NOT NULL
ORDER BY lm.created_at DESC;
