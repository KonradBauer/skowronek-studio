import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { readdir, rm, stat, readFile } from 'fs/promises'
import { createWriteStream, createReadStream } from 'fs'
import path from 'path'
import { pipeline } from 'stream/promises'
import { PassThrough } from 'stream'
import crypto from 'crypto'

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

  const { uploadId, clientId, filename, mimeType } = await req.json()

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

    // Assemble chunks into final file via streaming (no memory limit)
    const assembledPath = path.join(tmpDir, 'assembled')
    const writeStream = createWriteStream(assembledPath)

    for (const chunkFile of chunkFiles) {
      const chunkPath = path.join(tmpDir, chunkFile)
      const readStream = createReadStream(chunkPath)
      await pipeline(readStream, new PassThrough(), writeStream, { end: false })
    }
    writeStream.end()
    await new Promise<void>((resolve, reject) => {
      writeStream.on('finish', resolve)
      writeStream.on('error', reject)
    })

    const fileStat = await stat(assembledPath)

    if (fileStat.size <= MAX_BUFFER_SIZE) {
      // Small/medium files: pass buffer to Payload (handles storage adapters correctly)
      const fileBuffer = await readFile(assembledPath)

      const doc = await payload.create({
        collection: 'client-files',
        data: { client: clientId },
        file: {
          data: fileBuffer,
          name: uniqueName,
          mimetype: mimeType,
          size: fileStat.size,
        },
      })

      // Cleanup tmp directory
      await rm(tmpDir, { recursive: true, force: true })

      return NextResponse.json({
        success: true,
        fileId: doc.id,
        filename: uniqueName,
        size: fileStat.size,
      })
    }

    // Large files (>1GB): move to upload dir directly, create document manually
    const uploadDir = path.resolve('uploads', 'client-files')
    const destPath = path.join(uploadDir, uniqueName)

    // Stream assembled file to final destination
    await pipeline(createReadStream(assembledPath), createWriteStream(destPath))

    // Create Payload document with file metadata
    // We use the REST-style approach: create doc then update with file info
    const doc = await payload.create({
      collection: 'client-files',
      data: {
        client: clientId,
        filename: uniqueName,
        mimeType: mimeType,
        filesize: fileStat.size,
      },
      file: {
        data: Buffer.alloc(0), // Empty buffer - file already on disk
        name: uniqueName,
        mimetype: mimeType,
        size: fileStat.size,
      },
    })

    // Cleanup tmp directory
    await rm(tmpDir, { recursive: true, force: true })

    return NextResponse.json({
      success: true,
      fileId: doc.id,
      filename: uniqueName,
      size: fileStat.size,
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
