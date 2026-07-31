-- =========================================================
-- Endurecimiento final de seguridad SaaS
-- =========================================================

SET search_path = public;

-- 1. Sincronizar secuencias historicas antes de crear filas. Algunas cargas
-- manuales conservaron IDs sin avanzar sus secuencias SERIAL.
SELECT setval(
  pg_get_serial_sequence('public.clinicas', 'id_clinica'),
  COALESCE(MAX(id_clinica), 0) + 1,
  false
)
FROM public.clinicas;

SELECT setval(
  pg_get_serial_sequence('public.clientes_duenos', 'id_dueño'),
  COALESCE(MAX("id_dueño"), 0) + 1,
  false
)
FROM public.clientes_duenos;

SELECT setval(
  pg_get_serial_sequence('public.mascotas', 'id_mascota'),
  COALESCE(MAX(id_mascota), 0) + 1,
  false
)
FROM public.mascotas;

SELECT setval(
  pg_get_serial_sequence('public.inventario', 'id_producto'),
  COALESCE(MAX(id_producto), 0) + 1,
  false
)
FROM public.inventario;

SELECT setval(
  pg_get_serial_sequence('public.expedientes', 'id_expediente'),
  COALESCE(MAX(id_expediente), 0) + 1,
  false
)
FROM public.expedientes;

SELECT setval(
  pg_get_serial_sequence('public.detalle_insumos_expediente', 'id_detalle'),
  COALESCE(MAX(id_detalle), 0) + 1,
  false
)
FROM public.detalle_insumos_expediente;

SELECT setval(
  pg_get_serial_sequence('public.citas', 'id_cita'),
  COALESCE(MAX(id_cita), 0) + 1,
  false
)
FROM public.citas;

SELECT setval(
  pg_get_serial_sequence('public.vacunas', 'id_vacuna'),
  COALESCE(MAX(id_vacuna), 0) + 1,
  false
)
FROM public.vacunas;

-- 2. Reparar perfiles historicos sin tenant antes de bloquear nuevas filas.
DO $$
DECLARE
  v_usuario RECORD;
  v_id_clinica INT;
BEGIN
  FOR v_usuario IN
    SELECT id_usuario, nombre
    FROM public.usuarios
    WHERE id_clinica IS NULL
  LOOP
    INSERT INTO public.clinicas (nombre)
    VALUES ('Clinica de ' || COALESCE(NULLIF(split_part(v_usuario.nombre, ' ', 1), ''), 'Usuario'))
    RETURNING id_clinica INTO v_id_clinica;

    UPDATE public.usuarios
    SET id_clinica = v_id_clinica,
        rol = 'Administrador'
    WHERE id_usuario = v_usuario.id_usuario;
  END LOOP;
END;
$$;

-- Las restricciones NOT VALID protegen filas nuevas sin destruir datos
-- historicos que requieran una limpieza manual.
ALTER TABLE public.usuarios
  ADD CONSTRAINT usuarios_tenant_required
  CHECK (id_clinica IS NOT NULL) NOT VALID;

ALTER TABLE public.clientes_duenos
  ADD CONSTRAINT clientes_duenos_tenant_required
  CHECK (id_clinica IS NOT NULL) NOT VALID;

ALTER TABLE public.mascotas
  ADD CONSTRAINT mascotas_tenant_required
  CHECK (id_clinica IS NOT NULL) NOT VALID;

ALTER TABLE public.inventario
  ADD CONSTRAINT inventario_tenant_required
  CHECK (id_clinica IS NOT NULL) NOT VALID;

ALTER TABLE public.expedientes
  ADD CONSTRAINT expedientes_tenant_required
  CHECK (id_clinica IS NOT NULL) NOT VALID;

ALTER TABLE public.citas
  ADD CONSTRAINT citas_tenant_required
  CHECK (id_clinica IS NOT NULL) NOT VALID;

ALTER TABLE public.vacunas
  ADD CONSTRAINT vacunas_tenant_required
  CHECK (id_clinica IS NOT NULL) NOT VALID;

ALTER TABLE public.detalle_insumos_expediente
  ADD CONSTRAINT detalle_insumos_tenant_required
  CHECK (id_clinica IS NOT NULL) NOT VALID;

-- 3. Usuarios y clinicas solo se mutan desde operaciones administrativas
-- del servidor. La Data API queda limitada a las lecturas necesarias.
DROP POLICY IF EXISTS "Usuarios_Insert_Self_Policy" ON public.usuarios;
DROP POLICY IF EXISTS "Usuarios_Update_Self_Policy" ON public.usuarios;
DROP POLICY IF EXISTS "Usuarios_Update_Tenant_Policy" ON public.usuarios;
DROP POLICY IF EXISTS "Usuarios_Delete_Admin_Tenant_Policy" ON public.usuarios;
DROP POLICY IF EXISTS "Usuarios_Delete_Tenant_Policy" ON public.usuarios;

DROP POLICY IF EXISTS "Clinicas_Insert_Policy" ON public.clinicas;
DROP POLICY IF EXISTS "Clinicas_Tenant_Policy" ON public.clinicas;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE
ON public.usuarios
FROM anon, authenticated;

REVOKE INSERT, DELETE, TRUNCATE
ON public.clinicas
FROM anon, authenticated;

GRANT SELECT ON public.usuarios TO authenticated;
GRANT SELECT, UPDATE ON public.clinicas TO authenticated;

-- 4. La vista debe ejecutar con los permisos del usuario y nunca ser publica.
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

REVOKE ALL ON public.vw_citas_hoy FROM PUBLIC, anon;
GRANT SELECT ON public.vw_citas_hoy TO authenticated;

-- 5. Alta atomica de propietario y mascota. Toda la transaccion usa el
-- tenant derivado del JWT, nunca un id enviado por el navegador.
CREATE OR REPLACE FUNCTION public.registrar_mascota_con_dueno(
  p_nombre TEXT,
  p_especie TEXT,
  p_raza TEXT DEFAULT NULL,
  p_fecha_nacimiento DATE DEFAULT NULL,
  p_nombre_dueno TEXT DEFAULT NULL,
  p_medicamento TEXT DEFAULT NULL,
  p_dosis TEXT DEFAULT NULL,
  p_frecuencia TEXT DEFAULT NULL,
  p_duracion TEXT DEFAULT NULL
)
RETURNS INT
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_id_clinica INT := public.get_auth_clinica_id();
  v_id_dueno INT;
  v_id_mascota INT;
BEGIN
  IF auth.uid() IS NULL OR v_id_clinica IS NULL THEN
    RAISE EXCEPTION USING MESSAGE = 'AUTH_REQUIRED', ERRCODE = 'P0001';
  END IF;

  IF NULLIF(btrim(p_nombre), '') IS NULL
     OR NULLIF(btrim(p_especie), '') IS NULL
     OR NULLIF(btrim(p_nombre_dueno), '') IS NULL THEN
    RAISE EXCEPTION USING MESSAGE = 'INVALID_PET_DATA', ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.clientes_duenos (nombre, id_clinica)
  VALUES (btrim(p_nombre_dueno), v_id_clinica)
  RETURNING "id_dueño" INTO v_id_dueno;

  INSERT INTO public.mascotas (
    nombre,
    especie,
    raza,
    fecha_nacimiento,
    "id_dueño",
    id_clinica,
    medicamento,
    dosis,
    frecuencia,
    duracion
  )
  VALUES (
    btrim(p_nombre),
    btrim(p_especie),
    NULLIF(btrim(p_raza), ''),
    p_fecha_nacimiento,
    v_id_dueno,
    v_id_clinica,
    NULLIF(btrim(p_medicamento), ''),
    NULLIF(btrim(p_dosis), ''),
    NULLIF(btrim(p_frecuencia), ''),
    NULLIF(btrim(p_duracion), '')
  )
  RETURNING id_mascota INTO v_id_mascota;

  RETURN v_id_mascota;
END;
$$;

REVOKE ALL ON FUNCTION public.registrar_mascota_con_dueno(
  TEXT, TEXT, TEXT, DATE, TEXT, TEXT, TEXT, TEXT, TEXT
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_mascota_con_dueno(
  TEXT, TEXT, TEXT, DATE, TEXT, TEXT, TEXT, TEXT, TEXT
) TO authenticated;

-- 6. Ajuste de stock atomico. El bloqueo evita perder actualizaciones cuando
-- dos usuarios modifican el mismo producto al mismo tiempo.
CREATE OR REPLACE FUNCTION public.ajustar_stock(
  p_id_producto INT,
  p_delta INT
)
RETURNS INT
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_id_clinica INT := public.get_auth_clinica_id();
  v_cantidad_actual INT;
  v_nueva_cantidad INT;
BEGIN
  IF auth.uid() IS NULL OR v_id_clinica IS NULL THEN
    RAISE EXCEPTION USING MESSAGE = 'AUTH_REQUIRED', ERRCODE = 'P0001';
  END IF;

  IF p_id_producto IS NULL
     OR p_id_producto <= 0
     OR p_delta IS NULL
     OR p_delta = 0
     OR abs(p_delta) > 1000000 THEN
    RAISE EXCEPTION USING MESSAGE = 'INVALID_STOCK_ADJUSTMENT', ERRCODE = 'P0001';
  END IF;

  SELECT i.cantidad
  INTO v_cantidad_actual
  FROM public.inventario AS i
  WHERE i.id_producto = p_id_producto
    AND i.id_clinica = v_id_clinica
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING MESSAGE = 'PRODUCT_NOT_AVAILABLE', ERRCODE = 'P0001';
  END IF;

  v_nueva_cantidad := v_cantidad_actual + p_delta;
  IF v_nueva_cantidad < 0 THEN
    RAISE EXCEPTION USING MESSAGE = 'INSUFFICIENT_STOCK', ERRCODE = 'P0001';
  END IF;

  UPDATE public.inventario
  SET cantidad = v_nueva_cantidad
  WHERE id_producto = p_id_producto
    AND id_clinica = v_id_clinica;

  RETURN v_nueva_cantidad;
END;
$$;

REVOKE ALL ON FUNCTION public.ajustar_stock(INT, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ajustar_stock(INT, INT) TO authenticated;

-- 7. Solicitudes publicas de demo con validacion y enfriamiento por correo.
CREATE TABLE IF NOT EXISTS public.solicitudes_demo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL CHECK (char_length(nombre) BETWEEN 2 AND 120),
  email TEXT NOT NULL CHECK (char_length(email) BETWEEN 5 AND 254),
  telefono TEXT CHECK (telefono IS NULL OR char_length(telefono) <= 40),
  clinica TEXT CHECK (clinica IS NULL OR char_length(clinica) <= 160),
  mensaje TEXT CHECK (mensaje IS NULL OR char_length(mensaje) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.solicitudes_demo ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.solicitudes_demo FROM PUBLIC, anon, authenticated;

CREATE INDEX IF NOT EXISTS idx_solicitudes_demo_email_created_at
ON public.solicitudes_demo (lower(email), created_at DESC);

CREATE OR REPLACE FUNCTION public.enviar_solicitud_demo(
  p_nombre TEXT,
  p_email TEXT,
  p_telefono TEXT DEFAULT NULL,
  p_clinica TEXT DEFAULT NULL,
  p_mensaje TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_email TEXT := lower(btrim(p_email));
BEGIN
  IF NULLIF(btrim(p_nombre), '') IS NULL
     OR v_email IS NULL
     OR v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
    RAISE EXCEPTION USING MESSAGE = 'INVALID_DEMO_DATA', ERRCODE = 'P0001';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.solicitudes_demo
    WHERE lower(email) = v_email
      AND created_at > NOW() - INTERVAL '10 minutes'
  ) THEN
    RAISE EXCEPTION USING MESSAGE = 'DEMO_RATE_LIMITED', ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.solicitudes_demo (
    nombre,
    email,
    telefono,
    clinica,
    mensaje
  )
  VALUES (
    left(btrim(p_nombre), 120),
    left(v_email, 254),
    NULLIF(left(btrim(p_telefono), 40), ''),
    NULLIF(left(btrim(p_clinica), 160), ''),
    NULLIF(left(btrim(p_mensaje), 2000), '')
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.enviar_solicitud_demo(
  TEXT, TEXT, TEXT, TEXT, TEXT
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enviar_solicitud_demo(
  TEXT, TEXT, TEXT, TEXT, TEXT
) TO anon, authenticated;

-- 8. Funciones internas: minimo privilegio y sin ruido en produccion.
CREATE OR REPLACE FUNCTION public.rls_auto_enable()
RETURNS event_trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  cmd RECORD;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table', 'partitioned table')
  LOOP
    IF cmd.schema_name = 'public' THEN
      BEGIN
        EXECUTE format(
          'ALTER TABLE IF EXISTS %s ENABLE ROW LEVEL SECURITY',
          cmd.object_identity
        );
      EXCEPTION
        WHEN OTHERS THEN
          NULL;
      END;
    END IF;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.registrar_tratamiento(INT, INT, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_tratamiento(INT, INT, INT) TO authenticated;

REVOKE ALL ON FUNCTION public.get_auth_clinica_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_auth_user_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_auth_clinica_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_auth_user_role() TO authenticated;
