import { create } from 'zustand'

interface InboxState {
  selectedContactId: string | null
  contactSidebarOpen: boolean
  searchQuery: string
  isAtBottom: boolean
  setSelectedContactId: (id: string | null) => void
  setContactSidebarOpen: (open: boolean) => void
  setSearchQuery: (query: string) => void
  setIsAtBottom: (atBottom: boolean) => void
}

export const useInboxStore = create<InboxState>((set) => ({
  selectedContactId: null,
  contactSidebarOpen: false,
  searchQuery: '',
  isAtBottom: true,
  setSelectedContactId: (id) => set({ selectedContactId: id }),
  setContactSidebarOpen: (open) => set({ contactSidebarOpen: open }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setIsAtBottom: (atBottom) => set({ isAtBottom: atBottom }),
}))
