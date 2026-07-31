BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SELECT extensions.plan(19);

INSERT INTO public.clinicas (id_clinica, nombre)
VALUES
  (910001, 'Clinica Tenant A'),
  (910002, 'Clinica Tenant B');

INSERT INTO public.usuarios (
  id_usuario,
  nombre,
  correo,
  rol,
  id_clinica
)
VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'Admin A', 'admin-a@test.local', 'Administrador', 910001),
  ('00000000-0000-0000-0000-0000000000b1', 'Admin B', 'admin-b@test.local', 'Administrador', 910002);

INSERT INTO public.clientes_duenos (
  "id_dueño",
  nombre,
  id_clinica
)
VALUES
  (920001, 'Propietario A', 910001),
  (920002, 'Propietario B', 910002);

INSERT INTO public.mascotas (
  id_mascota,
  nombre,
  especie,
  "id_dueño",
  id_clinica
)
VALUES
  (930001, 'Paciente A', 'Canino', 920001, 910001),
  (930002, 'Paciente B', 'Felino', 920002, 910002);

INSERT INTO public.inventario (
  id_producto,
  nombre,
  cantidad,
  id_clinica
)
VALUES
  (940001, 'Producto A', 10, 910001),
  (940002, 'Producto B', 20, 910002);

INSERT INTO public.citas (
  id_cita,
  id_mascota,
  fecha,
  estado,
  id_clinica
)
VALUES
  (950001, 930001, CURRENT_DATE + INTERVAL '10 hours', 'Pendiente', 910001),
  (950002, 930002, CURRENT_DATE + INTERVAL '11 hours', 'Pendiente', 910002);

SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}',
  true
);

SELECT extensions.is(
  (SELECT count(*) FROM public.inventario),
  1::bigint,
  'Tenant A solo lee su inventario'
);

SELECT extensions.is(
  (SELECT nombre FROM public.inventario LIMIT 1),
  'Producto A',
  'Tenant A no recibe productos del tenant B'
);

SELECT extensions.throws_ok(
  $$INSERT INTO public.inventario (nombre, cantidad, id_clinica)
    VALUES ('Cruce', 1, 910002)$$,
  'P0001',
  'INVENTORY_CLINIC_MISMATCH',
  'El trigger rechaza escrituras con otro tenant'
);

SELECT extensions.ok(
  NOT has_table_privilege('authenticated', 'public.usuarios', 'INSERT'),
  'Un usuario autenticado no puede crear perfiles directamente'
);

SELECT extensions.ok(
  NOT has_table_privilege('authenticated', 'public.usuarios', 'UPDATE'),
  'Un usuario autenticado no puede elevar su rol'
);

SELECT extensions.ok(
  NOT has_table_privilege('authenticated', 'public.clinicas', 'DELETE'),
  'La clinica no se puede borrar desde la Data API'
);

SELECT extensions.is(
  (SELECT count(*) FROM public.vw_citas_hoy),
  1::bigint,
  'La vista de citas de hoy respeta el tenant'
);

SELECT extensions.is(
  public.ajustar_stock(940001, 3),
  13,
  'El ajuste atomico actualiza un producto del tenant'
);

SELECT extensions.is(
  (SELECT cantidad FROM public.inventario WHERE id_producto = 940001),
  13,
  'El nuevo stock queda persistido en la transaccion'
);

SELECT extensions.throws_ok(
  $$SELECT public.ajustar_stock(940002, 1)$$,
  'P0001',
  'PRODUCT_NOT_AVAILABLE',
  'El ajuste atomico no revela ni modifica otro tenant'
);

SELECT extensions.ok(
  public.registrar_mascota_con_dueno(
    'Paciente RPC',
    'Canino',
    NULL,
    NULL,
    'Propietario RPC',
    NULL,
    NULL,
    NULL,
    NULL
  ) > 0,
  'La RPC crea propietario y mascota de forma atomica'
);

SELECT extensions.is(
  (SELECT id_clinica FROM public.mascotas WHERE nombre = 'Paciente RPC'),
  910001,
  'La mascota creada deriva el tenant del JWT'
);

SELECT extensions.is(
  (
    SELECT d.id_clinica
    FROM public.clientes_duenos AS d
    JOIN public.mascotas AS m
      ON m."id_dueño" = d."id_dueño"
    WHERE m.nombre = 'Paciente RPC'
  ),
  910001,
  'El propietario creado recibe el mismo tenant'
);

SELECT extensions.is(
  (SELECT count(*) FROM public.usuarios),
  1::bigint,
  'El administrador solo consulta usuarios de su tenant'
);

SELECT set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}',
  true
);

SELECT extensions.is(
  (SELECT count(*) FROM public.inventario),
  1::bigint,
  'Tenant B tambien recibe un unico inventario aislado'
);

SELECT extensions.is(
  (SELECT nombre FROM public.inventario LIMIT 1),
  'Producto B',
  'Tenant B no recibe datos del tenant A'
);

SELECT extensions.is(
  (SELECT count(*) FROM public.mascotas WHERE nombre = 'Paciente RPC'),
  0::bigint,
  'Tenant B no puede leer la mascota creada por tenant A'
);

SELECT extensions.ok(
  NOT has_table_privilege('anon', 'public.vw_citas_hoy', 'SELECT'),
  'La vista clinica no es publica'
);

SELECT extensions.ok(
  has_function_privilege(
    'anon',
    'public.enviar_solicitud_demo(text,text,text,text,text)',
    'EXECUTE'
  ),
  'Anon solo puede enviar demos mediante la RPC validada'
);

SELECT * FROM extensions.finish();

ROLLBACK;
