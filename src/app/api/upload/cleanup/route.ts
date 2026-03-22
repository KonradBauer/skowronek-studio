import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { rm, access } from 'fs/promises'
import path from 'path'

export async function POST(req: NextRequest) {
  const payload = await getPayload({ config })

  const token = req.cookies.get('payload-token')?.value
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { user } = await payload.auth({
    headers: new Headers({ Authorization: `JWT ${token}` }),
  })

  if (!user || user.collection !== 'users') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { uploadId } = await req.json()

  if (!uploadId || typeof uploadId !== 'string') {
    return NextResponse.json({ error: 'Brak uploadId' }, { status: 400 })
  }

  // Validate uploadId is a UUID to prevent path traversal
  if (!/^[0-9a-f-]{36}$/i.test(uploadId)) {
    return NextResponse.json({ error: 'Nieprawidlowy uploadId' }, { status: 400 })
  }

  const tmpDir = path.resolve('uploads', 'tmp', uploadId)

  try {
    await access(tmpDir)
    await rm(tmpDir, { recursive: true, force: true })
  } catch {
    // Already cleaned up or never existed
  }

  return NextResponse.json({ ok: true })
}
