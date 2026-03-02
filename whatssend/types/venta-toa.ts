export interface VentaTOA {
  id: string
  workspace_id: string
  owner_id?: string
  orden: string
  estado: string
  cliente: string | null
  rut: string | null
  fibra: string | null
  fecha_emision: string | null
  fecha_agenda: string | null
  bloque: string | null
  ventana: string | null
  tecnico: string | null
  obs: string | null
  telefono: string | null
  direccion: string | null
  created_at: string
  updated_at: string
}
