import { Skeleton } from '@/components/ui/skeleton'

/**
 * Loading skeleton para el thread de mensajes (panel derecho).
 * Muestra burbujas alternando izquierda/derecha.
 */
export function MessageListSkeleton() {
  const bubbles = [
    { side: 'left', width: 'w-48' },
    { side: 'left', width: 'w-64' },
    { side: 'right', width: 'w-56' },
    { side: 'left', width: 'w-40' },
    { side: 'right', width: 'w-52' },
    { side: 'right', width: 'w-44' },
    { side: 'left', width: 'w-60' },
  ]

  return (
    <div className="flex flex-col gap-3 p-4">
      {bubbles.map((b, i) => (
        <div
          key={i}
          className={`flex ${b.side === 'right' ? 'justify-end' : 'justify-start'}`}
        >
          <Skeleton
            className={`h-10 ${b.width} rounded-2xl ${
              b.side === 'right' ? 'bg-emerald-500/10' : 'bg-[#1E2235]'
            }`}
          />
        </div>
      ))}
    </div>
  )
}
