export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          role: string | null
          updated_at: string | null
          phone: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string | null
          phone?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
          phone?: string | null
        }
      }
      workspaces: {
        Row: {
          bot_enabled: boolean
          created_at: string | null
          id: string
          name: string
          owner_id: string | null
          updated_at: string | null
        }
        Insert: {
          bot_enabled?: boolean
          created_at?: string | null
          id?: string
          name: string
          owner_id?: string | null
          updated_at?: string | null
        }
        Update: {
          bot_enabled?: boolean
          created_at?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          updated_at?: string | null
        }
      }
      agent_sessions: {
        Row: {
          id: string
          remote_jid: string
          workspace_id: string | null
          estado: string
          context: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          remote_jid: string
          workspace_id?: string | null
          estado?: string
          context?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          remote_jid?: string
          workspace_id?: string | null
          estado?: string
          context?: any
          created_at?: string
          updated_at?: string
        }
      }
      agent_messages: {
        Row: {
          id: string
          session_id: string
          role: string
          content: string
          wa_message_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          role: string
          content: string
          wa_message_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          role?: string
          content?: string
          wa_message_id?: string | null
          created_at?: string
        }
      }
      messages: {
        Row: { id: string, created_at: string, content: string, from_me: boolean, remote_jid: string, push_name: string | null, message_type: string, status: string, message_id: string, instance_name: string, campaign_id: string | null, workspace_id: string | null, media_url: string | null, media_type: string | null, context_info: any | null }
        Insert: { id?: string, created_at?: string, content: string, from_me?: boolean, remote_jid: string, push_name?: string | null, message_type?: string, status?: string, message_id: string, instance_name: string, campaign_id?: string | null, workspace_id?: string | null, media_url?: string | null, media_type?: string | null, context_info?: any | null }
        Update: { id?: string, created_at?: string, content?: string, from_me?: boolean, remote_jid?: string, push_name?: string | null, message_type?: string, status?: string, message_id?: string, instance_name?: string, campaign_id?: string | null, workspace_id?: string | null, media_url?: string | null, media_type?: string | null, context_info?: any | null }
      }
      contacts: {
        Row: { id: string, phone: string, name: string | null, tags: string[] | null, created_at: string, updated_at: string, last_interaction_at: string | null, unread_count: number, workspace_id: string | null }
        Insert: { id?: string, phone: string, name?: string | null, tags?: string[] | null, created_at?: string, updated_at?: string, last_interaction_at?: string | null, unread_count?: number, workspace_id?: string | null }
        Update: { id?: string, phone?: string, name?: string | null, tags?: string[] | null, created_at?: string, updated_at?: string, last_interaction_at?: string | null, unread_count?: number, workspace_id?: string | null }
      }
      ventas_toa: {
        Row: { id: string, orden: string, estado: string, cliente: string | null, rut: string | null, direccion: string | null, telefono: string | null, subtipo: string | null, fecha_emision: string | null, fecha_agenda: string | null, bloque: string | null, ventana: string | null, fibra: string | null, obs: string | null, tecnico: string | null, raw_data: any, created_at: string, updated_at: string }
        Insert: { id?: string, orden: string, estado: string, cliente?: string | null, rut?: string | null, direccion?: string | null, telefono?: string | null, subtipo?: string | null, fecha_emision?: string | null, fecha_agenda?: string | null, bloque?: string | null, ventana?: string | null, fibra?: string | null, obs?: string | null, tecnico?: string | null, raw_data?: any, created_at?: string, updated_at?: string }
        Update: { id?: string, orden?: string, estado?: string, cliente?: string | null, rut?: string | null, direccion?: string | null, telefono?: string | null, subtipo?: string | null, fecha_emision?: string | null, fecha_agenda?: string | null, bloque?: string | null, ventana?: string | null, fibra?: string | null, obs?: string | null, tecnico?: string | null, raw_data?: any, created_at?: string, updated_at?: string }
      }
      workspace_members: {
        Row: { workspace_id: string, user_id: string, role: string, created_at: string }
        Insert: { workspace_id: string, user_id: string, role?: string, created_at?: string }
        Update: { workspace_id?: string, user_id?: string, role?: string, created_at?: string }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
