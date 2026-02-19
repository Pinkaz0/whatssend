ALTER TABLE workspaces 
ADD COLUMN IF NOT EXISTS bot_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS bot_custom_instructions TEXT;
