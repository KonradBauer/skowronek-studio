import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { readdir, rm, readFile, mkdir, stat } from 'fs/promises'
import { createWriteStream, createReadStream } from 'fs'
import path from 'path'
import { pipeline } from 'stream/promises'
import crypto from 'crypto'
import { generateVideoThumbnailForDoc } from '@/lib/video-thumbnail'
import { transcodeToHLS } from '@/lib/hls-transcoder'

// Max file size to read into Buffer for Payload (1GB)
const MAX_BUFFER_SIZE = 1024 * 1024 * 1024

// Allow up to 5 minutes for assembling large files
export const maxDuration = 300

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

    // Calculate total size from file stats (without loading into memory)
    let totalSize = 0
    for (const chunkFile of chunkFiles) {
      const chunkStat = await stat(path.join(tmpDir, chunkFile))
      totalSize += chunkStat.size
    }

    const fileCategory = category || (mimeType.startsWith('video/') ? 'video' : 'photo')

    if (totalSize <= MAX_BUFFER_SIZE) {
      // Small/medium files (<=1GB): read into buffer and pass to Payload
      const chunkBuffers: Buffer[] = []
      for (const chunkFile of chunkFiles) {
        chunkBuffers.push(await readFile(path.join(tmpDir, chunkFile)))
      }
      const fileBuffer = Buffer.concat(chunkBuffers)

      const doc = await payload.create({
        collection: 'client-files',
        data: { client: Number(clientId), category: fileCategory },
        file: {
          data: fileBuffer,
          name: uniqueName,
          mimetype: mimeType,
          size: totalSize,
        },
      })

      await rm(tmpDir, { recursive: true, force: true })

      if (mimeType.startsWith('video/')) {
        generateVideoThumbnailForDoc(doc.id, uniqueName).catch(console.error)
        transcodeToHLS(doc.id, uniqueName).catch(console.error)
      }

      return NextResponse.json({
        success: true,
        fileId: doc.id,
        filename: uniqueName,
        size: totalSize,
      })
    }

    // Large files (>1GB): assemble chunks to temp file, let Payload handle via filePath
    const assembledPath = path.join(tmpDir, uniqueName)
    const writeStream = createWriteStream(assembledPath)

    for (const chunkFile of chunkFiles) {
      const chunkPath = path.join(tmpDir, chunkFile)
      await pipeline(createReadStream(chunkPath), writeStream, { end: false })
    }

    await new Promise<void>((resolve, reject) => {
      writeStream.end(() => resolve())
      writeStream.on('error', reject)
    })

    // Use filePath so Payload reads the file, detects MIME, and writes it to staticDir
    const doc = await payload.create({
      collection: 'client-files',
      data: {
        client: Number(clientId),
        category: fileCategory,
      },
      filePath: assembledPath,
    })

    await rm(tmpDir, { recursive: true, force: true })

    const savedFilename = doc.filename || uniqueName

    if (mimeType.startsWith('video/')) {
      generateVideoThumbnailForDoc(doc.id, savedFilename).catch(console.error)
      transcodeToHLS(doc.id, savedFilename).catch(console.error)
    }

    return NextResponse.json({
      success: true,
      fileId: doc.id,
      filename: savedFilename,
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
