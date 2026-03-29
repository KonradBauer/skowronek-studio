import { NextRequest, NextResponse } from 'next/server'

const SEVEN_DAYS = 60 * 60 * 24 * 7

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isSecure =
    request.nextUrl.protocol === 'https:' ||
    request.headers.get('x-forwarded-proto') === 'https'

  // Client panel pages — redirect to login if no token, refresh cookie if present
  if (pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('client-token')?.value
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
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
  matcher: ['/dashboard/:path*', '/api/client/:path*', '/api/upload/:path*'],
}
