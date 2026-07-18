-- =========================================================
-- MÓDULO DE CITAS: Habilitar RLS y Vista de Citas Hoy
-- =========================================================

-- 1. Habilitar RLS
ALTER TABLE public.citas ENABLE ROW LEVEL SECURITY;

-- 2. Política de Seguridad: El veterinario solo ve citas de su clínica
CREATE POLICY "Aislamiento Multitenant de Citas"
ON public.citas
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.mascotas 
    WHERE mascotas.id_mascota = citas.id_mascota
    AND mascotas.id_clinica = (SELECT id_clinica FROM public.usuarios WHERE id_usuario = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.mascotas 
    WHERE mascotas.id_mascota = citas.id_mascota
    AND mascotas.id_clinica = (SELECT id_clinica FROM public.usuarios WHERE id_usuario = auth.uid())
  )
);

-- 3. Vista para obtener citas de hoy usando CURRENT_DATE del servidor
CREATE OR REPLACE VIEW public.vw_citas_hoy AS
SELECT 
    c.id_cita,
    c.fecha,
    c.estado,
    m.nombre AS mascota_nombre,
    d.nombre AS propietario_nombre
FROM public.citas c
JOIN public.mascotas m ON c.id_mascota = m.id_mascota
LEFT JOIN public.clientes_duenos d ON m.id_dueño = d.id_dueño
WHERE c.fecha >= CURRENT_DATE
  AND c.fecha < CURRENT_DATE + INTERVAL '1 day';
