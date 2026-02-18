import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Actualiza la sesión de Supabase en el middleware de Next.js.
 * Esto asegura que los tokens se refresquen automáticamente.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // No ejecutar código entre createServerClient y supabase.auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Rutas públicas que no requieren autenticación
  const publicPaths = ['/login', '/register']
  const isPublicPath = publicPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  )

  // Si el usuario no está autenticado y la ruta NO es pública, redirigir a login
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Si el usuario está autenticado y está en una ruta de auth, redirigir al dashboard
  if (user && isPublicPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
