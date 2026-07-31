-- 1. Helper function
CREATE OR REPLACE FUNCTION public.get_auth_clinica_id()
RETURNS INT AS $$
  SELECT id_clinica FROM public.usuarios WHERE id_usuario = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 2. Add id_clinica to all missing tables with DEFAULT
ALTER TABLE public.clientes_duenos
ADD COLUMN IF NOT EXISTS id_clinica INT DEFAULT public.get_auth_clinica_id() REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE;

ALTER TABLE public.expedientes
ADD COLUMN IF NOT EXISTS id_clinica INT DEFAULT public.get_auth_clinica_id() REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE;

ALTER TABLE public.citas
ADD COLUMN IF NOT EXISTS id_clinica INT DEFAULT public.get_auth_clinica_id() REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE;

ALTER TABLE public.vacunas
ADD COLUMN IF NOT EXISTS id_clinica INT DEFAULT public.get_auth_clinica_id() REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE;

ALTER TABLE public.detalle_insumos_expediente
ADD COLUMN IF NOT EXISTS id_clinica INT DEFAULT public.get_auth_clinica_id() REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE;

ALTER TABLE public.mascotas ALTER COLUMN id_clinica SET DEFAULT public.get_auth_clinica_id();
ALTER TABLE public.inventario ALTER COLUMN id_clinica SET DEFAULT public.get_auth_clinica_id();

-- 3. Enable RLS
ALTER TABLE public.citas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes_duenos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_insumos_expediente ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expedientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mascotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacunas ENABLE ROW LEVEL SECURITY;

-- 4. Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Permitir leer clinicas" ON public.clinicas;
DROP POLICY IF EXISTS "Aislamiento Multitenant de Detalle de Insumos" ON public.detalle_insumos_expediente;
DROP POLICY IF EXISTS "Aislamiento Multitenant de Expedientes" ON public.expedientes;
DROP POLICY IF EXISTS "Aislamiento Multitenant de Inventario" ON public.inventario;
DROP POLICY IF EXISTS "Aislamiento Multitenant de Mascotas" ON public.mascotas;
DROP POLICY IF EXISTS "Permitir insertar perfil propio" ON public.usuarios;
DROP POLICY IF EXISTS "Usuario consulta su clinica" ON public.usuarios;

-- 5. Create new SaaS policies

-- clinicas (Insert any, Select/Update/Delete own)
CREATE POLICY "Clinicas_Tenant_Policy" ON public.clinicas
FOR ALL TO authenticated USING (id_clinica = public.get_auth_clinica_id());
CREATE POLICY "Clinicas_Insert_Policy" ON public.clinicas
FOR INSERT TO authenticated WITH CHECK (true);

-- usuarios
CREATE POLICY "Usuarios_Select_Tenant_Policy" ON public.usuarios
FOR SELECT TO authenticated USING (id_clinica = public.get_auth_clinica_id());
CREATE POLICY "Usuarios_Insert_Self_Policy" ON public.usuarios
FOR INSERT TO authenticated WITH CHECK (id_usuario = auth.uid());
CREATE POLICY "Usuarios_Update_Tenant_Policy" ON public.usuarios
FOR UPDATE TO authenticated USING (id_clinica = public.get_auth_clinica_id());
CREATE POLICY "Usuarios_Delete_Tenant_Policy" ON public.usuarios
FOR DELETE TO authenticated USING (id_clinica = public.get_auth_clinica_id());

-- general tables
CREATE POLICY "Citas_Tenant_Policy" ON public.citas
FOR ALL TO authenticated USING (id_clinica = public.get_auth_clinica_id()) WITH CHECK (id_clinica = public.get_auth_clinica_id());

CREATE POLICY "ClientesDuenos_Tenant_Policy" ON public.clientes_duenos
FOR ALL TO authenticated USING (id_clinica = public.get_auth_clinica_id()) WITH CHECK (id_clinica = public.get_auth_clinica_id());

CREATE POLICY "DetalleInsumos_Tenant_Policy" ON public.detalle_insumos_expediente
FOR ALL TO authenticated USING (id_clinica = public.get_auth_clinica_id()) WITH CHECK (id_clinica = public.get_auth_clinica_id());

CREATE POLICY "Expedientes_Tenant_Policy" ON public.expedientes
FOR ALL TO authenticated USING (id_clinica = public.get_auth_clinica_id()) WITH CHECK (id_clinica = public.get_auth_clinica_id());

CREATE POLICY "Inventario_Tenant_Policy" ON public.inventario
FOR ALL TO authenticated USING (id_clinica = public.get_auth_clinica_id()) WITH CHECK (id_clinica = public.get_auth_clinica_id());

CREATE POLICY "Mascotas_Tenant_Policy" ON public.mascotas
FOR ALL TO authenticated USING (id_clinica = public.get_auth_clinica_id()) WITH CHECK (id_clinica = public.get_auth_clinica_id());

CREATE POLICY "Vacunas_Tenant_Policy" ON public.vacunas
FOR ALL TO authenticated USING (id_clinica = public.get_auth_clinica_id()) WITH CHECK (id_clinica = public.get_auth_clinica_id());
