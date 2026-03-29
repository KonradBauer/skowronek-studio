import { NextRequest, NextResponse } from 'next/server'
import { authenticateClient } from '@/lib/auth'
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
  })

  if (filesResult.docs.length === 0) {
    return NextResponse.json({ error: 'Brak plikow' }, { status: 404 })
  }

  const zipName = category === 'video' ? 'Film.zip' : category === 'photo' ? 'Zdjecia.zip' : 'Pliki.zip'

  // Generate ZIP on-the-fly and stream to client
  const archive = archiver('zip', { zlib: { level: 0 } }) // level 0 = store only (photos/videos already compressed)
  const passThrough = new PassThrough()
  archive.pipe(passThrough)

  for (const doc of filesResult.docs) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fileDoc = doc as any
    const filename = String(fileDoc.filename || '')
    if (!filename) continue

    const entryName = String(fileDoc.displayName || fileDoc.filename || 'plik')

    if (process.env.S3_BUCKET) {
      const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3')
      const s3 = new S3Client({
        endpoint: process.env.S3_ENDPOINT,
        region: process.env.S3_REGION || 'auto',
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
        forcePathStyle: true,
      })
      const response = await s3.send(new GetObjectCommand({
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
