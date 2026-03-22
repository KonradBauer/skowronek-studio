import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(req: NextRequest) {
  const payload = await getPayload({ config })

  const token = req.cookies.get('client-token')?.value
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { user } = await payload.auth({
    headers: new Headers({ Authorization: `JWT ${token}` }),
  })

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const clientUser = user as unknown as { id: number; collection?: string; expiresAt?: string }
  if (clientUser.collection !== 'clients') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (clientUser.expiresAt && new Date(clientUser.expiresAt) < new Date()) {
    return NextResponse.json({ error: 'Account expired' }, { status: 403 })
  }

  const { searchParams } = req.nextUrl
  const category = searchParams.get('category') || 'photo'
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '30', 10)))

  const result = await payload.find({
    collection: 'client-files',
    where: {
      client: { equals: Number(clientUser.id) },
      category: { equals: category },
    },
    limit,
    page,
    sort: 'filename',
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const docs = result.docs.map((doc: any) => ({
    id: String(doc.id),
    filename: String(doc.filename || ''),
    displayName: doc.displayName ? String(doc.displayName) : undefined,
    mimeType: String(doc.mimeType || 'application/octet-stream'),
    filesize: Number(doc.filesize || 0),
  }))

  return NextResponse.json({
    docs,
    totalDocs: result.totalDocs,
    totalPages: result.totalPages,
    page: result.page,
    hasNextPage: result.hasNextPage,
  })
}
