import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { writeFile, access } from 'fs/promises'
import path from 'path'

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

  const formData = await req.formData()
  const uploadId = formData.get('uploadId') as string
  const chunkIndex = Number(formData.get('chunkIndex'))
  const chunk = formData.get('chunk') as File

  if (!uploadId || chunkIndex === undefined || !chunk) {
    return NextResponse.json({ error: 'Brak wymaganych pol' }, { status: 400 })
  }

  // Verify tmp directory exists (validates uploadId)
  const tmpDir = path.resolve('uploads', 'tmp', uploadId)
  try {
    await access(tmpDir)
  } catch {
    return NextResponse.json({ error: 'Nieprawidlowy uploadId' }, { status: 400 })
  }

  // Write chunk to disk
  const buffer = Buffer.from(await chunk.arrayBuffer())
  const chunkPath = path.join(tmpDir, `chunk-${String(chunkIndex).padStart(6, '0')}`)
  await writeFile(chunkPath, buffer)

  return NextResponse.json({ received: chunkIndex })
}
