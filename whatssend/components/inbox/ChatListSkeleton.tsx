import { Skeleton } from '@/components/ui/skeleton'

/**
 * Loading skeleton para la lista de chats del inbox (panel izquierdo).
 * Muestra 6 items pulsantes con avatar + texto.
 */
export function ChatListSkeleton() {
  return (
    <div className="flex flex-col">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-[#1E2235]">
          {/* Avatar */}
          <Skeleton className="w-11 h-11 rounded-full bg-[#1E2235] flex-shrink-0" />
          {/* Text content */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24 bg-[#1E2235]" />
              <Skeleton className="h-3 w-12 bg-[#1E2235]" />
            </div>
            <Skeleton className="h-3 w-40 bg-[#1E2235]" />
          </div>
        </div>
      ))}
    </div>
  )
}
