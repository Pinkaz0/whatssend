import { MessageSquare } from 'lucide-react'

/**
 * Estado inicial de la ventana de chat (ningún contacto seleccionado).
 */
export function EmptyChat() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/10 to-teal-500/5 flex items-center justify-center mb-6">
        <MessageSquare className="w-11 h-11 text-emerald-400/60" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">
        WhatsSend
      </h3>
      <p className="text-sm text-[#64748B] max-w-sm">
        Selecciona una conversación del panel izquierdo para ver los mensajes y responder.
      </p>
    </div>
  )
}
