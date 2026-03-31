import { NextRequest, NextResponse } from 'next/server'
import { authenticateClient } from '@/lib/auth'
import { getS3Client } from '@/lib/s3'
import archiver from 'archiver'
import path from 'path'
import { createReadStream } from 'fs'
import { access } from 'fs/promises'
import { PassThrough, Readable } from 'stream'

export const maxDuration = 600

export async function GET(req: NextRequest) {
  const auth = await authenticateClient(req)
  if (!auth.success) return auth.response
  const { user, payload } = auth.data

  const category = req.nextUrl.searchParams.get('category') as 'photo' | 'video' | 'all'
  if (!category || !['photo', 'video', 'all'].includes(category)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { client: { equals: Number(user.id) } }
  if (category !== 'all') {
    where.category = { equals: category }
  }

  const filesResult = await payload.find({
    collection: 'client-files',
    where,
    limit: 2000,
    sort: 'filename',
    select: { filename: true, displayName: true },
  })

  if (filesResult.docs.length === 0) {
    return NextResponse.json({ error: 'Brak plikow' }, { status: 404 })
  }

  const zipName = category === 'video' ? 'Film.zip' : category === 'photo' ? 'Zdjecia.zip' : 'Pliki.zip'

  const archive = archiver('zip', { zlib: { level: 0 } })
  const passThrough = new PassThrough()
  archive.pipe(passThrough)

  // Import S3 command once outside the loop (not on every iteration)
  const GetObjectCommand = process.env.S3_BUCKET
    ? (await import('@aws-sdk/client-s3')).GetObjectCommand
    : null

  for (const doc of filesResult.docs) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fileDoc = doc as any
    const filename = String(fileDoc.filename || '')
    if (!filename) continue

    const entryName = String(fileDoc.displayName || fileDoc.filename || 'plik')

    if (process.env.S3_BUCKET && GetObjectCommand) {
      const response = await getS3Client().send(new GetObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: `client-files/${filename}`,
      }))
      if (response.Body) {
        archive.append(response.Body as unknown as Readable, { name: entryName })
      }
    } else {
      const filePath = path.resolve('uploads', 'client-files', filename)
      try {
        await access(filePath)
        archive.append(createReadStream(filePath), { name: entryName })
      } catch {
        // Skip missing files
      }
    }
  }

  archive.finalize()

  const webStream = Readable.toWeb(passThrough) as ReadableStream

  return new NextResponse(webStream, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${zipName}"`,
    },
  })
}
