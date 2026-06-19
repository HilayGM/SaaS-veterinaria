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
    }

    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}