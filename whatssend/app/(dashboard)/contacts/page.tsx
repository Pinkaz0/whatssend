'use client'

import { useState } from 'react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useContacts, useDeleteContact } from '@/hooks/useContacts'
import { formatPhoneDisplay } from '@/lib/utils/phone'
import { Search, Trash2, User, Phone, Mail, Building2, Tag } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function ContactsPage() {
  const { workspaceId } = useWorkspace()
  const [search, setSearch] = useState('')
  const { data: contacts = [], isLoading } = useContacts(workspaceId, { search })
  const deleteContact = useDeleteContact()

  // Solo mostrar contactos "guardados" (source != inbound, o que tengan nombre)
  // Para que el usuario sepa cuáles ha guardado explícitamente
  const savedContacts = contacts.filter(c => c.name || c.source !== 'inbound')

  const handleDelete = async (id: string) => {
    try {
      await deleteContact.mutateAsync(id)
      toast.success('Contacto eliminado')
    } catch {
      toast.error('Error al eliminar contacto')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Contactos</h1>
        <p className="text-sm text-[#64748B] mt-1">
          {savedContacts.length} contacto{savedContacts.length !== 1 ? 's' : ''} guardado{savedContacts.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
        <Input
          placeholder="Buscar por nombre, teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-[#1A1D27] border-[#1E2235] text-white placeholder:text-[#475569] focus:border-emerald-500/50"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#1E2235] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-[#1E2235] hover:bg-transparent">
              <TableHead className="text-[#475569]">Nombre</TableHead>
              <TableHead className="text-[#475569]">Teléfono</TableHead>
              <TableHead className="text-[#475569]">Email</TableHead>
              <TableHead className="text-[#475569]">Empresa</TableHead>
              <TableHead className="text-[#475569]">Etiquetas</TableHead>
              <TableHead className="text-[#475569] text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i} className="border-[#1E2235]">
                  {[...Array(6)].map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 bg-[#1E2235] rounded animate-pulse w-3/4" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : savedContacts.length === 0 ? (
              <TableRow className="border-[#1E2235]">
                <TableCell colSpan={6} className="text-center py-12 text-[#475569]">
                  <User className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No hay contactos guardados aún.</p>
                  <p className="text-xs mt-1">Guarda contactos desde la bandeja de entrada.</p>
                </TableCell>
              </TableRow>
            ) : (
              savedContacts.map((contact) => (
                <TableRow
                  key={contact.id}
                  className="border-[#1E2235] hover:bg-[#1A1D27]/50 transition-colors"
                >
                  <TableCell className="font-medium text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                        {contact.name
                          ? contact.name.trim().split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()
                          : contact.phone.slice(-2)}
                      </div>
                      <span>{contact.name || <span className="text-[#475569] italic">Sin nombre</span>}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[#94A3B8]">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-[#475569]" />
                      {formatPhoneDisplay(contact.phone)}
                    </div>
                  </TableCell>
                  <TableCell className="text-[#94A3B8]">
                    {contact.email ? (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-[#475569]" />
                        {contact.email}
                      </div>
                    ) : (
                      <span className="text-[#475569]">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-[#94A3B8]">
                    {contact.company ? (
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3 h-3 text-[#475569]" />
                        {contact.company}
                      </div>
                    ) : (
                      <span className="text-[#475569]">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {contact.tags && contact.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {contact.tags.map((tag: string) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="bg-[#1E2235] text-[#94A3B8] border-[#2A2F45] text-[10px] py-0"
                          >
                            <Tag className="w-2.5 h-2.5 mr-1" />{tag}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[#475569]">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[#475569] hover:text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-[#1A1D27] border-[#2A2F45]">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-white">¿Eliminar contacto?</AlertDialogTitle>
                          <AlertDialogDescription className="text-[#64748B]">
                            Se eliminará {contact.name || contact.phone} permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-[#0F1117] border-[#2A2F45] text-white hover:bg-[#1E2235]">
                            Cancelar
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(contact.id)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
