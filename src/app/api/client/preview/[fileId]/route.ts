import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import path from 'path'
import { access, stat, readFile, writeFile, mkdir, readdir, unlink } from 'fs/promises'
import { createReadStream } from 'fs'
import { Readable } from 'stream'
import sharp from 'sharp'

const CACHE_DIR = path.resolve('uploads', 'client-files', '.cache')
const CACHE_MAX_AGE_MS = 60 * 60 * 1000 // 1 hour

// Cleanup expired cache files — runs at most once per 10 minutes
let lastCleanup = 0
async function cleanupCache() {
  const now = Date.now()
  if (now - lastCleanup < 10 * 60 * 1000) return
  lastCleanup = now

  try {
    const files = await readdir(CACHE_DIR)
    await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(CACHE_DIR, file)
        try {
          const fileStat = await stat(filePath)
          if (now - fileStat.mtimeMs > CACHE_MAX_AGE_MS) {
            await unlink(filePath)
          }
        } catch {}
      }),
    )
  } catch {}
}

// Cached sharp resize — generates optimized version on first request, serves from disk after
async function getOrCreateOptimized(
  sourcePath: string,
  cachePath: string,
  maxSize: number,
  quality: number,
): Promise<Buffer> {
  // Serve from cache if fresh
  try {
    const fileStat = await stat(cachePath)
    if (Date.now() - fileStat.mtimeMs < CACHE_MAX_AGE_MS) {
      return await readFile(cachePath)
    }
  } catch {
    // Not cached yet
  }

  // Generate optimized version
  const source = await readFile(sourcePath)
  const optimized = await sharp(source)
    .resize(maxSize, maxSize, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer()

  // Cache to disk (fire and forget)
  mkdir(path.dirname(cachePath), { recursive: true })
    .then(() => writeFile(cachePath, optimized))
    .catch(() => {})

  // Trigger cleanup in background
  cleanupCache()

  return optimized
}

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
            'Cache-Control': 'private, max-age=86400, immutable',
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

  // Image with size parameter — serve optimized version via sharp
  if (isImage) {
    const size = req.nextUrl.searchParams.get('size')
    const base = path.basename(filename, path.extname(filename))
    const cacheDir = path.resolve('uploads', 'client-files', '.cache')

    if (size === 'thumbnail') {
      // 400px, JPEG quality 50 — small and fast for grid
      try {
        const buffer = await getOrCreateOptimized(fullPath, path.join(cacheDir, `${base}-thumb.jpg`), 400, 50)
        return new NextResponse(new Uint8Array(buffer), {
          headers: {
            'Content-Type': 'image/jpeg',
            'Content-Length': String(buffer.length),
            'Cache-Control': 'private, max-age=86400, immutable',
          },
        })
      } catch {
        return NextResponse.json({ error: 'File not found on disk' }, { status: 404 })
      }
    }

    if (size === 'medium') {
      // 1920px, JPEG quality 70 — good enough for lightbox viewing
      try {
        const buffer = await getOrCreateOptimized(fullPath, path.join(cacheDir, `${base}-medium.jpg`), 1920, 70)
        return new NextResponse(new Uint8Array(buffer), {
          headers: {
            'Content-Type': 'image/jpeg',
            'Content-Length': String(buffer.length),
            'Cache-Control': 'private, max-age=86400, immutable',
          },
        })
      } catch {
        return NextResponse.json({ error: 'File not found on disk' }, { status: 404 })
      }
    }

    // No size param — serve original full quality
    let fileStat
    try {
      fileStat = await stat(fullPath)
    } catch {
      return NextResponse.json({ error: 'File not found on disk' }, { status: 404 })
    }

    const nodeStream = createReadStream(fullPath)
    const webStream = Readable.toWeb(nodeStream) as ReadableStream

    return new NextResponse(webStream, {
      headers: {
        'Content-Type': mimeType,
        'Content-Length': String(fileStat.size),
        'Cache-Control': 'private, max-age=86400, immutable',
      },
    })
  }

  // Video streaming with range request support
  let fileStat
  try {
    fileStat = await stat(fullPath)
  } catch {
    return NextResponse.json({ error: 'File not found on disk' }, { status: 404 })
  }
  const fileSize = fileStat.size
  const rangeHeader = req.headers.get('range')

  if (rangeHeader) {
    const match = rangeHeader.match(/bytes=(\d+)-(\d*)/)
    if (!match) {
      return new NextResponse(null, { status: 416, headers: { 'Content-Range': `bytes */${fileSize}` } })
    }

    const start = parseInt(match[1], 10)
    const end = match[2] ? parseInt(match[2], 10) : Math.min(start + 5 * 1024 * 1024 - 1, fileSize - 1)
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
        'Cache-Control': 'private, max-age=86400, immutable',
      },
    })
  }

  // No range - return full file
  const buffer = await readFile(fullPath)

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': mimeType,
      'Content-Length': String(fileSize),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'private, max-age=86400, immutable',
    },
  })
}
