import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import path from 'path'
import { access } from 'fs/promises'
import { createReadStream } from 'fs'
import { Readable } from 'stream'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> },
) {
  const { fileId } = await params
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

  const file = await payload.findByID({
    collection: 'client-files',
    id: fileId,
  })

  if (!file) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fileDoc = file as any
  const fileClientId = typeof fileDoc.client === 'object' ? Number(fileDoc.client.id) : Number(fileDoc.client)
  if (fileClientId !== Number(clientUser.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (clientUser.expiresAt && new Date(clientUser.expiresAt) < new Date()) {
    return NextResponse.json({ error: 'Account expired' }, { status: 403 })
  }

  const filename = String(fileDoc.filename || '')
  const mimeType = String(fileDoc.mimeType || 'application/octet-stream')

  if (!mimeType.startsWith('image/')) {
    return NextResponse.json({ error: 'Not an image' }, { status: 400 })
  }

  if (process.env.S3_BUCKET) {
    const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3')
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner')

    const s3 = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION || 'auto',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      },
      forcePathStyle: true,
    })

    const url = await getSignedUrl(s3, new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: `client-files/${filename}`,
    }), { expiresIn: 3600 })

    return NextResponse.redirect(url)
  }

  // Local mode - try thumbnail first (faster for grid), fallback to full image
  const wantsThumbnail = req.nextUrl.searchParams.get('size') === 'thumbnail'
  const ext = path.extname(filename)
  const base = path.basename(filename, ext)
  const thumbnailName = `${base}-400x400${ext}`
  const thumbnailPath = path.resolve('uploads', 'client-files', thumbnailName)
  const fullPath = path.resolve('uploads', 'client-files', filename)

  let filePath = fullPath
  if (wantsThumbnail) {
    try {
      await access(thumbnailPath)
      filePath = thumbnailPath
    } catch {
      // Thumbnail doesn't exist, serve full image
    }
  }

  try {
    await access(filePath)
  } catch {
    return NextResponse.json({ error: 'File not found on disk' }, { status: 404 })
  }

  const nodeStream = createReadStream(filePath)
  const webStream = Readable.toWeb(nodeStream) as ReadableStream

  return new NextResponse(webStream, {
    headers: {
      'Content-Type': mimeType,
      'Cache-Control': 'private, max-age=86400',
    },
  })
}
