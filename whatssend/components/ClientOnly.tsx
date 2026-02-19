'use client'

import { useState, useEffect } from 'react'

/**
 * Renderiza children solo en el cliente, tras el primer mount.
 * Evita hydration mismatch con componentes Radix (Sheet, DropdownMenu) que generan IDs distintos en server vs client.
 */
export function ClientOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <>{fallback}</>
  return <>{children}</>
}
