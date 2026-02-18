import { MessageSquare } from 'lucide-react'

/**
 * Estado vacío cuando no hay conversaciones en el inbox.
 */
export function EmptyInbox() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
      <div className="w-20 h-20 rounded-full bg-[#1A1D27] flex items-center justify-center mb-6">
        <MessageSquare className="w-9 h-9 text-[#475569]" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">
        No hay conversaciones
      </h3>
      <p className="text-sm text-[#64748B] max-w-xs">
        Las conversaciones aparecerán aquí cuando recibas o envíes mensajes de WhatsApp.
      </p>
    </div>
  )
}
