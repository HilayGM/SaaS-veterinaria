-- =========================================================
-- Refuerzo de aislamiento multitenant
-- =========================================================
-- Esta migracion no cambia el contrato del frontend: las acciones pueden
-- seguir enviando id_clinica solo en mascotas/inventario, y la base deriva el
-- tenant de las relaciones para citas, vacunas, expedientes y tratamientos.

SET search_path = public;

-- 1. Helpers de tenant/rol usados por RLS y triggers
CREATE OR REPLACE FUNCTION public.get_auth_clinica_id()
RETURNS INT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id_clinica
  FROM public.usuarios AS u
  WHERE u.id_usuario = auth.uid()
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.rol
  FROM public.usuarios AS u
  WHERE u.id_usuario = auth.uid()
  LIMIT 1
$$;

-- 2. Backfill de id_clinica desde las relaciones canonicas
UPDATE public.clientes_duenos AS d
SET id_clinica = src.id_clinica
FROM (
  SELECT m."id_dueño", MIN(m.id_clinica) AS id_clinica
  FROM public.mascotas AS m
  WHERE m."id_dueño" IS NOT NULL
    AND m.id_clinica IS NOT NULL
  GROUP BY m."id_dueño"
  HAVING COUNT(DISTINCT m.id_clinica) = 1
) AS src
WHERE d."id_dueño" = src."id_dueño"
  AND d.id_clinica IS NULL;

UPDATE public.expedientes AS e
SET id_clinica = m.id_clinica
FROM public.mascotas AS m
WHERE e.id_mascota = m.id_mascota
  AND e.id_clinica IS NULL;

UPDATE public.citas AS c
SET id_clinica = m.id_clinica
FROM public.mascotas AS m
WHERE c.id_mascota = m.id_mascota
  AND c.id_clinica IS NULL;

UPDATE public.vacunas AS v
SET id_clinica = m.id_clinica
FROM public.mascotas AS m
WHERE v.id_mascota = m.id_mascota
  AND v.id_clinica IS NULL;

UPDATE public.detalle_insumos_expediente AS d
SET id_clinica = e.id_clinica
FROM public.expedientes AS e
WHERE d.id_expediente = e.id_expediente
  AND d.id_clinica IS NULL;

-- 3. Funciones trigger para derivar y validar el tenant
CREATE OR REPLACE FUNCTION public.tg_set_clientes_duenos_clinica()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_clinica INT := public.get_auth_clinica_id();
BEGIN
  IF NEW.id_clinica IS NULL AND v_auth_clinica IS NOT NULL THEN
    NEW.id_clinica := v_auth_clinica;
  END IF;

  IF v_auth_clinica IS NOT NULL
     AND NEW.id_clinica IS DISTINCT FROM v_auth_clinica THEN
    RAISE EXCEPTION USING MESSAGE = 'OWNER_CLINIC_MISMATCH', ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_set_mascotas_clinica()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_clinica INT := public.get_auth_clinica_id();
  v_dueno_clinica INT;
BEGIN
  IF NEW.id_clinica IS NULL THEN
    NEW.id_clinica := v_auth_clinica;
  END IF;

  IF NEW."id_dueño" IS NOT NULL THEN
    SELECT d.id_clinica
    INTO v_dueno_clinica
    FROM public.clientes_duenos AS d
    WHERE d."id_dueño" = NEW."id_dueño";

    IF NOT FOUND THEN
      RAISE EXCEPTION USING MESSAGE = 'OWNER_NOT_FOUND', ERRCODE = 'P0001';
    END IF;

    IF NEW.id_clinica IS NULL THEN
      NEW.id_clinica := v_dueno_clinica;
    ELSIF v_dueno_clinica IS NULL THEN
      UPDATE public.clientes_duenos
      SET id_clinica = NEW.id_clinica
      WHERE "id_dueño" = NEW."id_dueño";
    ELSIF v_dueno_clinica IS DISTINCT FROM NEW.id_clinica THEN
      RAISE EXCEPTION USING MESSAGE = 'PET_OWNER_CLINIC_MISMATCH', ERRCODE = 'P0001';
    END IF;
  END IF;

  IF NEW.id_clinica IS NULL THEN
    RAISE EXCEPTION USING MESSAGE = 'CLINIC_REQUIRED', ERRCODE = 'P0001';
  END IF;

  IF v_auth_clinica IS NOT NULL
     AND NEW.id_clinica IS DISTINCT FROM v_auth_clinica THEN
    RAISE EXCEPTION USING MESSAGE = 'PET_CLINIC_MISMATCH', ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_set_inventario_clinica()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_clinica INT := public.get_auth_clinica_id();
BEGIN
  IF NEW.id_clinica IS NULL THEN
    NEW.id_clinica := v_auth_clinica;
  END IF;

  IF NEW.id_clinica IS NULL THEN
    RAISE EXCEPTION USING MESSAGE = 'CLINIC_REQUIRED', ERRCODE = 'P0001';
  END IF;

  IF v_auth_clinica IS NOT NULL
     AND NEW.id_clinica IS DISTINCT FROM v_auth_clinica THEN
    RAISE EXCEPTION USING MESSAGE = 'INVENTORY_CLINIC_MISMATCH', ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_set_mascota_child_clinica()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_clinica INT := public.get_auth_clinica_id();
  v_mascota_clinica INT;
BEGIN
  IF NEW.id_mascota IS NULL THEN
    RAISE EXCEPTION USING MESSAGE = 'PET_REQUIRED', ERRCODE = 'P0001';
  END IF;

  SELECT m.id_clinica
  INTO v_mascota_clinica
  FROM public.mascotas AS m
  WHERE m.id_mascota = NEW.id_mascota;

  IF v_mascota_clinica IS NULL THEN
    RAISE EXCEPTION USING MESSAGE = 'PET_NOT_AVAILABLE', ERRCODE = 'P0001';
  END IF;

  IF NEW.id_clinica IS NULL THEN
    NEW.id_clinica := v_mascota_clinica;
  ELSIF NEW.id_clinica IS DISTINCT FROM v_mascota_clinica THEN
    RAISE EXCEPTION USING MESSAGE = 'PET_CHILD_CLINIC_MISMATCH', ERRCODE = 'P0001';
  END IF;

  IF v_auth_clinica IS NOT NULL
     AND v_mascota_clinica IS DISTINCT FROM v_auth_clinica THEN
    RAISE EXCEPTION USING MESSAGE = 'PET_NOT_IN_AUTH_CLINIC', ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_set_detalle_insumos_clinica()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_clinica INT := public.get_auth_clinica_id();
  v_expediente_clinica INT;
  v_producto_clinica INT;
BEGIN
  IF NEW.id_expediente IS NULL THEN
    RAISE EXCEPTION USING MESSAGE = 'EXPEDIENT_REQUIRED', ERRCODE = 'P0001';
  END IF;

  IF NEW.id_producto IS NULL THEN
    RAISE EXCEPTION USING MESSAGE = 'PRODUCT_REQUIRED', ERRCODE = 'P0001';
  END IF;

  SELECT e.id_clinica
  INTO v_expediente_clinica
  FROM public.expedientes AS e
  WHERE e.id_expediente = NEW.id_expediente;

  SELECT i.id_clinica
  INTO v_producto_clinica
  FROM public.inventario AS i
  WHERE i.id_producto = NEW.id_producto;

  IF v_expediente_clinica IS NULL THEN
    RAISE EXCEPTION USING MESSAGE = 'EXPEDIENT_NOT_AVAILABLE', ERRCODE = 'P0001';
  END IF;

  IF v_producto_clinica IS NULL THEN
    RAISE EXCEPTION USING MESSAGE = 'PRODUCT_NOT_AVAILABLE', ERRCODE = 'P0001';
  END IF;

  IF v_expediente_clinica IS DISTINCT FROM v_producto_clinica THEN
    RAISE EXCEPTION USING MESSAGE = 'EXPEDIENT_PRODUCT_CLINIC_MISMATCH', ERRCODE = 'P0001';
  END IF;

  IF NEW.id_clinica IS NULL THEN
    NEW.id_clinica := v_expediente_clinica;
  ELSIF NEW.id_clinica IS DISTINCT FROM v_expediente_clinica THEN
    RAISE EXCEPTION USING MESSAGE = 'DETAIL_CLINIC_MISMATCH', ERRCODE = 'P0001';
  END IF;

  IF v_auth_clinica IS NOT NULL
     AND v_expediente_clinica IS DISTINCT FROM v_auth_clinica THEN
    RAISE EXCEPTION USING MESSAGE = 'DETAIL_NOT_IN_AUTH_CLINIC', ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

-- 4. Activar triggers
DROP TRIGGER IF EXISTS set_clientes_duenos_clinica ON public.clientes_duenos;
CREATE TRIGGER set_clientes_duenos_clinica
BEFORE INSERT OR UPDATE OF id_clinica ON public.clientes_duenos
FOR EACH ROW EXECUTE FUNCTION public.tg_set_clientes_duenos_clinica();

DROP TRIGGER IF EXISTS set_mascotas_clinica ON public.mascotas;
CREATE TRIGGER set_mascotas_clinica
BEFORE INSERT OR UPDATE OF id_dueño, id_clinica ON public.mascotas
FOR EACH ROW EXECUTE FUNCTION public.tg_set_mascotas_clinica();

DROP TRIGGER IF EXISTS set_inventario_clinica ON public.inventario;
CREATE TRIGGER set_inventario_clinica
BEFORE INSERT OR UPDATE OF id_clinica ON public.inventario
FOR EACH ROW EXECUTE FUNCTION public.tg_set_inventario_clinica();

DROP TRIGGER IF EXISTS set_expedientes_clinica ON public.expedientes;
CREATE TRIGGER set_expedientes_clinica
BEFORE INSERT OR UPDATE OF id_mascota, id_clinica ON public.expedientes
FOR EACH ROW EXECUTE FUNCTION public.tg_set_mascota_child_clinica();

DROP TRIGGER IF EXISTS set_citas_clinica ON public.citas;
CREATE TRIGGER set_citas_clinica
BEFORE INSERT OR UPDATE OF id_mascota, id_clinica ON public.citas
FOR EACH ROW EXECUTE FUNCTION public.tg_set_mascota_child_clinica();

DROP TRIGGER IF EXISTS set_vacunas_clinica ON public.vacunas;
CREATE TRIGGER set_vacunas_clinica
BEFORE INSERT OR UPDATE OF id_mascota, id_clinica ON public.vacunas
FOR EACH ROW EXECUTE FUNCTION public.tg_set_mascota_child_clinica();

DROP TRIGGER IF EXISTS set_detalle_insumos_clinica ON public.detalle_insumos_expediente;
CREATE TRIGGER set_detalle_insumos_clinica
BEFORE INSERT OR UPDATE OF id_expediente, id_producto, id_clinica ON public.detalle_insumos_expediente
FOR EACH ROW EXECUTE FUNCTION public.tg_set_detalle_insumos_clinica();

-- 5. RLS: limpiar duplicados y dejar politicas consistentes por tenant
ALTER TABLE public.citas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes_duenos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_insumos_expediente ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expedientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mascotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacunas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Aislamiento Multitenant de Citas" ON public.citas;
DROP POLICY IF EXISTS "Citas_Tenant_Policy" ON public.citas;
DROP POLICY IF EXISTS "ClientesDuenos_Tenant_Policy" ON public.clientes_duenos;
DROP POLICY IF EXISTS "Clinicas_Insert_Policy" ON public.clinicas;
DROP POLICY IF EXISTS "Clinicas_Tenant_Policy" ON public.clinicas;
DROP POLICY IF EXISTS "DetalleInsumos_Tenant_Policy" ON public.detalle_insumos_expediente;
DROP POLICY IF EXISTS "Expedientes_Tenant_Policy" ON public.expedientes;
DROP POLICY IF EXISTS "Inventario_Tenant_Policy" ON public.inventario;
DROP POLICY IF EXISTS "Mascotas_Tenant_Policy" ON public.mascotas;
DROP POLICY IF EXISTS "Usuarios_Delete_Tenant_Policy" ON public.usuarios;
DROP POLICY IF EXISTS "Usuarios_Insert_Self_Policy" ON public.usuarios;
DROP POLICY IF EXISTS "Usuarios_Select_Tenant_Policy" ON public.usuarios;
DROP POLICY IF EXISTS "Usuarios_Update_Tenant_Policy" ON public.usuarios;
DROP POLICY IF EXISTS "Vacunas_Tenant_Policy" ON public.vacunas;

CREATE POLICY "Clinicas_Select_Tenant_Policy" ON public.clinicas
FOR SELECT TO authenticated
USING (id_clinica = public.get_auth_clinica_id());

CREATE POLICY "Clinicas_Update_Tenant_Policy" ON public.clinicas
FOR UPDATE TO authenticated
USING (
  id_clinica = public.get_auth_clinica_id()
  AND public.get_auth_user_role() = 'Administrador'
)
WITH CHECK (
  id_clinica = public.get_auth_clinica_id()
  AND public.get_auth_user_role() = 'Administrador'
);

CREATE POLICY "Usuarios_Select_Tenant_Policy" ON public.usuarios
FOR SELECT TO authenticated
USING (
  id_usuario = auth.uid()
  OR (
    id_clinica = public.get_auth_clinica_id()
    AND public.get_auth_user_role() = 'Administrador'
  )
);

CREATE POLICY "ClientesDuenos_Tenant_Policy" ON public.clientes_duenos
FOR ALL TO authenticated
USING (id_clinica = public.get_auth_clinica_id())
WITH CHECK (id_clinica = public.get_auth_clinica_id());

CREATE POLICY "Mascotas_Tenant_Policy" ON public.mascotas
FOR ALL TO authenticated
USING (id_clinica = public.get_auth_clinica_id())
WITH CHECK (id_clinica = public.get_auth_clinica_id());

CREATE POLICY "Inventario_Tenant_Policy" ON public.inventario
FOR ALL TO authenticated
USING (id_clinica = public.get_auth_clinica_id())
WITH CHECK (id_clinica = public.get_auth_clinica_id());

CREATE POLICY "Expedientes_Select_Tenant_Policy" ON public.expedientes
FOR SELECT TO authenticated
USING (id_clinica = public.get_auth_clinica_id());

CREATE POLICY "Expedientes_Insert_Tenant_Policy" ON public.expedientes
FOR INSERT TO authenticated
WITH CHECK (id_clinica = public.get_auth_clinica_id());

CREATE POLICY "Expedientes_Update_Tenant_Policy" ON public.expedientes
FOR UPDATE TO authenticated
USING (id_clinica = public.get_auth_clinica_id())
WITH CHECK (id_clinica = public.get_auth_clinica_id());

CREATE POLICY "Expedientes_Delete_Admin_Tenant_Policy" ON public.expedientes
FOR DELETE TO authenticated
USING (
  id_clinica = public.get_auth_clinica_id()
  AND public.get_auth_user_role() = 'Administrador'
);

CREATE POLICY "Citas_Select_Tenant_Policy" ON public.citas
FOR SELECT TO authenticated
USING (id_clinica = public.get_auth_clinica_id());

CREATE POLICY "Citas_Insert_Tenant_Policy" ON public.citas
FOR INSERT TO authenticated
WITH CHECK (id_clinica = public.get_auth_clinica_id());

CREATE POLICY "Citas_Update_Vet_Admin_Tenant_Policy" ON public.citas
FOR UPDATE TO authenticated
USING (
  id_clinica = public.get_auth_clinica_id()
  AND public.get_auth_user_role() IN ('Administrador', 'Veterinario')
)
WITH CHECK (
  id_clinica = public.get_auth_clinica_id()
  AND public.get_auth_user_role() IN ('Administrador', 'Veterinario')
);

CREATE POLICY "Citas_Delete_Admin_Tenant_Policy" ON public.citas
FOR DELETE TO authenticated
USING (
  id_clinica = public.get_auth_clinica_id()
  AND public.get_auth_user_role() = 'Administrador'
);

CREATE POLICY "Vacunas_Tenant_Policy" ON public.vacunas
FOR ALL TO authenticated
USING (id_clinica = public.get_auth_clinica_id())
WITH CHECK (id_clinica = public.get_auth_clinica_id());

CREATE POLICY "DetalleInsumos_Tenant_Policy" ON public.detalle_insumos_expediente
FOR ALL TO authenticated
USING (id_clinica = public.get_auth_clinica_id())
WITH CHECK (id_clinica = public.get_auth_clinica_id());

-- 6. Indices para que RLS y joins de tenant no degraden con datos reales
CREATE INDEX IF NOT EXISTS idx_usuarios_id_usuario_clinica
ON public.usuarios (id_usuario, id_clinica);

CREATE INDEX IF NOT EXISTS idx_clientes_duenos_clinica
ON public.clientes_duenos (id_clinica);

CREATE INDEX IF NOT EXISTS idx_mascotas_clinica
ON public.mascotas (id_clinica);

CREATE INDEX IF NOT EXISTS idx_mascotas_dueno_clinica
ON public.mascotas ("id_dueño", id_clinica);

CREATE INDEX IF NOT EXISTS idx_inventario_clinica
ON public.inventario (id_clinica);

CREATE INDEX IF NOT EXISTS idx_expedientes_mascota_clinica
ON public.expedientes (id_mascota, id_clinica);

CREATE INDEX IF NOT EXISTS idx_citas_mascota_clinica
ON public.citas (id_mascota, id_clinica);

CREATE INDEX IF NOT EXISTS idx_vacunas_mascota_clinica
ON public.vacunas (id_mascota, id_clinica);

CREATE INDEX IF NOT EXISTS idx_detalle_insumos_expediente_clinica
ON public.detalle_insumos_expediente (id_expediente, id_producto, id_clinica);

-- 7. Vista filtrada por tenant para evitar que sea un bypass accidental.
-- En Postgres 15+ security_invoker hace que la vista respete RLS del usuario.
CREATE OR REPLACE VIEW public.vw_citas_hoy
WITH (security_invoker = true)
AS
SELECT
  c.id_cita,
  c.fecha,
  c.estado,
  m.nombre AS mascota_nombre,
  d.nombre AS propietario_nombre
FROM public.citas AS c
JOIN public.mascotas AS m
  ON c.id_mascota = m.id_mascota
LEFT JOIN public.clientes_duenos AS d
  ON m."id_dueño" = d."id_dueño"
WHERE c.id_clinica = public.get_auth_clinica_id()
  AND c.fecha >= CURRENT_DATE
  AND c.fecha < CURRENT_DATE + INTERVAL '1 day';

-- 8. Funcion de tratamiento alineada al tenant derivado
CREATE OR REPLACE FUNCTION public.registrar_tratamiento(
  p_id_expediente integer,
  p_id_producto integer,
  p_cantidad_usada integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id_clinica INT;
  v_clinica_expediente INT;
  v_stock_actual INT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION USING MESSAGE = 'AUTH_REQUIRED', ERRCODE = 'P0001';
  END IF;

  IF p_cantidad_usada IS NULL OR p_cantidad_usada <= 0 THEN
    RAISE EXCEPTION USING MESSAGE = 'INVALID_QUANTITY', ERRCODE = 'P0001';
  END IF;

  SELECT public.get_auth_clinica_id()
  INTO v_id_clinica;

  IF v_id_clinica IS NULL THEN
    RAISE EXCEPTION USING MESSAGE = 'CLINIC_NOT_FOUND', ERRCODE = 'P0001';
  END IF;

  SELECT e.id_clinica
  INTO v_clinica_expediente
  FROM public.expedientes AS e
  WHERE e.id_expediente = p_id_expediente;

  IF v_clinica_expediente IS NULL
     OR v_clinica_expediente <> v_id_clinica THEN
    RAISE EXCEPTION USING MESSAGE = 'EXPEDIENT_NOT_AVAILABLE', ERRCODE = 'P0001';
  END IF;

  SELECT i.cantidad
  INTO v_stock_actual
  FROM public.inventario AS i
  WHERE i.id_producto = p_id_producto
    AND i.id_clinica = v_id_clinica
  FOR UPDATE;

  IF v_stock_actual IS NULL THEN
    RAISE EXCEPTION USING MESSAGE = 'PRODUCT_NOT_AVAILABLE', ERRCODE = 'P0001';
  END IF;

  IF v_stock_actual < p_cantidad_usada THEN
    RAISE EXCEPTION USING MESSAGE = 'INSUFFICIENT_STOCK', ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.detalle_insumos_expediente (
    id_expediente,
    id_producto,
    cantidad_usada,
    id_clinica
  )
  VALUES (
    p_id_expediente,
    p_id_producto,
    p_cantidad_usada,
    v_id_clinica
  );

  UPDATE public.inventario
  SET cantidad = cantidad - p_cantidad_usada
  WHERE id_producto = p_id_producto
    AND id_clinica = v_id_clinica;
END;
$$;
