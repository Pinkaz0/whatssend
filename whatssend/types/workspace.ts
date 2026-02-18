export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface Workspace {
  id: string
  name: string
  owner_id: string
  ultramsg_instance_id: string | null
  ultramsg_token: string | null
  created_at: string
}

export interface WorkspaceInsert {
  name: string
  owner_id: string
  ultramsg_instance_id?: string | null
  ultramsg_token?: string | null
}
