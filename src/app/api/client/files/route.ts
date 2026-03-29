import { NextRequest, NextResponse } from 'next/server'
import { authenticateClient } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const auth = await authenticateClient(req)
  if (!auth.success) return auth.response
  const { user, payload } = auth.data

  const { searchParams } = req.nextUrl
  const category = searchParams.get('category') || 'photo'
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '30', 10)))

  const result = await payload.find({
    collection: 'client-files',
    where: {
      client: { equals: Number(user.id) },
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
