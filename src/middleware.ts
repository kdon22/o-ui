import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Protect authenticated sections and redirect unauthenticated users to /login
export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl

  // Allow public and API assets through
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/public') ||
    pathname.startsWith('/favicon') ||
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/devices') ||
    pathname.includes('/auth/')
  ) {
    return NextResponse.next()
  }

  // Check auth token for protected routes
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) {
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = '/login'
    const callback = pathname + (search || '')
    if (callback && callback !== '/') {
      loginUrl.searchParams.set('callbackUrl', callback)
    }
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

// Limit middleware to authenticated app sections
export const config = {
  matcher: [
    '/nodes/:path*',
    '/rules/:path*',
    '/classes/:path*',
    '/prompt/execute/:path*',
    '/marketplace/:path*',
    '/test-parser',
    '/test-typescript-completion',
  ],
}


