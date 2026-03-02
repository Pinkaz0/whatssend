-- 012_camila_agent_schema.sql
-- Este script crea las tablas de memoria para Camila (Super Agente)
-- y agrega el número de teléfono al perfil del administrador para notificaciones.

-- 1. Agregar teléfono al perfil para notificaciones del Agente hacia el Vendedor
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. Crear tabla de Sesiones (Máquina de Estados)
CREATE TABLE IF NOT EXISTS public.agent_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    remote_jid TEXT NOT NULL UNIQUE, -- El ID de WhatsApp del cliente (ej: 56912345678@s.whatsapp.net)
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    
    -- La Máquina de Estados (12 fases de la venta)
    estado TEXT NOT NULL DEFAULT 'CONTACTO_INICIAL' CHECK (
        estado IN (
            'CONTACTO_INICIAL',
            'PRECHEQUE_PENDIENTE',
            'OFERTA_ENVIADA',
            'DATOS_VENTA',
            'BIOMETRIA_PENDIENTE',
            'BIOMETRIA_OK',
            'ESPERANDO_CODIGO',
            'CODIGO_DISPONIBLE',
            'FORMATO_ENVIADO_BI',
            'ORDEN_INGRESADA',
            'SEGUIMIENTO_TOA',
            'COMPLETADA',
            'CANCELADA',
            'DESCARTADA'
        )
    ),
    
    -- Contexto extraído por el LLM a lo largo de la charla
    context JSONB DEFAULT '{}'::jsonb, -- Guardará: rut, nombre, direccion, correo, etc.
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en agent_sessions
ALTER TABLE public.agent_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view agent_sessions of their workspaces"
    ON public.agent_sessions FOR SELECT
    USING (workspace_id IN (
        SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
    ));

CREATE POLICY "Users can manage agent_sessions of their workspaces"
    ON public.agent_sessions FOR ALL
    USING (workspace_id IN (
        SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
    ));


-- 3. Crear tabla de Mensajes (Historial para el GPT-4o)
CREATE TABLE IF NOT EXISTS public.agent_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.agent_sessions(id) ON DELETE CASCADE NOT NULL,
    
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system_event')),
    content TEXT NOT NULL,
    
    -- Si el mensaje fue enviado exitosamente a WhatsApp
    wa_message_id TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en agent_messages
ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view agent_messages of their sessions"
    ON public.agent_messages FOR SELECT
    USING (session_id IN (
        SELECT id FROM public.agent_sessions WHERE workspace_id IN (
        SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
        )
    ));

CREATE POLICY "Users can manage agent_messages of their sessions"
    ON public.agent_messages FOR ALL
    USING (session_id IN (
        SELECT id FROM public.agent_sessions WHERE workspace_id IN (
        SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
        )
    ));
