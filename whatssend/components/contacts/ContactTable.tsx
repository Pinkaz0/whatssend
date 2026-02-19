'use client'

import { useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'
import type { Contact } from '@/types/contact'
import { ContactTag } from './ContactTag'
import { formatPhoneDisplay } from '@/lib/utils/phone'
import { Button } from '@/components/ui/button'
import { ArrowUpDown, ChevronLeft, ChevronRight, Edit2 } from 'lucide-react'

interface ContactTableProps {
  contacts: Contact[]
  isLoading: boolean
  onEdit: (contact: Contact) => void
}

export function ContactTable({ contacts, isLoading, onEdit }: ContactTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])

  const columns = useMemo<ColumnDef<Contact>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:text-white transition-colors"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Nombre
            <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-white">
              {row.original.name
                ? row.original.name.charAt(0).toUpperCase()
                : '#'}
            </div>
            <span className="text-sm text-white font-medium truncate">
              {row.original.name || 'Sin nombre'}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'phone',
        header: 'Teléfono',
        cell: ({ row }) => (
          <span className="text-sm text-[#94A3B8] font-mono">
            {formatPhoneDisplay(row.original.phone)}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        cell: ({ row }) => {
          const colors: Record<string, string> = {
            new: 'bg-blue-500/20 text-blue-400',
            contacted: 'bg-yellow-500/20 text-yellow-400',
            responded: 'bg-emerald-500/20 text-emerald-400',
            converted: 'bg-purple-500/20 text-purple-400',
            lost: 'bg-red-500/20 text-red-400',
          }
          const labels: Record<string, string> = {
            new: 'Nuevo',
            contacted: 'Contactado',
            responded: 'Respondió',
            converted: 'Convertido',
            lost: 'Perdido',
          }
          return (
            <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${colors[row.original.status] || colors.new}`}>
              {labels[row.original.status] || row.original.status}
            </span>
          )
        },
      },
      {
        accessorKey: 'tags',
        header: 'Etiquetas',
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {(row.original.tags || []).slice(0, 3).map((tag) => (
              <ContactTag key={tag} tag={tag} />
            ))}
            {(row.original.tags || []).length > 3 && (
              <span className="text-[10px] text-[#475569]">
                +{row.original.tags.length - 3}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'company',
        header: 'Empresa',
        cell: ({ row }) => (
          <span className="text-sm text-[#64748B] truncate">
            {row.original.company || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'created_at',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:text-white transition-colors"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Creado
            <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-xs text-[#475569]">
            {new Date(row.original.created_at).toLocaleDateString('es-CL', {
              day: '2-digit',
              month: 'short',
            })}
          </span>
        ),
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <button
            onClick={() => onEdit(row.original)}
            className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <Edit2 className="w-3 h-3" />
            Editar
          </button>
        ),
      },
    ],
    [onEdit]
  )

  const table = useReactTable({
    data: contacts,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  })

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 bg-[#1E2235] rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="border border-[#1E2235] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-[#1E2235] bg-[#0F1117]">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-medium text-[#64748B] whitespace-nowrap"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-[#475569]">
                  No se encontraron contactos
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[#1E2235]/50 hover:bg-[#1A1D27]/50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-[#475569]">
            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()} · {contacts.length} contactos
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="border-[#2A2F45] text-[#94A3B8] hover:text-white hover:bg-[#0F1117] h-8"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="border-[#2A2F45] text-[#94A3B8] hover:text-white hover:bg-[#0F1117] h-8"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
