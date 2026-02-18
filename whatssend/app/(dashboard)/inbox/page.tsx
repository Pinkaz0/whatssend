'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useInboxStore } from '@/stores/useInboxStore'
import { useConversations } from '@/hooks/useConversations'
import { useMessages, useSendMessage } from '@/hooks/useMessages'
import { ChatList } from '@/components/inbox/ChatList'
import { ChatWindow } from '@/components/inbox/ChatWindow'
import { ContactHeader } from '@/components/inbox/ContactHeader'
import { EmptyChat } from '@/components/inbox/EmptyChat'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function InboxPage() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [loadingWorkspace, setLoadingWorkspace] = useState(true)

  const {
    selectedContactId,
    setSelectedContactId,
    searchQuery,
    setSearchQuery,
  } = useInboxStore()

  // Obtener workspace del usuario actual
  useEffect(() => {
    async function fetchWorkspace() {
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
      setLoadingWorkspace(false)
    }

    fetchWorkspace()
  }, [])

  // Hooks de datos
  const {
    data: conversations = [],
    isLoading: loadingConversations,
  } = useConversations(workspaceId, searchQuery)

  const {
    data: messages = [],
    isLoading: loadingMessages,
  } = useMessages(selectedContactId, workspaceId)

  const sendMessage = useSendMessage()

  // Encontrar la conversación seleccionada
  const selectedConversation = conversations.find(
    (c) => c.contact_id === selectedContactId
  )

  const handleSendMessage = (message: string) => {
    if (!selectedContactId || !workspaceId) return

    sendMessage.mutate(
      { contactId: selectedContactId, message, workspaceId },
      {
        onError: (error) => {
          toast.error('Error al enviar mensaje', {
            description: error.message,
          })
        },
      }
    )
  }

  const handleSelectContact = (contactId: string) => {
    setSelectedContactId(contactId)
  }

  const handleBack = () => {
    setSelectedContactId(null)
  }

  const isLoadingList = loadingWorkspace || loadingConversations

  return (
    <div className="flex h-[calc(100vh-64px)] -m-6 bg-[#0F1117]">
      {/* Panel izquierdo: Lista de chats */}
      <div
        className={cn(
          'w-full md:w-[380px] md:min-w-[320px] md:max-w-[420px] border-r border-[#1E2235] flex-shrink-0 bg-[#0F1117]',
          selectedContactId ? 'hidden md:flex md:flex-col' : 'flex flex-col'
        )}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#1E2235]">
          <h2 className="text-lg font-bold text-white">Bandeja de Entrada</h2>
          <p className="text-xs text-[#475569] mt-0.5">
            {conversations.length} conversación{conversations.length !== 1 ? 'es' : ''}
          </p>
        </div>

        <ChatList
          conversations={conversations}
          selectedContactId={selectedContactId}
          searchQuery={searchQuery}
          isLoading={isLoadingList}
          onSelectContact={handleSelectContact}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Panel derecho: Chat Window */}
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0 relative',
          !selectedContactId ? 'hidden md:flex' : 'flex'
        )}
      >
        {selectedContactId && selectedConversation ? (
          <>
            <ContactHeader
              conversation={selectedConversation}
              onBack={handleBack}
              showBackButton
            />
            <ChatWindow
              messages={messages}
              isLoading={loadingMessages}
              isSending={sendMessage.isPending}
              onSendMessage={handleSendMessage}
            />
          </>
        ) : (
          <EmptyChat />
        )}
      </div>
    </div>
  )
}
