import { NextRequest, NextResponse } from 'next/server'
import { authenticateClient } from '@/lib/auth'
import { verifyFileOwnership, parseRangeHeader } from '@/lib/file-utils'
import path from 'path'
import { access, readFile, stat } from 'fs/promises'
import { createReadStream } from 'fs'
import { Readable } from 'stream'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const segments = (await params).path
  if (!segments || segments.length < 2) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }

  const auth = await authenticateClient(req)
  if (!auth.success) return auth.response
  const { user, payload } = auth.data

  const docId = segments[0]
  const restPath = segments.slice(1).join('/')

  // Verify ownership
  try {
    const file = await payload.findByID({
      collection: 'client-files',
      id: docId,
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fileDoc = file as any
    if (!verifyFileOwnership(fileDoc, user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (fileDoc.hlsStatus !== 'ready') {
      return NextResponse.json({ error: 'HLS not available' }, { status: 404 })
    }
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const filePath = path.resolve('uploads', 'hls', docId, restPath)

  try {
    await access(filePath)
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  let contentType = 'application/octet-stream'
  if (restPath.endsWith('.m3u8')) contentType = 'application/vnd.apple.mpegurl'
  else if (restPath.endsWith('.ts')) contentType = 'video/mp2t'

  // .m3u8 manifests — small, serve as buffer
  if (restPath.endsWith('.m3u8')) {
    const buffer = await readFile(filePath)
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
      },
    })
  }

  // .ts segments — stream with range support
  const fileStat = await stat(filePath)
  const fileSize = fileStat.size
  const rangeHeader = req.headers.get('range')

  if (rangeHeader) {
    const range = parseRangeHeader(rangeHeader, fileSize, fileSize)
    if (!range) {
      return new NextResponse(null, { status: 416, headers: { 'Content-Range': `bytes */${fileSize}` } })
    }

    const { start, end } = range
    const nodeStream = createReadStream(filePath, { start, end })
    const webStream = Readable.toWeb(nodeStream) as ReadableStream

    return new NextResponse(webStream, {
      status: 206,
      headers: {
        'Content-Type': contentType,
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Content-Length': String(end - start + 1),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'private, max-age=86400',
      },
    })
  }

  const buffer = await readFile(filePath)
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(fileSize),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'private, max-age=86400',
    },
  })
}
