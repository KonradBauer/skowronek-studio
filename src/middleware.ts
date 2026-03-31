import { NextRequest, NextResponse } from 'next/server'

const SEVEN_DAYS = 60 * 60 * 24 * 7

/** Decode JWT payload without verification (signature is checked later by payload.auth) */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(payload)
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isSecure =
    request.nextUrl.protocol === 'https:' ||
    request.headers.get('x-forwarded-proto') === 'https'

  // Already logged in — skip login page, go straight to dashboard
  if (pathname === '/login') {
    const token = request.cookies.get('client-token')?.value
    if (token) {
      // Check if account expired before redirecting to dashboard
      const payload = decodeJwtPayload(token)
      const expiresAt = payload?.expiresAt as string | undefined
      if (expiresAt && new Date(expiresAt) < new Date()) {
        // Expired — clear cookie and show login page
        const response = NextResponse.next()
        response.cookies.delete('client-token')
        return response
      }
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  // Client panel pages — redirect to login if no token, refresh cookie if present
  if (pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('client-token')?.value
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check if account expired
    const payload = decodeJwtPayload(token)
    const expiresAt = payload?.expiresAt as string | undefined
    if (expiresAt && new Date(expiresAt) < new Date()) {
      // Expired — clear cookie and redirect to login
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('client-token')
      return response
    }

    const response = NextResponse.next()
    response.cookies.set('client-token', token, {
      httpOnly: true,
      secure: isSecure,
      path: '/',
      sameSite: 'lax',
      maxAge: SEVEN_DAYS,
    })
    return response
  }

  // Client API routes — 401 without token
  if (pathname.startsWith('/api/client/')) {
    const token = request.cookies.get('client-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.next()
  }

  // Admin upload routes — 401 without payload token
  if (pathname.startsWith('/api/upload/')) {
    const token = request.cookies.get('payload-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/login', '/dashboard/:path*', '/api/client/:path*', '/api/upload/:path*'],
}
