-- =========================================================
-- Minimo privilegio para los roles expuestos por la Data API
-- =========================================================

SET search_path = public;

-- Las tablas y funciones nuevas deben declarar sus permisos de forma
-- explicita. service_role conserva los privilegios administrativos.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON FUNCTIONS FROM anon, authenticated;

-- Los visitantes solo pueden enviar una solicitud mediante la RPC publica.
REVOKE ALL ON TABLE
  public.citas,
  public.clientes_duenos,
  public.clinicas,
  public.detalle_insumos_expediente,
  public.expedientes,
  public.inventario,
  public.mascotas,
  public.solicitudes_demo,
  public.usuarios,
  public.vacunas,
  public.vw_citas_hoy
FROM anon;

REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;

-- Los usuarios autenticados reciben solo las operaciones que tambien estan
-- protegidas por sus politicas RLS. TRUNCATE nunca queda disponible.
REVOKE ALL ON TABLE
  public.citas,
  public.clientes_duenos,
  public.clinicas,
  public.detalle_insumos_expediente,
  public.expedientes,
  public.inventario,
  public.mascotas,
  public.solicitudes_demo,
  public.usuarios,
  public.vacunas,
  public.vw_citas_hoy
FROM authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.citas,
  public.clientes_duenos,
  public.detalle_insumos_expediente,
  public.expedientes,
  public.inventario,
  public.mascotas,
  public.vacunas
TO authenticated;

GRANT SELECT, UPDATE ON TABLE public.clinicas TO authenticated;
GRANT SELECT ON TABLE public.usuarios TO authenticated;
GRANT SELECT ON TABLE public.vw_citas_hoy TO authenticated;

REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated;

GRANT USAGE ON SEQUENCE
  public.citas_id_cita_seq,
  public."clientes_duenos_id_dueño_seq",
  public.detalle_insumos_expediente_id_detalle_seq,
  public.expedientes_id_expediente_seq,
  public.inventario_id_producto_seq,
  public.mascotas_id_mascota_seq,
  public.vacunas_id_vacuna_seq
TO authenticated;

-- Las funciones de trigger no forman parte de la API publica. Los triggers
-- pueden ejecutarlas aunque el rol de la sesion no tenga EXECUTE directo.
REVOKE ALL ON FUNCTION public.tg_set_clientes_duenos_clinica()
FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.tg_set_mascotas_clinica()
FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.tg_set_inventario_clinica()
FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.tg_set_mascota_child_clinica()
FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.tg_set_detalle_insumos_clinica()
FROM PUBLIC, anon, authenticated;

-- Restaurar exclusivamente las RPC que constituyen la superficie publica.
GRANT EXECUTE ON FUNCTION public.enviar_solicitud_demo(
  TEXT, TEXT, TEXT, TEXT, TEXT
) TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_auth_clinica_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_auth_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.ajustar_stock(INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_tratamiento(INT, INT, INT)
TO authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_mascota_con_dueno(
  TEXT, TEXT, TEXT, DATE, TEXT, TEXT, TEXT, TEXT, TEXT
) TO authenticated;
