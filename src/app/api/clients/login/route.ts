import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

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

    // Set auth cookie
    const response = NextResponse.json({
      user: result.user,
      token: result.token,
    })

    response.cookies.set('client-token', result.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
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
