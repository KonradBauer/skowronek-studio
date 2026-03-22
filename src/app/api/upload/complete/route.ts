import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { readdir, rm, readFile, mkdir } from 'fs/promises'
import { createWriteStream, createReadStream } from 'fs'
import path from 'path'
import { pipeline } from 'stream/promises'
import crypto from 'crypto'
import { generateVideoThumbnailForDoc } from '@/lib/video-thumbnail'
import { generateClientZip } from '@/lib/zip-generator'
import { transcodeToHLS } from '@/lib/hls-transcoder'

// Max file size to read into Buffer for Payload (1GB)
const MAX_BUFFER_SIZE = 1024 * 1024 * 1024

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

  const { uploadId, clientId, filename, mimeType, category } = await req.json()

  if (!uploadId || !clientId || !filename || !mimeType) {
    return NextResponse.json({ error: 'Brak wymaganych pol' }, { status: 400 })
  }

  const tmpDir = path.resolve('uploads', 'tmp', uploadId)

  try {
    // Read chunk files sorted by name
    const chunkFiles = (await readdir(tmpDir)).filter((f) => f.startsWith('chunk-')).sort()

    if (chunkFiles.length === 0) {
      return NextResponse.json({ error: 'Brak chunkow' }, { status: 400 })
    }

    // Generate unique filename to prevent collisions
    const ext = path.extname(filename)
    const baseName = path.basename(filename, ext)
    const uniqueName = `${baseName}-${crypto.randomUUID().slice(0, 8)}${ext}`

    // Assemble chunks by reading into buffers and concatenating
    const chunkBuffers: Buffer[] = []
    let totalSize = 0

    for (const chunkFile of chunkFiles) {
      const chunkPath = path.join(tmpDir, chunkFile)
      const buf = await readFile(chunkPath)
      chunkBuffers.push(buf)
      totalSize += buf.length
    }

    if (totalSize <= MAX_BUFFER_SIZE) {
      // Small/medium files (<=1GB): pass buffer directly to Payload
      const fileBuffer = Buffer.concat(chunkBuffers)

      const doc = await payload.create({
        collection: 'client-files',
        data: { client: Number(clientId), category: category || (mimeType.startsWith('video/') ? 'video' : 'photo') },
        file: {
          data: fileBuffer,
          name: uniqueName,
          mimetype: mimeType,
          size: totalSize,
        },
      })

      // Cleanup tmp directory
      await rm(tmpDir, { recursive: true, force: true })

      // Fire-and-forget: background tasks
      if (mimeType.startsWith('video/')) {
        generateVideoThumbnailForDoc(doc.id, uniqueName).catch(console.error)
        transcodeToHLS(doc.id, uniqueName).catch(console.error)
      }
      const fileCategory = category || (mimeType.startsWith('video/') ? 'video' : 'photo')
      generateClientZip(Number(clientId), fileCategory).catch(console.error)

      return NextResponse.json({
        success: true,
        fileId: doc.id,
        filename: uniqueName,
        size: totalSize,
      })
    }

    // Large files (>1GB): write assembled file to disk first, then stream to final location
    const assembledPath = path.join(tmpDir, 'assembled')
    const writeStream = createWriteStream(assembledPath)

    for (const buf of chunkBuffers) {
      const canContinue = writeStream.write(buf)
      if (!canContinue) {
        await new Promise<void>((resolve) => writeStream.once('drain', resolve))
      }
    }
    // Free chunk buffers from memory
    chunkBuffers.length = 0

    await new Promise<void>((resolve, reject) => {
      writeStream.end(() => resolve())
      writeStream.on('error', reject)
    })

    // Move assembled file to upload dir
    const uploadDir = path.resolve('uploads', 'client-files')
    await mkdir(uploadDir, { recursive: true })
    const destPath = path.join(uploadDir, uniqueName)
    await pipeline(createReadStream(assembledPath), createWriteStream(destPath))

    // Create Payload document with file metadata
    const doc = await payload.create({
      collection: 'client-files',
      data: {
        client: clientId,
        filename: uniqueName,
        mimeType: mimeType,
        filesize: totalSize,
      },
      file: {
        data: Buffer.alloc(0),
        name: uniqueName,
        mimetype: mimeType,
        size: totalSize,
      },
    })

    // Cleanup tmp directory
    await rm(tmpDir, { recursive: true, force: true })

    // Fire-and-forget: generate video thumbnail
    if (mimeType.startsWith('video/')) {
      generateVideoThumbnailForDoc(doc.id, uniqueName).catch(console.error)
    }

    return NextResponse.json({
      success: true,
      fileId: doc.id,
      filename: uniqueName,
      size: totalSize,
    })
  } catch (err) {
    console.error('Upload completion error:', err)

    // Cleanup on error
    await rm(tmpDir, { recursive: true, force: true }).catch(() => {})

    return NextResponse.json(
      { error: `Blad podczas skladania pliku: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    )
  }
}
