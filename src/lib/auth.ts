import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

type AuthenticatedClient = {
  user: { id: number; collection: string; expiresAt?: string }
  payload: Awaited<ReturnType<typeof getPayload>>
}

type AuthResult =
  | { success: true; data: AuthenticatedClient }
  | { success: false; response: NextResponse }

/**
 * Authenticates a client request via cookie token.
 * Returns the validated user + payload instance, or a ready-to-return error response.
 * Clears the cookie when the account has expired so the user can re-login.
 *
 * Usage:
 *   const auth = await authenticateClient(req)
 *   if (!auth.success) return auth.response
 *   const { user, payload } = auth.data
 */
export async function authenticateClient(req: NextRequest): Promise<AuthResult> {
  const payload = await getPayload({ config })

  const token = req.cookies.get('client-token')?.value
  if (!token) {
    return { success: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const { user } = await payload.auth({
    headers: new Headers({ Authorization: `JWT ${token}` }),
  })

  if (!user) {
    return { success: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const clientUser = user as unknown as { id: number; collection?: string; expiresAt?: string }

  if (clientUser.collection !== 'clients') {
    return { success: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  if (clientUser.expiresAt && new Date(clientUser.expiresAt) < new Date()) {
    const response = NextResponse.json({ error: 'Account expired' }, { status: 401 })
    response.cookies.delete('client-token')
    return { success: false, response }
  }

  return {
    success: true,
    data: {
      user: { id: clientUser.id, collection: clientUser.collection!, expiresAt: clientUser.expiresAt },
      payload,
    },
  }
}

/**
 * Authenticates an admin request via payload-token cookie.
 */
export async function authenticateAdmin(req: NextRequest): Promise<AuthResult> {
  const payload = await getPayload({ config })

  const token = req.cookies.get('payload-token')?.value
  if (!token) {
    return { success: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const { user } = await payload.auth({
    headers: new Headers({ Authorization: `JWT ${token}` }),
  })

  if (!user || (user as unknown as { collection?: string }).collection !== 'users') {
    return { success: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return {
    success: true,
    data: {
      user: user as unknown as { id: number; collection: string; expiresAt?: string },
      payload,
    },
  }
}
