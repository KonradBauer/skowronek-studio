import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import archiver from 'archiver'
import path from 'path'
import { createReadStream } from 'fs'
import { access } from 'fs/promises'
import { PassThrough, Readable } from 'stream'

export async function POST(req: NextRequest) {
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

  const clientUser = user as unknown as { id: number; collection?: string; expiresAt?: string; name?: string }
  if (clientUser.collection !== 'clients') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (clientUser.expiresAt && new Date(clientUser.expiresAt) < new Date()) {
    return NextResponse.json({ error: 'Account expired' }, { status: 403 })
  }

  const { category } = await req.json() as { category: 'photo' | 'video' | 'all' }

  // Fetch all files for this client, filtered by category
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { client: { equals: Number(clientUser.id) } }
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

  // Create archive stream
  const archive = archiver('zip', { zlib: { level: 1 } }) // level 1 = fast compression (photos/videos are already compressed)
  const passThrough = new PassThrough()

  archive.pipe(passThrough)

  // Add files to archive
  for (const doc of filesResult.docs) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fileDoc = doc as any
    const filename = String(fileDoc.filename || '')
    if (!filename) continue

    const originalName = String(fileDoc.displayName || fileDoc.filename || 'plik')

    if (process.env.S3_BUCKET) {
      // S3 mode - fetch and pipe
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
        const bodyStream = response.Body as unknown as Readable
        archive.append(bodyStream, { name: originalName })
      }
    } else {
      // Local mode
      const filePath = path.resolve('uploads', 'client-files', filename)
      try {
        await access(filePath)
        archive.append(createReadStream(filePath), { name: originalName })
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
