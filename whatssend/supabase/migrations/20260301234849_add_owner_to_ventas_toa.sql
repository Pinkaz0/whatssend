-- Migración para añadir trazabilidad a las ventas de TOA
ALTER TABLE ventas_toa
ADD COLUMN owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Para registros pasados, asignamos el dueño del workspace temporalmente si es posible
-- o los dejamos en null.
