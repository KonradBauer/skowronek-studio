import { NextRequest, NextResponse } from 'next/server'
import { authenticateClient } from '@/lib/auth'
import { verifyFileOwnership, parseRangeHeader } from '@/lib/file-utils'
import { getS3Client, PRESIGNED_URL_EXPIRY } from '@/lib/s3'
import path from 'path'
import { stat, readFile, writeFile, mkdir, readdir, unlink } from 'fs/promises'
import { createReadStream } from 'fs'
import { Readable } from 'stream'
import sharp from 'sharp'

const CACHE_DIR = path.resolve('uploads', 'client-files', '.cache')
const CACHE_MAX_AGE_MS = 60 * 60 * 1000

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

async function getOrCreateOptimized(
  sourcePath: string,
  cachePath: string,
  maxSize: number,
  quality: number,
): Promise<Buffer> {
  try {
    const fileStat = await stat(cachePath)
    if (Date.now() - fileStat.mtimeMs < CACHE_MAX_AGE_MS) {
      return await readFile(cachePath)
    }
  } catch {}

  const source = await readFile(sourcePath)
  const optimized = await sharp(source)
    .resize(maxSize, maxSize, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer()

  mkdir(path.dirname(cachePath), { recursive: true })
    .then(() => writeFile(cachePath, optimized))
    .catch(console.error)

  cleanupCache()

  return optimized
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> },
) {
  const { fileId } = await params

  const auth = await authenticateClient(req)
  if (!auth.success) return auth.response
  const { user, payload } = auth.data

  const file = await payload.findByID({
    collection: 'client-files',
    id: fileId,
    select: { client: true, filename: true, mimeType: true },
  })

  if (!file) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fileDoc = file as any
  if (!verifyFileOwnership(fileDoc, user.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const filename = String(fileDoc.filename || '')
  const mimeType = String(fileDoc.mimeType || 'application/octet-stream')
  const isImage = mimeType.startsWith('image/')
  const isVideo = mimeType.startsWith('video/')

  if (!isImage && !isVideo) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
  }

  // S3 mode - redirect to presigned URL
  if (process.env.S3_BUCKET) {
    const { GetObjectCommand } = await import('@aws-sdk/client-s3')
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner')

    const url = await getSignedUrl(getS3Client(), new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: `client-files/${filename}`,
    }), { expiresIn: PRESIGNED_URL_EXPIRY })

    return NextResponse.redirect(url)
  }

  // Local mode
  const fullPath = path.resolve('uploads', 'client-files', filename)

  // Image with size parameter
  if (isImage) {
    const size = req.nextUrl.searchParams.get('size')
    const base = path.basename(filename, path.extname(filename))
    const cacheDir = path.resolve('uploads', 'client-files', '.cache')

    if (size === 'thumbnail') {
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

    // No size param — serve original
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
    const range = parseRangeHeader(rangeHeader, fileSize)
    if (!range) {
      return new NextResponse(null, { status: 416, headers: { 'Content-Range': `bytes */${fileSize}` } })
    }

    const { start, end } = range
    const nodeStream = createReadStream(fullPath, { start, end })
    const webStream = Readable.toWeb(nodeStream) as ReadableStream

    return new NextResponse(webStream, {
      status: 206,
      headers: {
        'Content-Type': mimeType,
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Content-Length': String(end - start + 1),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'private, max-age=86400, immutable',
      },
    })
  }

  // Stream video instead of buffering entire file into memory
  const nodeStream = createReadStream(fullPath)
  const webStream = Readable.toWeb(nodeStream) as ReadableStream

  return new NextResponse(webStream, {
    headers: {
      'Content-Type': mimeType,
      'Content-Length': String(fileSize),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'private, max-age=86400, immutable',
    },
  })
}
