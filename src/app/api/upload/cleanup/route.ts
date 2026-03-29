import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/auth'
import { rm, access } from 'fs/promises'
import path from 'path'

export async function POST(req: NextRequest) {
  const auth = await authenticateAdmin(req)
  if (!auth.success) return auth.response

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
