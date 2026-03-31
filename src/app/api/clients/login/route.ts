import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/** Days after expiration during which we show "account expired" instead of generic error */
const EXPIRED_GRACE_DAYS = 3

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

  // Check if account exists and whether it's expired BEFORE attempting login
  const existing = await payload.find({
    collection: 'clients',
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  })

  if (existing.docs.length > 0) {
    const client = existing.docs[0] as unknown as { expiresAt?: string }
    if (client.expiresAt) {
      const expiresAt = new Date(client.expiresAt)
      const now = new Date()

      if (expiresAt < now) {
        const daysSinceExpiry = (now.getTime() - expiresAt.getTime()) / (1000 * 60 * 60 * 24)

        if (daysSinceExpiry <= EXPIRED_GRACE_DAYS) {
          return NextResponse.json(
            {
              error: 'Twoje konto wygasło. Skontaktuj się ze studiem, jeśli potrzebujesz przedłużenia.',
              code: 'ACCOUNT_EXPIRED',
            },
            { status: 403 },
          )
        }

        // Past grace period — generic error as if account doesn't exist
        return NextResponse.json(
          { error: 'Nieprawidlowy email lub haslo' },
          { status: 401 },
        )
      }
    }
  }

  // Account is active — proceed with login
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
