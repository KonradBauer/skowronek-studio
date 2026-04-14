import { NextRequest, NextResponse } from 'next/server'
import { TOKEN_MAX_AGE } from '@/lib/constants'

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

/** Returns true if the token is expired or invalid (checks both JWT exp and custom expiresAt) */
function isTokenStale(token: string): boolean {
  const payload = decodeJwtPayload(token)
  if (!payload) return true

  // Standard JWT exp claim (Payload sets this, value is Unix seconds)
  const exp = payload.exp as number | undefined
  if (exp && exp * 1000 < Date.now()) return true

  // Custom account expiry field (saveToJWT: true on the Clients collection)
  const expiresAt = payload.expiresAt as string | undefined
  if (expiresAt && new Date(expiresAt) < new Date()) return true

  return false
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isSecure =
    request.nextUrl.protocol === 'https:' ||
    request.headers.get('x-forwarded-proto') === 'https'

  // Trailing slash normalization — /login/ → /login, /dashboard/ → /dashboard
  if (pathname !== '/' && pathname.endsWith('/')) {
    const url = request.nextUrl.clone()
    url.pathname = pathname.slice(0, -1)
    return NextResponse.redirect(url, { status: 308 })
  }

  // X-Robots-Tag: noindex for admin panel
  if (pathname.startsWith('/admin')) {
    const response = NextResponse.next()
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
    return response
  }

  // Already logged in — skip login page, go straight to dashboard
  if (pathname === '/login') {
    const token = request.cookies.get('client-token')?.value
    if (token) {
      if (isTokenStale(token)) {
        // Expired or invalid — clear cookie and show login page
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

    // Check if token is stale (JWT exp or account expiresAt)
    if (isTokenStale(token)) {
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
      maxAge: TOKEN_MAX_AGE,
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
  matcher: [
    '/login/:path*',
    '/dashboard/:path*',
    '/api/client/:path*',
    '/api/upload/:path*',
    '/admin/:path*',
  ],
}
