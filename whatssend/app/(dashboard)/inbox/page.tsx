'use client'

import { useState } from 'react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useInboxStore } from '@/stores/useInboxStore'
import { useConversations } from '@/hooks/useConversations'
import { useMessages, useSendMessage } from '@/hooks/useMessages'
import { ChatList } from '@/components/inbox/ChatList'
import { ChatWindow } from '@/components/inbox/ChatWindow'
import { ContactHeader } from '@/components/inbox/ContactHeader'
import { EmptyChat } from '@/components/inbox/EmptyChat'
import { ContactInfo } from '@/components/inbox/ContactInfo'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function InboxPage() {
  const { workspaceId, isLoading: loadingWorkspace } = useWorkspace()
  const [showContactInfo, setShowContactInfo] = useState(false)

  const {
    selectedContactId,
    setSelectedContactId,
    searchQuery,
    setSearchQuery,
  } = useInboxStore()

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
    setShowContactInfo(false)
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

      {/* Panel central: Chat Window */}
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0 relative transition-all duration-300',
          !selectedContactId ? 'hidden md:flex' : 'flex',
          showContactInfo ? 'mr-0 md:mr-[300px] lg:mr-[350px]' : ''
        )}
      >
        {selectedContactId && selectedConversation ? (
          <>
            <ContactHeader
              conversation={selectedConversation}
              onBack={handleBack}
              showBackButton
              onInfoClick={() => setShowContactInfo(!showContactInfo)}
            />
            <ChatWindow
              messages={messages}
              isLoading={loadingMessages}
              isSending={sendMessage.isPending}
              onSendMessage={handleSendMessage}
              workspaceId={workspaceId}
            />
          </>
        ) : (
          <EmptyChat />
        )}
      </div>

      {/* Panel derecho: Info de Contacto */}
      <div
        className={cn(
          'fixed inset-y-0 right-0 z-20 w-full md:w-[300px] lg:w-[350px] bg-[#0F1117] transform transition-transform duration-300 ease-in-out border-l border-[#1E2235] shadow-2xl md:shadow-none md:relative md:transform-none md:right-auto md:left-auto md:h-full md:border-l',
          showContactInfo ? 'translate-x-0' : 'translate-x-full md:hidden'
        )}
        style={{ top: '64px' }}
      >
        {selectedContactId && selectedConversation && showContactInfo && (
          <ContactInfo
            conversation={selectedConversation}
            onClose={() => setShowContactInfo(false)}
          />
        )}
      </div>
    </div>
  )
}
