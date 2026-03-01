-- ═══════════════════════════════════════════
-- WhatsSend — Migración para Ventas TOA y Registro de Ventas Manuales
-- ═══════════════════════════════════════════

-- ════════ TABLA: ventas_toa ════════
CREATE TABLE IF NOT EXISTS ventas_toa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  orden TEXT NOT NULL,
  estado TEXT DEFAULT 'PENDIENTE',
  cliente TEXT,
  rut TEXT,
  fibra TEXT,
  fecha_emision TEXT,
  fecha_agenda TEXT,
  bloque TEXT,
  ventana TEXT,
  tecnico TEXT,
  obs TEXT,
  telefono TEXT,
  direccion TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(workspace_id, orden)
);

-- Trigger para updated_at en ventas_toa
CREATE OR REPLACE FUNCTION update_ventas_toa_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ventas_toa_modtime
BEFORE UPDATE ON ventas_toa
FOR EACH ROW EXECUTE FUNCTION update_ventas_toa_updated_at();

-- ════════ TABLA: registros_ventas ════════
CREATE TABLE IF NOT EXISTS registros_ventas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('bo', 'reemision', 'biometria')),
  bo TEXT,
  rut TEXT NOT NULL,
  nombre TEXT,
  direccion_limpia TEXT,
  direccion_inst TEXT NOT NULL,
  comuna TEXT,
  region TEXT,
  servicio TEXT,
  adicional TEXT,
  promo TEXT,
  ejecutivo TEXT,
  supervisor TEXT,
  contacto TEXT,
  fono TEXT,
  ciclo TEXT,
  correo TEXT,
  estado TEXT DEFAULT 'pendiente_envio' CHECK (estado IN ('pendiente_envio', 'enviada', 'fallida')),
  fecha TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ═══════════════════════════════════════════
-- ÍNDICES
-- ═══════════════════════════════════════════
CREATE INDEX idx_ventas_toa_workspace ON ventas_toa(workspace_id);
CREATE INDEX idx_ventas_toa_orden ON ventas_toa(orden);
CREATE INDEX idx_registros_ventas_workspace ON registros_ventas(workspace_id);
CREATE INDEX idx_registros_ventas_estado ON registros_ventas(estado);

-- ═══════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════

ALTER TABLE ventas_toa ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_ventas ENABLE ROW LEVEL SECURITY;

-- Ventas TOA: acceso a través del workspace
CREATE POLICY "Acceso a ventas_toa del workspace"
  ON ventas_toa FOR ALL USING (
    workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
  );

-- Registros Ventas: acceso a través del workspace
CREATE POLICY "Acceso a registros_ventas del workspace"
  ON registros_ventas FOR ALL USING (
    workspace_id IN (SELECT id FROM workspaces WHERE owner_id = auth.uid())
  );

-- ═══════════════════════════════════════════
-- REALTIME
-- ═══════════════════════════════════════════
ALTER PUBLICATION supabase_realtime ADD TABLE ventas_toa;
ALTER PUBLICATION supabase_realtime ADD TABLE registros_ventas;
