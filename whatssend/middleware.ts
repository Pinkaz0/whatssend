import { NextResponse, type NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const url = req.nextUrl

  const isAuthPage =
    url.pathname.startsWith('/login') ||
    url.pathname.startsWith('/register')

  const hasSupabaseCookie = req.cookies.get('sb-access-token')

  if (!hasSupabaseCookie && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (hasSupabaseCookie && isAuthPage) {
    return NextResponse.redirect(new URL('/inbox', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|api).*)'],
}
