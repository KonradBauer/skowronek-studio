import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/auth'
import { writeFile, access } from 'fs/promises'
import path from 'path'

export async function POST(req: NextRequest) {
  const auth = await authenticateAdmin(req)
  if (!auth.success) return auth.response

  const uploadId = req.nextUrl.searchParams.get('uploadId')
  const chunkIndex = Number(req.nextUrl.searchParams.get('chunkIndex'))

  if (!uploadId || isNaN(chunkIndex) || chunkIndex < 0) {
    return NextResponse.json({ error: 'Brak wymaganych pol' }, { status: 400 })
  }

  if (!/^[0-9a-f-]{36}$/i.test(uploadId)) {
    return NextResponse.json({ error: 'Nieprawidlowy uploadId' }, { status: 400 })
  }

  // Verify tmp directory exists (validates uploadId)
  const tmpDir = path.resolve('uploads', 'tmp', uploadId)
  try {
    await access(tmpDir)
  } catch {
    return NextResponse.json({ error: 'Nieprawidlowy uploadId' }, { status: 400 })
  }

  try {
    // Read raw binary body — no FormData parsing, no size limits
    const buffer = Buffer.from(await req.arrayBuffer())
    const chunkPath = path.join(tmpDir, `chunk-${String(chunkIndex).padStart(6, '0')}`)
    await writeFile(chunkPath, buffer)

    return NextResponse.json({ received: chunkIndex })
  } catch (err) {
    console.error('Chunk upload error:', err)
    return NextResponse.json(
      { error: `Blad zapisu chunka: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    )
  }
}
