-- ═══════════════════════════════════════════════════════════
-- 011 — Roles de Usuario y Auto-creación de Workspace
-- Ejecutar en Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- 1. Agregar columna role a profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user'
  CHECK (role IN ('admin', 'user'));

-- 2. Marcar al admin principal
-- ⚠️ Reemplaza 'TU_USER_ID_AQUI' con tu UUID de Supabase Auth
-- Lo encuentras en: Authentication → Users → clic en tu usuario
-- UPDATE profiles SET role = 'admin' WHERE id = 'TU_USER_ID_AQUI';

-- 3. Actualizar el trigger de nuevo usuario para:
--    a) crear perfil con role='user' por defecto
--    b) auto-crear workspace vacío
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Crear perfil
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    'user'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Auto-crear workspace para el usuario
  INSERT INTO public.workspaces (name, owner_id)
  VALUES (
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1),
      'Mi Empresa'
    ),
    NEW.id
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear el trigger (por si ya existía)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Política RLS para que admin pueda leer todos los profiles (opcional)
DROP POLICY IF EXISTS "Admin puede ver todos los perfiles" ON profiles;
CREATE POLICY "Admin puede ver todos los perfiles"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );
