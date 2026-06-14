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
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
