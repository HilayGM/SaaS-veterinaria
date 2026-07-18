# Reglas y Contexto del Proyecto: SaaS Veterinaria

## 1. Stack Tecnológico
- **Frontend Framework:** Next.js (App Router)
- **Lenguaje:** TypeScript
- **Estilos:** CSS puro enfocado en clases nativas / Tailwind CSS v4 (dependiendo del módulo). Tipografía global **Poppins**, JetBrains Mono (para datos/horas).
- **Backend / BaaS:** Supabase (Auth, Base de Datos PostgreSQL, RLS, Storage)
- **Iconografía:** Lucide React / FontAwesome

## 2. Arquitectura de Datos y Auth
- **Autenticación:** Supabase Auth (Server-side & Client-side).
- **Control de Acceso Basado en Roles (RBAC):** Roles principales: `Administrador`, `Veterinario`, `Recepcionista`. Validaciones de acceso tanto a nivel de UI como en las Server Actions.
- **Row Level Security (RLS):** Activado en Supabase para asegurar que cada clínica o veterinario solo vea los datos correspondientes a su `id_clinica` o permisos.

## 3. Módulos Principales
- **/citas:** Gestión de citas diarias. Estados permitidos: `Pendiente`, `Completada`, `Cancelada`. Flujo unidireccional.
- **/mascotas:** Registro de pacientes y propietarios, historial clínico y seguimiento médico.
- **/inventario:** Control de stock y productos veterinarios.
- **Server Actions:** Toda la lógica de mutación y lectura profunda de DB debe estar en `app/actions/`.

## 4. Estética y Diseño (Aesthetics)
- **Clean & Minimalist Dashboard:** Diseños muy limpios, evitando bordes gruesos. Uso de sombras suaves (`box-shadow: 0 4px 20px rgba(0,0,0,0.03)`).
- **Paleta de Colores:** 
  - Brand Cyan/Turquesa: `#19BCD9` o `#22D3EE` (acento principal histórico).
  - Brand Indigo/Blue: `#5542F6` o `#4F46E5` (botones primarios modernos).
  - Texto Principal: `#0f172a` (slate-900)
  - Subtítulos: `#64748b` o `#94a3b8`
  - Badges: Verde (`#dcfce7`/`#059669`), Azul (`#e0e7ff`/`#4338ca`), Amarillo (`#fef3c7`/`#d97706`), Rojo (`#fee2e2`/`#dc2626`).
- **Interacciones:** Efectos hover suaves (`transition: all 0.2s ease`), animaciones de entrada fluidas (`fadeInUp`).

## 5. Mejores Prácticas de Desarrollo
- Separar Server Components y Client Components adecuadamente (usar `'use client'` solo en las hojas de la UI interactiva).
- Proteger todas las transacciones de Supabase con validación de roles de usuario desde el lado del servidor.
- Nunca usar variables de estado inline muy pesadas, migrar a clases en hojas de `<style>` dentro del componente o archivos CSS modulares para mayor rendimiento de renderizado.
- Al escribir nuevos componentes, respetar el Shell del Dashboard (`<DashboardShell>`) para la estructura unificada.
