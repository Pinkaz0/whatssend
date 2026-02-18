import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

interface ContactTagProps {
  tag: string
  onRemove?: () => void
  className?: string
}

const tagColors: Record<string, string> = {
  'hot-lead': 'bg-red-500/20 text-red-400 border-red-500/30',
  'warm-lead': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'cold-lead': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'cliente': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'vip': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'churned': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
}

const defaultColor = 'bg-[#1E2235] text-[#94A3B8] border-[#2A2F45]'

export function ContactTag({ tag, onRemove, className }: ContactTagProps) {
  const color = tagColors[tag.toLowerCase()] || defaultColor

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border',
        color,
        className
      )}
    >
      {tag}
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          className="hover:opacity-70 transition-opacity"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  )
}
