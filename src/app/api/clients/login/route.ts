import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

function isSecureRequest(req: NextRequest): boolean {
  if (req.nextUrl.protocol === 'https:') return true
  if (req.headers.get('x-forwarded-proto') === 'https') return true
  return false
}

export async function POST(req: NextRequest) {
  const payload = await getPayload({ config })

  let body: { email?: string; password?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Nieprawidlowe dane' }, { status: 400 })
  }

  const { email, password } = body

  if (!email || !password) {
    return NextResponse.json({ error: 'Email i haslo sa wymagane' }, { status: 400 })
  }

  try {
    const result = await payload.login({
      collection: 'clients',
      data: { email, password },
    })

    if (!result.token) {
      return NextResponse.json(
        { error: 'Blad serwera - brak tokenu' },
        { status: 500 },
      )
    }

    // Block login for expired accounts
    const user = result.user as { expiresAt?: string }
    if (user.expiresAt && new Date(user.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Twoje konto wygasło. Skontaktuj się ze studiem, jeśli potrzebujesz przedłużenia.', code: 'ACCOUNT_EXPIRED' },
        { status: 403 },
      )
    }

    const response = NextResponse.json({
      user: result.user,
      token: result.token,
    })

    response.cookies.set('client-token', result.token, {
      httpOnly: true,
      secure: isSecureRequest(req),
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch {
    return NextResponse.json(
      { error: 'Nieprawidlowy email lub haslo' },
      { status: 401 },
    )
  }
}
