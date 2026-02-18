import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Crea un cliente Supabase para uso en el servidor (Server Components, API Routes).
 * Maneja cookies automáticamente para mantener la sesión del usuario.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll puede fallar en Server Components (read-only).
            // Esto es esperado — el middleware manejará el refresh de sesión.
          }
        },
      },
    }
  )
}
