'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface BotFile {
  id: string
  name: string
  file_type: string
  file_size: number
  storage_path: string
  active: boolean
  created_at: string
}

export function useBotFiles(workspaceId: string | null) {
  const queryClient = useQueryClient()

  const filesQuery = useQuery<BotFile[]>({
    queryKey: ['bot-files', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return []
      const supabase = createClient()
      const { data, error } = await supabase
        .from('bot_files')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as BotFile[]
    },
    enabled: !!workspaceId,
  })

  // Upload file to Storage + record in DB
  const uploadFile = useMutation({
    mutationFn: async ({ file, fileType }: { file: File; fileType: string }) => {
      if (!workspaceId) throw new Error('No workspace')
      const supabase = createClient()

      // 1. Upload to Supabase Storage
      const path = `${workspaceId}/bot-files/${Date.now()}_${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('workspaces')
        .upload(path, file)

      if (uploadError) throw uploadError

      // 2. Create DB record
      const { error: dbError } = await supabase.from('bot_files').insert({
        workspace_id: workspaceId,
        name: file.name,
        file_type: fileType,
        file_size: file.size,
        storage_path: path,
        active: true,
      })

      if (dbError) throw dbError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot-files'] })
    },
  })

  // Toggle active status
  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const supabase = createClient()
      const { error } = await supabase.from('bot_files').update({ active }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot-files'] })
    },
  })

  // Delete file
  const deleteFile = useMutation({
    mutationFn: async (file: BotFile) => {
      const supabase = createClient()
      
      // 1. Delete from Storage
      const { error: storageError } = await supabase.storage
        .from('workspaces')
        .remove([file.storage_path])
      
      if (storageError) console.error('Storage delete error:', storageError)

      // 2. Delete from DB
      const { error: dbError } = await supabase.from('bot_files').delete().eq('id', file.id)
      if (dbError) throw dbError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot-files'] })
    },
  })

  return {
    files: filesQuery.data || [],
    isLoading: filesQuery.isLoading,
    uploadFile,
    toggleActive,
    deleteFile,
  }
}
