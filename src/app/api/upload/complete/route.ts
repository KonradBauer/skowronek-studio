import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/auth'
import { readdir, rm, readFile, mkdir, stat } from 'fs/promises'
import { createWriteStream, createReadStream } from 'fs'
import path from 'path'
import { pipeline } from 'stream/promises'
import crypto from 'crypto'
import { generateVideoThumbnailForDoc } from '@/lib/video-thumbnail'
import { transcodeToHLS } from '@/lib/hls-transcoder'

// Files up to 1.5 GB can be read into a Buffer and passed to Payload normally.
// Above this threshold we stream chunks straight to the staticDir and create
// the Payload document with metadata only (no file object), avoiding the ~2 GiB
// Node.js Buffer limit entirely. This supports files of any size (30 GB+).
import { UPLOAD_BUFFER_THRESHOLD } from '@/lib/constants'

// Allow up to 10 minutes for assembling very large files
export const maxDuration = 600

export async function POST(req: NextRequest) {
  const auth = await authenticateAdmin(req)
  if (!auth.success) return auth.response
  const { payload } = auth.data

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

    // Calculate total size from chunk stats (no memory needed)
    let totalSize = 0
    for (const chunkFile of chunkFiles) {
      const chunkStat = await stat(path.join(tmpDir, chunkFile))
      totalSize += chunkStat.size
    }

    const fileCategory = category || (mimeType.startsWith('video/') ? 'video' : 'photo')

    if (totalSize <= UPLOAD_BUFFER_THRESHOLD) {
      // ── Small/medium files: read into buffer, let Payload handle everything ──
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

    // ── Large files: stream to staticDir, create doc with metadata only ──
    const staticDir = path.resolve('uploads', 'client-files')
    await mkdir(staticDir, { recursive: true })
    const destPath = path.join(staticDir, uniqueName)

    const writeStream = createWriteStream(destPath)
    for (const chunkFile of chunkFiles) {
      await pipeline(createReadStream(path.join(tmpDir, chunkFile)), writeStream, { end: false })
    }
    await new Promise<void>((resolve, reject) => {
      writeStream.end(() => resolve())
      writeStream.on('error', reject)
    })

    // Verify assembled file
    const finalStat = await stat(destPath)
    if (finalStat.size !== totalSize) {
      throw new Error(`Rozmiar pliku nie zgadza sie: oczekiwano ${totalSize}, otrzymano ${finalStat.size}`)
    }

    // Create Payload document with metadata — file is already on disk
    const doc = await payload.create({
      collection: 'client-files',
      data: {
        client: Number(clientId),
        category: fileCategory,
        filename: uniqueName,
        mimeType,
        filesize: totalSize,
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
