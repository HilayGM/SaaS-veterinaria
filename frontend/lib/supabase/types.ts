// Tipos manuales — cuando tengas el proyecto Supabase activo puedes reemplazar con:
// npx supabase gen types typescript --project-id TU_PROJECT_ID > lib/supabase/types.ts

export type Database = {
  public: {
    Tables: {
      solicitudes_demo: {
        Row: {
          id: string
          nombre: string
          email: string
          telefono: string | null
          clinica: string | null
          mensaje: string | null
          created_at: string
        }
        Insert: {
          id?: string
          nombre: string
          email: string
          telefono?: string | null
          clinica?: string | null
          mensaje?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          email?: string
          telefono?: string | null
          clinica?: string | null
          mensaje?: string | null
          created_at?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          id_usuario: string
          nombre: string
          correo: string
          rol: string
          id_clinica: number | null
        }
        Insert: {
          id_usuario: string
          nombre: string
          correo: string
          rol: string
          id_clinica?: number | null
        }
        Update: {
          id_usuario?: string
          nombre?: string
          correo?: string
          rol?: string
          id_clinica?: number | null
        }
        Relationships: []
      }
      mascotas: {
        Row: {
          id_mascota: number
          nombre: string
          especie: string
          raza: string | null
          fecha_nacimiento: string | null
          id_dueño: number | null
          id_clinica: number | null
        }
        Insert: {
          id_mascota?: number
          nombre: string
          especie: string
          raza?: string | null
          fecha_nacimiento?: string | null
          id_dueño?: number | null
          id_clinica?: number | null
        }
        Update: {
          id_mascota?: number
          nombre?: string
          especie?: string
          raza?: string | null
          fecha_nacimiento?: string | null
          id_dueño?: number | null
          id_clinica?: number | null
        }
        Relationships: []
      }
      expedientes: {
        Row: {
          id_expediente: number
          id_mascota: number | null
          diagnostico: string
          tratamiento: string | null
          fecha_consulta: string
        }
        Insert: {
          id_expediente?: number
          id_mascota?: number | null
          diagnostico: string
          tratamiento?: string | null
          fecha_consulta?: string
        }
        Update: {
          id_expediente?: number
          id_mascota?: number | null
          diagnostico?: string
          tratamiento?: string | null
          fecha_consulta?: string
        }
        Relationships: []
      }
      inventario: {
        Row: {
          id_producto: number
          nombre: string
          cantidad: number
          fecha_caducidad: string | null
          id_clinica: number | null
        }
        Insert: {
          id_producto?: number
          nombre: string
          cantidad?: number
          fecha_caducidad?: string | null
          id_clinica?: number | null
        }
        Update: {
          id_producto?: number
          nombre?: string
          cantidad?: number
          fecha_caducidad?: string | null
          id_clinica?: number | null
        }
        Relationships: []
      }
      detalle_insumos_expediente: {
        Row: {
          id_detalle: number
          id_expediente: number | null
          id_producto: number | null
          cantidad_usada: number
          fecha_movimiento: string
        }
        Insert: {
          id_detalle?: number
          id_expediente?: number | null
          id_producto?: number | null
          cantidad_usada: number
          fecha_movimiento?: string
        }
        Update: {
          id_detalle?: number
          id_expediente?: number | null
          id_producto?: number | null
          cantidad_usada?: number
          fecha_movimiento?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      registrar_tratamiento: {
        Args: {
          p_id_expediente: number
          p_id_producto: number
          p_cantidad_usada: number
        }
        Returns: undefined
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
