export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface Workspace {
  id: string
  name: string
  slug: string
  settings: Record<string, any>
  owner_id: string
  created_at: string
  updated_at: string
  
  // Plantillas Default
  default_template_id?: string
  default_template_name?: string

  // UltraMsg Connection (Deprecated)
  ultramsg_instance_id?: string
  ultramsg_token?: string

  // Evolution API Connection
  evolution_api_url?: string
  evolution_api_key?: string
  evolution_instance?: string
}

export interface WorkspaceInsert {
  name: string
  owner_id: string
  ultramsg_instance_id?: string | null
  ultramsg_token?: string | null
}
