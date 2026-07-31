export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      citas: {
        Row: {
          estado: string
          fecha: string
          id_cita: number
          id_clinica: number | null
          id_mascota: number | null
        }
        Insert: {
          estado?: string
          fecha: string
          id_cita?: number
          id_clinica?: number | null
          id_mascota?: number | null
        }
        Update: {
          estado?: string
          fecha?: string
          id_cita?: number
          id_clinica?: number | null
          id_mascota?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "citas_id_clinica_fkey"
            columns: ["id_clinica"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id_clinica"]
          },
          {
            foreignKeyName: "citas_id_mascota_fkey"
            columns: ["id_mascota"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id_mascota"]
          },
        ]
      }
      clientes_duenos: {
        Row: {
          correo: string | null
          id_clinica: number | null
          id_dueño: number
          nombre: string
          telefono: string | null
        }
        Insert: {
          correo?: string | null
          id_clinica?: number | null
          id_dueño?: number
          nombre: string
          telefono?: string | null
        }
        Update: {
          correo?: string | null
          id_clinica?: number | null
          id_dueño?: number
          nombre?: string
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_duenos_id_clinica_fkey"
            columns: ["id_clinica"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id_clinica"]
          },
        ]
      }
      clinicas: {
        Row: {
          direccion: string | null
          id_clinica: number
          nombre: string
          telefono: string | null
        }
        Insert: {
          direccion?: string | null
          id_clinica?: number
          nombre: string
          telefono?: string | null
        }
        Update: {
          direccion?: string | null
          id_clinica?: number
          nombre?: string
          telefono?: string | null
        }
        Relationships: []
      }
      detalle_insumos_expediente: {
        Row: {
          cantidad_usada: number
          fecha_movimiento: string
          id_clinica: number | null
          id_detalle: number
          id_expediente: number | null
          id_producto: number | null
        }
        Insert: {
          cantidad_usada: number
          fecha_movimiento?: string
          id_clinica?: number | null
          id_detalle?: number
          id_expediente?: number | null
          id_producto?: number | null
        }
        Update: {
          cantidad_usada?: number
          fecha_movimiento?: string
          id_clinica?: number | null
          id_detalle?: number
          id_expediente?: number | null
          id_producto?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "detalle_insumos_expediente_id_clinica_fkey"
            columns: ["id_clinica"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id_clinica"]
          },
          {
            foreignKeyName: "detalle_insumos_expediente_id_expediente_fkey"
            columns: ["id_expediente"]
            isOneToOne: false
            referencedRelation: "expedientes"
            referencedColumns: ["id_expediente"]
          },
          {
            foreignKeyName: "detalle_insumos_expediente_id_producto_fkey"
            columns: ["id_producto"]
            isOneToOne: false
            referencedRelation: "inventario"
            referencedColumns: ["id_producto"]
          },
        ]
      }
      expedientes: {
        Row: {
          diagnostico: string
          fecha_consulta: string
          id_clinica: number | null
          id_expediente: number
          id_mascota: number | null
          tratamiento: string | null
        }
        Insert: {
          diagnostico: string
          fecha_consulta?: string
          id_clinica?: number | null
          id_expediente?: number
          id_mascota?: number | null
          tratamiento?: string | null
        }
        Update: {
          diagnostico?: string
          fecha_consulta?: string
          id_clinica?: number | null
          id_expediente?: number
          id_mascota?: number | null
          tratamiento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expedientes_id_clinica_fkey"
            columns: ["id_clinica"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id_clinica"]
          },
          {
            foreignKeyName: "expedientes_id_mascota_fkey"
            columns: ["id_mascota"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id_mascota"]
          },
        ]
      }
      inventario: {
        Row: {
          cantidad: number
          fecha_caducidad: string | null
          id_clinica: number | null
          id_producto: number
          nombre: string
        }
        Insert: {
          cantidad?: number
          fecha_caducidad?: string | null
          id_clinica?: number | null
          id_producto?: number
          nombre: string
        }
        Update: {
          cantidad?: number
          fecha_caducidad?: string | null
          id_clinica?: number | null
          id_producto?: number
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventario_id_clinica_fkey"
            columns: ["id_clinica"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id_clinica"]
          },
        ]
      }
      mascotas: {
        Row: {
          dosis: string | null
          duracion: string | null
          especie: string
          fecha_nacimiento: string | null
          frecuencia: string | null
          id_clinica: number | null
          id_dueño: number | null
          id_mascota: number
          medicamento: string | null
          nombre: string
          raza: string | null
        }
        Insert: {
          dosis?: string | null
          duracion?: string | null
          especie: string
          fecha_nacimiento?: string | null
          frecuencia?: string | null
          id_clinica?: number | null
          id_dueño?: number | null
          id_mascota?: number
          medicamento?: string | null
          nombre: string
          raza?: string | null
        }
        Update: {
          dosis?: string | null
          duracion?: string | null
          especie?: string
          fecha_nacimiento?: string | null
          frecuencia?: string | null
          id_clinica?: number | null
          id_dueño?: number | null
          id_mascota?: number
          medicamento?: string | null
          nombre?: string
          raza?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mascotas_id_clinica_fkey"
            columns: ["id_clinica"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id_clinica"]
          },
          {
            foreignKeyName: "mascotas_id_dueño_fkey"
            columns: ["id_dueño"]
            isOneToOne: false
            referencedRelation: "clientes_duenos"
            referencedColumns: ["id_dueño"]
          },
        ]
      }
      solicitudes_demo: {
        Row: {
          clinica: string | null
          created_at: string
          email: string
          id: string
          mensaje: string | null
          nombre: string
          telefono: string | null
        }
        Insert: {
          clinica?: string | null
          created_at?: string
          email: string
          id?: string
          mensaje?: string | null
          nombre: string
          telefono?: string | null
        }
        Update: {
          clinica?: string | null
          created_at?: string
          email?: string
          id?: string
          mensaje?: string | null
          nombre?: string
          telefono?: string | null
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          correo: string
          id_clinica: number | null
          id_usuario: string
          nombre: string
          rol: string
        }
        Insert: {
          correo: string
          id_clinica?: number | null
          id_usuario: string
          nombre: string
          rol: string
        }
        Update: {
          correo?: string
          id_clinica?: number | null
          id_usuario?: string
          nombre?: string
          rol?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_id_clinica_fkey"
            columns: ["id_clinica"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id_clinica"]
          },
        ]
      }
      vacunas: {
        Row: {
          fecha_aplicacion: string
          id_clinica: number | null
          id_mascota: number | null
          id_vacuna: number
          nombre: string
          proxima_aplicacion: string | null
        }
        Insert: {
          fecha_aplicacion?: string
          id_clinica?: number | null
          id_mascota?: number | null
          id_vacuna?: number
          nombre: string
          proxima_aplicacion?: string | null
        }
        Update: {
          fecha_aplicacion?: string
          id_clinica?: number | null
          id_mascota?: number | null
          id_vacuna?: number
          nombre?: string
          proxima_aplicacion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vacunas_id_clinica_fkey"
            columns: ["id_clinica"]
            isOneToOne: false
            referencedRelation: "clinicas"
            referencedColumns: ["id_clinica"]
          },
          {
            foreignKeyName: "vacunas_id_mascota_fkey"
            columns: ["id_mascota"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id_mascota"]
          },
        ]
      }
    }
    Views: {
      vw_citas_hoy: {
        Row: {
          estado: string | null
          fecha: string | null
          id_cita: number | null
          mascota_nombre: string | null
          propietario_nombre: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      ajustar_stock: {
        Args: { p_delta: number; p_id_producto: number }
        Returns: number
      }
      enviar_solicitud_demo: {
        Args: {
          p_clinica?: string
          p_email: string
          p_mensaje?: string
          p_nombre: string
          p_telefono?: string
        }
        Returns: string
      }
      get_auth_clinica_id: { Args: never; Returns: number }
      get_auth_user_role: { Args: never; Returns: string }
      registrar_mascota_con_dueno: {
        Args: {
          p_dosis?: string
          p_duracion?: string
          p_especie: string
          p_fecha_nacimiento?: string
          p_frecuencia?: string
          p_medicamento?: string
          p_nombre: string
          p_nombre_dueno?: string
          p_raza?: string
        }
        Returns: number
      }
      registrar_tratamiento: {
        Args: {
          p_cantidad_usada: number
          p_id_expediente: number
          p_id_producto: number
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
