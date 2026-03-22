import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { mkdir, readdir, stat, rm } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const payload = await getPayload({ config })

  // Verify admin auth
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

  const { clientId, filename, mimeType, totalSize, totalChunks } = await req.json()

  if (!clientId || !filename || !mimeType || !totalSize || !totalChunks) {
    return NextResponse.json({ error: 'Brak wymaganych pol' }, { status: 400 })
  }

  // Verify client exists
  const client = await payload.findByID({ collection: 'clients', id: clientId })
  if (!client) {
    return NextResponse.json({ error: 'Klient nie znaleziony' }, { status: 404 })
  }

  // Cleanup orphaned tmp directories older than 1 hour
  const tmpBase = path.resolve('uploads', 'tmp')
  try {
    const dirs = await readdir(tmpBase)
    const cutoff = Date.now() - 60 * 60 * 1000
    for (const dir of dirs) {
      try {
        const dirStat = await stat(path.join(tmpBase, dir))
        if (dirStat.mtimeMs < cutoff) {
          rm(path.join(tmpBase, dir), { recursive: true, force: true }).catch(() => {})
        }
      } catch { /* ignore */ }
    }
  } catch { /* tmp dir may not exist yet */ }

  // Generate unique upload ID
  const uploadId = crypto.randomUUID()

  // Create temp directory for chunks
  const tmpDir = path.resolve('uploads', 'tmp', uploadId)
  await mkdir(tmpDir, { recursive: true })

  return NextResponse.json({
    uploadId,
    chunkSize: 10 * 1024 * 1024, // 10MB
  })
}
