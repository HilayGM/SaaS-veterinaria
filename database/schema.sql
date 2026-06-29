-- =========================================================
-- PetCare Intelligence — Esquema de Base de Datos (Supabase / PostgreSQL)
-- Tech Lead: Tablas + Seguridad Multitenant (RLS)
-- =========================================================

-- =========================================================
-- 1. CREACIÓN DE TABLAS (De lo independiente a lo dependiente)
-- =========================================================

CREATE TABLE public.clinicas (
    id_clinica SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    direccion VARCHAR(255),
    telefono VARCHAR(50)
);

CREATE TABLE public.usuarios (
    id_usuario UUID PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    correo VARCHAR(255) UNIQUE NOT NULL,
    rol VARCHAR(50) NOT NULL CHECK (rol IN ('Administrador', 'Veterinario', 'Recepcionista')),
    id_clinica INT REFERENCES public.clinicas(id_clinica) ON DELETE SET NULL
);

CREATE TABLE public.clientes_duenos (
    id_dueño SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    telefono VARCHAR(50),
    correo VARCHAR(255)
);

CREATE TABLE public.mascotas (
    id_mascota SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    especie VARCHAR(100) NOT NULL,
    raza VARCHAR(100),
    fecha_nacimiento DATE,
    id_dueño INT REFERENCES public.clientes_duenos(id_dueño) ON DELETE CASCADE,
    id_clinica INT REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE,
    medicamento TEXT,
    dosis TEXT,
    frecuencia TEXT,
    duracion TEXT
);

CREATE TABLE public.inventario (
    id_producto SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    cantidad INT NOT NULL DEFAULT 0 CONSTRAINT chk_cantidad_no_negativa CHECK (cantidad >= 0),
    fecha_caducidad DATE,
    id_clinica INT REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE
);

CREATE TABLE public.expedientes (
    id_expediente SERIAL PRIMARY KEY,
    id_mascota INT REFERENCES public.mascotas(id_mascota) ON DELETE CASCADE,
    diagnostico TEXT NOT NULL,
    tratamiento TEXT,
    fecha_consulta DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE public.detalle_insumos_expediente (
    id_detalle SERIAL PRIMARY KEY,
    id_expediente INT REFERENCES public.expedientes(id_expediente) ON DELETE CASCADE,
    id_producto INT REFERENCES public.inventario(id_producto) ON DELETE CASCADE,
    cantidad_usada INT NOT NULL CHECK (cantidad_usada > 0),
    fecha_movimiento TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE public.citas (
    id_cita SERIAL PRIMARY KEY,
    id_mascota INT REFERENCES public.mascotas(id_mascota) ON DELETE CASCADE,
    fecha TIMESTAMP WITH TIME ZONE NOT NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'Completada', 'Cancelada'))
);

CREATE TABLE public.vacunas (
    id_vacuna SERIAL PRIMARY KEY,
    id_mascota INT REFERENCES public.mascotas(id_mascota) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    fecha_aplicacion DATE NOT NULL DEFAULT CURRENT_DATE,
    proxima_aplicacion DATE
);

-- =========================================================
-- 2. ACTIVACIÓN EXPLÍCITA DE RLS (Buenas Prácticas)
-- =========================================================
ALTER TABLE public.inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mascotas ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- 3. POLÍTICAS DE SEGURIDAD (Se ejecutan al final)
-- =========================================================

-- Usar una sola política FOR ALL con USING y WITH CHECK es más limpio y óptimo
CREATE POLICY "Aislamiento Multitenant de Inventario"
ON public.inventario
FOR ALL
USING (id_clinica = (SELECT id_clinica FROM public.usuarios WHERE id_usuario = auth.uid()))
WITH CHECK (id_clinica = (SELECT id_clinica FROM public.usuarios WHERE id_usuario = auth.uid()));

CREATE POLICY "Aislamiento Multitenant de Mascotas"
ON public.mascotas
FOR ALL
USING (id_clinica = (SELECT id_clinica FROM public.usuarios WHERE id_usuario = auth.uid()))
WITH CHECK (id_clinica = (SELECT id_clinica FROM public.usuarios WHERE id_usuario = auth.uid()));

-- =========================================================
-- NOTA (pendiente, fuera del alcance del MVP de inventario):
-- La landing page (app/actions/demo.ts) usa una tabla `solicitudes_demo`
-- que aún no existe en este script. Si se quiere mantener el formulario
-- de "solicitar demo" funcionando, falta crear esa tabla por separado.
-- =========================================================
