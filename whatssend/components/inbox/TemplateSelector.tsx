'use client'

import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Zap, Search, Loader2 } from 'lucide-react'
import { useTemplates } from '@/hooks/useTemplates'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'

interface TemplateSelectorProps {
  workspaceId: string
  onSelect: (text: string) => void
}

export function TemplateSelector({ workspaceId, onSelect }: TemplateSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const { data: templates = [], isLoading } = useTemplates(workspaceId)

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.body.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (body: string) => {
    onSelect(body)
    setOpen(false)
    setSearch('')
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9 text-[#94A3B8] hover:text-white hover:bg-[#1A1D27] shrink-0"
          title="Respuestas rápidas"
        >
          <Zap className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[300px] bg-[#1A1D27] border-[#1E2235] text-white p-0">
        <div className="p-2 border-b border-[#1E2235]">
           <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#475569]" />
              <Input 
                 placeholder="Buscar plantilla..." 
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 className="h-8 pl-8 bg-[#0F1117] border-[#1E2235] text-xs text-white placeholder:text-[#475569] focus-visible:ring-0 focus-visible:border-emerald-500/50"
              />
           </div>
        </div>
        <ScrollArea className="h-[200px]">
           {isLoading ? (
              <div className="flex items-center justify-center h-20">
                 <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
              </div>
           ) : filteredTemplates.length === 0 ? (
              <div className="p-4 text-center text-xs text-[#64748B]">
                 No hay plantillas encontradas
              </div>
           ) : (
              <div className="p-1">
                 {filteredTemplates.map(template => (
                    <DropdownMenuItem 
                       key={template.id}
                       onClick={() => handleSelect(template.body)}
                       className="flex flex-col items-start gap-1 p-2 focus:bg-[#0F1117] focus:text-white cursor-pointer rounded-md"
                    >
                       <span className="font-medium text-xs text-emerald-400">{template.name}</span>
                       <span className="text-[10px] text-[#94A3B8] line-clamp-2 w-full">{template.body}</span>
                    </DropdownMenuItem>
                 ))}
              </div>
           )}
        </ScrollArea>
        <DropdownMenuSeparator className="bg-[#1E2235] m-0" />
        <div className="p-1 bg-[#1A1D27]">
           <DropdownMenuItem disabled className="text-[10px] text-[#475569] justify-center h-6">
              Gestionar plantillas en menú
           </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
