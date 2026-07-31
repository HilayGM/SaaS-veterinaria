drop extension if exists "pg_net";

alter table "public"."citas" disable row level security;

alter table "public"."clientes_duenos" enable row level security;

alter table "public"."clinicas" enable row level security;

alter table "public"."inventario" disable row level security;

alter table "public"."mascotas" disable row level security;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.registrar_tratamiento(p_id_expediente integer, p_id_producto integer, p_cantidad_usada integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_id_clinica INT;
    v_clinica_expediente INT;
    v_stock_actual INT;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION
            USING MESSAGE = 'AUTH_REQUIRED', ERRCODE = 'P0001';
    END IF;

    IF p_cantidad_usada IS NULL OR p_cantidad_usada <= 0 THEN
        RAISE EXCEPTION
            USING MESSAGE = 'INVALID_QUANTITY', ERRCODE = 'P0001';
    END IF;

    SELECT id_clinica
    INTO v_id_clinica
    FROM public.usuarios
    WHERE id_usuario = auth.uid();

    IF v_id_clinica IS NULL THEN
        RAISE EXCEPTION
            USING MESSAGE = 'CLINIC_NOT_FOUND', ERRCODE = 'P0001';
    END IF;

    SELECT m.id_clinica
    INTO v_clinica_expediente
    FROM public.expedientes AS e
    JOIN public.mascotas AS m
        ON m.id_mascota = e.id_mascota
    WHERE e.id_expediente = p_id_expediente;

    IF v_clinica_expediente IS NULL
       OR v_clinica_expediente <> v_id_clinica THEN
        RAISE EXCEPTION
            USING MESSAGE = 'EXPEDIENT_NOT_AVAILABLE', ERRCODE = 'P0001';
    END IF;

    SELECT cantidad
    INTO v_stock_actual
    FROM public.inventario
    WHERE id_producto = p_id_producto
      AND id_clinica = v_id_clinica
    FOR UPDATE;

    IF v_stock_actual IS NULL THEN
        RAISE EXCEPTION
            USING MESSAGE = 'PRODUCT_NOT_AVAILABLE', ERRCODE = 'P0001';
    END IF;

    IF v_stock_actual < p_cantidad_usada THEN
        RAISE EXCEPTION
            USING MESSAGE = 'INSUFFICIENT_STOCK', ERRCODE = 'P0001';
    END IF;

    INSERT INTO public.detalle_insumos_expediente (
        id_expediente,
        id_producto,
        cantidad_usada
    )
    VALUES (
        p_id_expediente,
        p_id_producto,
        p_cantidad_usada
    );

    UPDATE public.inventario
    SET cantidad = cantidad - p_cantidad_usada
    WHERE id_producto = p_id_producto
      AND id_clinica = v_id_clinica;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$
;


  create policy "Permitir leer clinicas"
  on "public"."clinicas"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "Aislamiento Multitenant de Detalle de Insumos"
  on "public"."detalle_insumos_expediente"
  as permissive
  for select
  to public
using ((id_expediente IN ( SELECT e.id_expediente
   FROM (public.expedientes e
     JOIN public.mascotas m ON ((m.id_mascota = e.id_mascota)))
  WHERE (m.id_clinica = ( SELECT usuarios.id_clinica
           FROM public.usuarios
          WHERE (usuarios.id_usuario = auth.uid()))))));



  create policy "Aislamiento Multitenant de Expedientes"
  on "public"."expedientes"
  as permissive
  for select
  to public
using ((id_mascota IN ( SELECT mascotas.id_mascota
   FROM public.mascotas
  WHERE (mascotas.id_clinica = ( SELECT usuarios.id_clinica
           FROM public.usuarios
          WHERE (usuarios.id_usuario = auth.uid()))))));



  create policy "Permitir insertar perfil propio"
  on "public"."usuarios"
  as permissive
  for insert
  to authenticated
with check ((id_usuario = auth.uid()));



  create policy "Usuario consulta su clinica"
  on "public"."usuarios"
  as permissive
  for select
  to public
using ((id_usuario = auth.uid()));
