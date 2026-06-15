--- este es el esquema completo de la base de datos

-- Habilitar RLS en las tablas
ALTER TABLE public.inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mascotas ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS PARA INVENTARIO
CREATE POLICY "Permitir lectura de inventario por clínica"
ON public.inventario FOR SELECT
USING (id_clinica = (SELECT id_clinica FROM public.usuarios WHERE id_usuario = auth.uid()));

CREATE POLICY "Permitir modificaciones de inventario por clínica"
ON public.inventario FOR ALL
USING (id_clinica = (SELECT id_clinica FROM public.usuarios WHERE id_usuario = auth.uid()))
WITH CHECK (id_clinica = (SELECT id_clinica FROM public.usuarios WHERE id_usuario = auth.uid()));

-- POLÍTICAS PARA MASCOTAS
CREATE POLICY "Permitir lectura de mascotas por clínica"
ON public.mascotas FOR SELECT
USING (id_clinica = (SELECT id_clinica FROM public.usuarios WHERE id_usuario = auth.uid()));

CREATE POLICY "Permitir modificaciones de mascotas por clínica"
ON public.mascotas FOR ALL
USING (id_clinica = (SELECT id_clinica FROM public.usuarios WHERE id_usuario = auth.uid()))
WITH CHECK (id_clinica = (SELECT id_clinica FROM public.usuarios WHERE id_usuario = auth.uid()));

-- 1. TABLA CLÍNICAS
CREATE TABLE public.clinicas (
    id_clinica SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    direccion VARCHAR(255),
    telefono VARCHAR(50)
);

-- 2. TABLA USUARIOS (Vinculada a Supabase Auth)
CREATE TABLE public.usuarios (
    id_usuario UUID PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    correo VARCHAR(255) UNIQUE NOT NULL,
    rol VARCHAR(50) NOT NULL CHECK (rol IN ('Administrador', 'Veterinario', 'Recepcionista')),
    id_clinica INT REFERENCES public.clinicas(id_clinica) ON DELETE SET NULL
);

-- 3. TABLA CLIENTES_DUEÑOS
CREATE TABLE public.clientes_duenos (
    id_dueño SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    telefono VARCHAR(50),
    correo VARCHAR(255)
);

-- 4. TABLA MASCOTAS
CREATE TABLE public.mascotas (
    id_mascota SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    especie VARCHAR(100) NOT NULL,
    raza VARCHAR(100),
    fecha_nacimiento DATE,
    id_dueño INT REFERENCES public.clientes_duenos(id_dueño) ON DELETE CASCADE,
    id_clinica INT REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE
);

-- 5. TABLA INVENTARIO (Con restricción CHECK para evitar stock negativo)
CREATE TABLE public.inventario (
    id_producto SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    cantidad INT NOT NULL DEFAULT 0 CONSTRAINT chk_cantidad_no_negativa CHECK (cantidad >= 0),
    fecha_caducidad DATE,
    id_clinica INT REFERENCES public.clinicas(id_clinica) ON DELETE CASCADE
);

-- 6. TABLA EXPEDIENTES
CREATE TABLE public.expedientes (
    id_expediente SERIAL PRIMARY KEY,
    id_mascota INT REFERENCES public.mascotas(id_mascota) ON DELETE CASCADE,
    diagnostico TEXT NOT NULL,
    tratamiento TEXT,
    fecha_consulta DATE NOT NULL DEFAULT CURRENT_DATE
);

-- 7. TABLA DETALLE_INSUMOS_EXPEDIENTE (Historial de uso de inventario)
CREATE TABLE public.detalle_insumos_expediente (
    id_detalle SERIAL PRIMARY KEY,
    id_expediente INT REFERENCES public.expedientes(id_expediente) ON DELETE CASCADE,
    id_producto INT REFERENCES public.inventario(id_producto) ON DELETE CASCADE,
    cantidad_usada INT NOT NULL CHECK (cantidad_usada > 0),
    fecha_movimiento TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 8. TABLA CITAS
CREATE TABLE public.citas (
    id_cita SERIAL PRIMARY KEY,
    id_mascota INT REFERENCES public.mascotas(id_mascota) ON DELETE CASCADE,
    fecha TIMESTAMP WITH TIME ZONE NOT NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'Completada', 'Cancelada'))
);

-- 9. TABLA VACUNAS
CREATE TABLE public.vacunas (
    id_vacuna SERIAL PRIMARY KEY,
    id_mascota INT REFERENCES public.mascotas(id_mascota) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    fecha_aplicacion DATE NOT NULL DEFAULT CURRENT_DATE,
    proxima_aplicacion DATE
);

-- =========================================================
-- CONFIGURACIÓN DE SEGURIDAD MULTITENANT (POLÍTICAS RLS)
-- =========================================================

-- Como activaste RLS automático, las tablas ya lo tienen encendido. 
-- Ahora creamos las políticas de aislamiento por clínica.

CREATE POLICY "Aislamiento Multitenant de Inventario"
ON public.inventario
FOR ALL
USING (
    id_clinica = (SELECT id_clinica FROM public.usuarios WHERE id_usuario = auth.uid())
);

CREATE POLICY "Aislamiento Multitenant de Mascotas"
ON public.mascotas
FOR ALL
USING (
    id_clinica = (SELECT id_clinica FROM public.usuarios WHERE id_usuario = auth.uid())
);



