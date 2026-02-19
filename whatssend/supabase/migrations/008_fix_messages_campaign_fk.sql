-- ═══════════════════════════════════════════════════════════════
-- Migración 008: Fix FK messages.campaign_id → ON DELETE SET NULL
-- ───────────────────────────────────────────────────────────────
-- El FK original no tenía ON DELETE CASCADE ni SET NULL, lo que
-- causaba un error 409 al intentar eliminar una campaña que ya
-- había generado mensajes.
-- Solución: cambiamos a ON DELETE SET NULL para que al borrar una
-- campaña, los mensajes queden con campaign_id = NULL (conservando
-- el historial) en lugar de bloquear la operación.
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE messages
  DROP CONSTRAINT IF EXISTS messages_campaign_id_fkey;

ALTER TABLE messages
  ADD CONSTRAINT messages_campaign_id_fkey
  FOREIGN KEY (campaign_id)
  REFERENCES campaigns(id)
  ON DELETE SET NULL;
