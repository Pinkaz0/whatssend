-- ═══════════════════════════════════════════
-- WhatsSend — Migración 005: Inbox Hardening
-- Asegura unicidad de mensajes y optimiza índices
-- ═══════════════════════════════════════════

-- 1. Asegurar que ultramsg_message_id sea único para evitar duplicados
-- Primero, eliminamos duplicados si existen (manteniendo el primero creado)
DELETE FROM messages a USING (
  SELECT min(ctid) as ctid, ultramsg_message_id
  FROM messages 
  WHERE ultramsg_message_id IS NOT NULL 
  GROUP BY ultramsg_message_id 
  HAVING COUNT(*) > 1
) b
WHERE a.ultramsg_message_id = b.ultramsg_message_id 
AND a.ctid <> b.ctid;

-- Luego agregamos el constraint
ALTER TABLE messages 
ADD CONSTRAINT messages_ultramsg_message_id_key 
UNIQUE (ultramsg_message_id);

-- 2. Índice para búsqueda rápida de mensajes por estado (útil para analytics)
CREATE INDEX IF NOT EXISTS idx_messages_status 
ON messages(status);

-- 3. Índice para búsqueda rápida de campañas pendientes
CREATE INDEX IF NOT EXISTS idx_campaigns_status 
ON campaigns(status);
