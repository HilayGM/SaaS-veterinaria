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
      clientes_duenos: {
        Row: {
          id_dueño: number
          nombre: string
          telefono: string | null
          correo: string | null
        }
        Insert: {
          id_dueño?: number
          nombre: string
          telefono?: string | null
          correo?: string | null
        }
        Update: {
          id_dueño?: number
          nombre?: string
          telefono?: string | null
          correo?: string | null
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
          medicamento: string | null
          dosis: string | null
          frecuencia: string | null
          duracion: string | null
        }
        Insert: {
          id_mascota?: number
          nombre: string
          especie: string
          raza?: string | null
          fecha_nacimiento?: string | null
          id_dueño?: number | null
          id_clinica?: number | null
          medicamento?: string | null
          dosis?: string | null
          frecuencia?: string | null
          duracion?: string | null
        }
        Update: {
          id_mascota?: number
          nombre?: string
          especie?: string
          raza?: string | null
          fecha_nacimiento?: string | null
          id_dueño?: number | null
          id_clinica?: number | null
          medicamento?: string | null
          dosis?: string | null
          frecuencia?: string | null
          duracion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'mascotas_id_dueno_fkey'
            columns: ['id_dueño']
            isOneToOne: false
            referencedRelation: 'clientes_duenos'
            referencedColumns: ['id_dueño']
          },
          {
            foreignKeyName: 'mascotas_id_clinica_fkey'
            columns: ['id_clinica']
            isOneToOne: false
            referencedRelation: 'clinicas'
            referencedColumns: ['id_clinica']
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: 'expedientes_id_mascota_fkey'
            columns: ['id_mascota']
            isOneToOne: false
            referencedRelation: 'mascotas'
            referencedColumns: ['id_mascota']
          }
        ]
      }
      citas: {
        Row: {
          id_cita: number
          id_mascota: number | null
          fecha: string
          estado: 'Pendiente' | 'Completada' | 'Cancelada'
        }
        Insert: {
          id_cita?: number
          id_mascota?: number | null
          fecha: string
          estado?: 'Pendiente' | 'Completada' | 'Cancelada'
        }
        Update: {
          id_cita?: number
          id_mascota?: number | null
          fecha?: string
          estado?: 'Pendiente' | 'Completada' | 'Cancelada'
        }
        Relationships: [
          {
            foreignKeyName: 'citas_id_mascota_fkey'
            columns: ['id_mascota']
            isOneToOne: false
            referencedRelation: 'mascotas'
            referencedColumns: ['id_mascota']
          }
        ]
      }
      vacunas: {
        Row: {
          id_vacuna: number
          id_mascota: number | null
          nombre: string
          fecha_aplicacion: string
          proxima_aplicacion: string | null
        }
        Insert: {
          id_vacuna?: number
          id_mascota?: number | null
          nombre: string
          fecha_aplicacion?: string
          proxima_aplicacion?: string | null
        }
        Update: {
          id_vacuna?: number
          id_mascota?: number | null
          nombre?: string
          fecha_aplicacion?: string
          proxima_aplicacion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'vacunas_id_mascota_fkey'
            columns: ['id_mascota']
            isOneToOne: false
            referencedRelation: 'mascotas'
            referencedColumns: ['id_mascota']
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: 'detalle_insumos_expediente_id_expediente_fkey'
            columns: ['id_expediente']
            isOneToOne: false
            referencedRelation: 'expedientes'
            referencedColumns: ['id_expediente']
          },
          {
            foreignKeyName: 'detalle_insumos_expediente_id_producto_fkey'
            columns: ['id_producto']
            isOneToOne: false
            referencedRelation: 'inventario'
            referencedColumns: ['id_producto']
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
