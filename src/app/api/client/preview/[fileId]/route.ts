import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import path from 'path'
import { access, stat, readFile } from 'fs/promises'
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
  const isImage = mimeType.startsWith('image/')
  const isVideo = mimeType.startsWith('video/')

  if (!isImage && !isVideo) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
  }

  // Video thumbnail request
  if (isVideo && req.nextUrl.searchParams.get('size') === 'thumbnail') {
    const thumbFilename = String(fileDoc.videoThumbnail || '')
    if (thumbFilename) {
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
          Key: `client-files/${thumbFilename}`,
        }), { expiresIn: 3600 })
        return NextResponse.redirect(url)
      }

      const thumbPath = path.resolve('uploads', 'client-files', thumbFilename)
      try {
        await access(thumbPath)
        const buffer = await readFile(thumbPath)
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'private, max-age=86400',
          },
        })
      } catch {
        // Thumbnail not found, return 404
      }
    }
    return new NextResponse(null, { status: 404 })
  }

  // S3 mode - redirect to presigned URL
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

  // Local mode
  const fullPath = path.resolve('uploads', 'client-files', filename)

  // For images, try thumbnail first
  if (isImage) {
    const wantsThumbnail = req.nextUrl.searchParams.get('size') === 'thumbnail'
    const ext = path.extname(filename)
    const base = path.basename(filename, ext)
    const thumbnailName = `${base}-400x400${ext}`
    const thumbnailPath = path.resolve('uploads', 'client-files', thumbnailName)

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

  // Video streaming with range request support
  try {
    await access(fullPath)
  } catch {
    return NextResponse.json({ error: 'File not found on disk' }, { status: 404 })
  }

  const fileStat = await stat(fullPath)
  const fileSize = fileStat.size
  const rangeHeader = req.headers.get('range')

  if (rangeHeader) {
    const match = rangeHeader.match(/bytes=(\d+)-(\d*)/)
    if (!match) {
      return new NextResponse(null, { status: 416, headers: { 'Content-Range': `bytes */${fileSize}` } })
    }

    const start = parseInt(match[1], 10)
    const end = match[2] ? parseInt(match[2], 10) : Math.min(start + 5 * 1024 * 1024 - 1, fileSize - 1) // 5MB chunks
    const chunkSize = end - start + 1

    const nodeStream = createReadStream(fullPath, { start, end })
    const webStream = Readable.toWeb(nodeStream) as ReadableStream

    return new NextResponse(webStream, {
      status: 206,
      headers: {
        'Content-Type': mimeType,
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Content-Length': String(chunkSize),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'private, max-age=86400',
      },
    })
  }

  // No range - return full file as buffer so Content-Length is preserved
  const buffer = await readFile(fullPath)

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': mimeType,
      'Content-Length': String(fileSize),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'private, max-age=86400',
    },
  })
}
