import { create } from 'zustand'

interface AppState {
  sidebarExpanded: boolean
  mobileSidebarOpen: boolean
  currentWorkspaceId: string | null
  setSidebarExpanded: (expanded: boolean) => void
  setMobileSidebarOpen: (open: boolean) => void
  setCurrentWorkspaceId: (id: string | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  sidebarExpanded: false,
  mobileSidebarOpen: false,
  currentWorkspaceId: null,
  setSidebarExpanded: (expanded) => set({ sidebarExpanded: expanded }),
  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
  setCurrentWorkspaceId: (id) => set({ currentWorkspaceId: id }),
}))
