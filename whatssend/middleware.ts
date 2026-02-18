import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value)
            res.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Refresh session if expired — required for Server Components
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const url = req.nextUrl
  const isAuthPage =
    url.pathname.startsWith('/login') ||
    url.pathname.startsWith('/register')

  // No session and trying to access protected route → redirect to login
  if (!session && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Has session and trying to access auth page → redirect to inbox
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL('/inbox', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|api).*)'],
}