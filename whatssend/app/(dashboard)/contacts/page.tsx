'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useContacts } from '@/hooks/useContacts'
import { ContactTable } from '@/components/contacts/ContactTable'
import { ImportModal } from '@/components/contacts/ImportModal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, Upload, Search } from 'lucide-react'

export default function ContactsPage() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [importOpen, setImportOpen] = useState(false)

  useEffect(() => {
    async function loadWorkspace() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1)
        .maybeSingle()

      setWorkspaceId(workspace?.id || null)
    }
    loadWorkspace()
  }, [])

  const {
    data: contacts = [],
    isLoading,
  } = useContacts(workspaceId, {
    search: search || undefined,
    status: statusFilter || undefined,
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            Contactos
          </h1>
          <p className="text-[#64748B] text-sm mt-1">
            {contacts.length} contacto{contacts.length !== 1 ? 's' : ''} registrados
          </p>
        </div>
        <Button
          onClick={() => setImportOpen(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
        >
          <Upload className="w-4 h-4 mr-2" />
          Importar Excel
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
          <Input
            placeholder="Buscar por nombre, teléfono, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[#1A1D27] border-[#1E2235] text-white placeholder:text-[#475569] h-9 text-sm focus:border-emerald-500/50 focus:ring-0"
          />
        </div>
        <Select
          value={statusFilter || '_all'}
          onValueChange={(val) => setStatusFilter(val === '_all' ? '' : val)}
        >
          <SelectTrigger className="w-[160px] bg-[#1A1D27] border-[#1E2235] text-white h-9 text-sm">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent className="bg-[#1A1D27] border-[#2A2F45]">
            <SelectItem value="_all" className="text-[#94A3B8]">Todos</SelectItem>
            <SelectItem value="new" className="text-white">Nuevo</SelectItem>
            <SelectItem value="contacted" className="text-white">Contactado</SelectItem>
            <SelectItem value="responded" className="text-white">Respondió</SelectItem>
            <SelectItem value="converted" className="text-white">Convertido</SelectItem>
            <SelectItem value="lost" className="text-white">Perdido</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <ContactTable contacts={contacts} isLoading={isLoading} />

      {/* Import Modal */}
      {workspaceId && (
        <ImportModal
          open={importOpen}
          onOpenChange={setImportOpen}
          workspaceId={workspaceId}
        />
      )}
    </div>
  )
}
