-- Migración para integrar Evolution API y deprecación de UltraMsg

-- 1. Añadir nuevas columnas a la tabla workspaces para la configuración de Evolution API
ALTER TABLE workspaces
ADD COLUMN IF NOT EXISTS evolution_api_url TEXT,
ADD COLUMN IF NOT EXISTS evolution_api_key TEXT,
ADD COLUMN IF NOT EXISTS evolution_instance TEXT;

-- 2. Añadir columna evolution_message_id a la tabla messages (opcional, para tracking)
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS evolution_message_id TEXT;

-- 3. (Opcional pero recomendado) Comentar o renombrar las columnas viejas si no se usan,
-- o simplemente dejarlas por compatibilidad retroactiva durante la transición.
-- COMMENT ON COLUMN workspaces.ultramsg_instance_id IS 'DEPRECATED: Use evolution_instance instead';
-- COMMENT ON COLUMN workspaces.ultramsg_token IS 'DEPRECATED: Use evolution_api_key instead';
