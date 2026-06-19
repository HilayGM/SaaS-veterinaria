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
      clinicas: {
        Row: {
          id_clinica: number
          nombre: string
          direccion: string | null
          telefono: string | null
        }
        Insert: {
          id_clinica?: number
          nombre: string
          direccion?: string | null
          telefono?: string | null
        }
        Update: {
          id_clinica?: number
          nombre?: string
          direccion?: string | null
          telefono?: string | null
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          id_usuario: string
          nombre: string
          correo: string
          rol: 'Administrador' | 'Veterinario' | 'Recepcionista'
          id_clinica: number | null
        }
        Insert: {
          id_usuario: string
          nombre: string
          correo: string
          rol: 'Administrador' | 'Veterinario' | 'Recepcionista'
          id_clinica?: number | null
        }
        Update: {
          id_usuario?: string
          nombre?: string
          correo?: string
          rol?: 'Administrador' | 'Veterinario' | 'Recepcionista'
          id_clinica?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'usuarios_id_clinica_fkey'
            columns: ['id_clinica']
            isOneToOne: false
            referencedRelation: 'clinicas'
            referencedColumns: ['id_clinica']
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: 'inventario_id_clinica_fkey'
            columns: ['id_clinica']
            isOneToOne: false
            referencedRelation: 'clinicas'
            referencedColumns: ['id_clinica']
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
