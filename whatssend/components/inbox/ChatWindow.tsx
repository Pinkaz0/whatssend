'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { Send, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MessageBubble } from './MessageBubble'
import { MessageListSkeleton } from './MessageListSkeleton'
import { TemplateSelector } from './TemplateSelector'
import type { Message } from '@/types/message'

interface ChatWindowProps {
  messages: Message[]
  isLoading: boolean
  isSending: boolean
  onSendMessage: (message: string) => void
  workspaceId: string | null
}

export function ChatWindow({ messages, isLoading, isSending, onSendMessage, workspaceId }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [inputValue, setInputValue] = useState('')
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [showNewMessageBtn, setShowNewMessageBtn] = useState(false)
  const prevMessageCountRef = useRef(messages.length)

  // Función para scroll al fondo
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior })
    setShowNewMessageBtn(false)
  }, [])

  // Detectar posición de scroll
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const threshold = 100
    const atBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < threshold
    setIsAtBottom(atBottom)

    if (atBottom) {
      setShowNewMessageBtn(false)
    }
  }, [])

  // Scroll al fondo al cargar por primera vez
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      scrollToBottom('instant')
    }
  }, [isLoading, scrollToBottom])

  // Smart scroll: al recibir nuevos mensajes
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      if (isAtBottom) {
        scrollToBottom('smooth')
      } else {
        // Nuevo mensaje pero usuario está leyendo arriba → mostrar botón
        setShowNewMessageBtn(true)
      }
    }
    prevMessageCountRef.current = messages.length
  }, [messages.length, isAtBottom, scrollToBottom])

  // Auto-resize textarea
  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
     textarea.style.height = 'auto'
     textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value)
    adjustTextareaHeight(e.target)
  }

  // Enter envía, Shift+Enter nueva línea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSend = () => {
    const trimmed = inputValue.trim()
    if (!trimmed || isSending) return

    onSendMessage(trimmed)
    setInputValue('')

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      // Focus back to textarea
      textareaRef.current.focus()
    }

    // Forzar scroll al fondo al enviar
    setTimeout(() => scrollToBottom('smooth'), 50)
  }

  const handleTemplateSelect = (text: string) => {
     // Insert at cursor or append? Appending is easier for now, or just replace if empty.
     // Let's append with a space if not empty.
     setInputValue(prev => {
        const prefix = prev ? prev + ' ' : ''
        return prefix + text
     })
     
     // Focus and resize
     setTimeout(() => {
        if (textareaRef.current) {
           textareaRef.current.focus()
           adjustTextareaHeight(textareaRef.current)
        }
     }, 10)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-2 relative"
      >
        {isLoading ? (
          <MessageListSkeleton />
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-[#475569]">No hay mensajes aún. ¡Envía el primero!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* "Nuevo mensaje" button */}
      {showNewMessageBtn && (
        <div className="absolute bottom-[72px] left-1/2 -translate-x-1/2 z-10">
          <button
            onClick={() => scrollToBottom('smooth')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-medium shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-colors animate-in fade-in-0 slide-in-from-bottom-2"
          >
            <ChevronDown className="w-3.5 h-3.5" />
            Nuevo mensaje
          </button>
        </div>
      )}

      {/* Message composer */}
      <div className="border-t border-[#1E2235] bg-[#0F1117] p-3">
        <div className="flex items-end gap-2">
          {workspaceId && (
             <TemplateSelector workspaceId={workspaceId} onSelect={handleTemplateSelect} />
          )}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un mensaje..."
              rows={1}
              className="w-full resize-none bg-[#1A1D27] border border-[#1E2235] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-[#475569] focus:outline-none focus:border-emerald-500/50 transition-colors"
              style={{ maxHeight: '120px' }}
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isSending}
            size="icon"
            className="h-10 w-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20 disabled:opacity-40 disabled:shadow-none transition-all flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[10px] text-[#475569] mt-1.5 ml-12">
          Enter para enviar · Shift+Enter nueva línea
        </p>
      </div>
    </div>
  )
}
