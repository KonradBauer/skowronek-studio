import path from 'path'
import { createReadStream, createWriteStream } from 'fs'
import { mkdir, stat, unlink, access } from 'fs/promises'
import archiver from 'archiver'
import { getPayload } from 'payload'
import config from '@payload-config'

const ZIPS_DIR = path.resolve('uploads', 'zips')

/**
 * Generate a pre-built ZIP for a client's files by category.
 * Runs in the background after upload completes.
 */
export async function generateClientZip(
  clientId: number | string,
  category: 'photo' | 'video' | 'all',
): Promise<void> {
  const payload = await getPayload({ config })

  try {
    await mkdir(ZIPS_DIR, { recursive: true })

    // Find or create ZipCache entry
    const existing = await payload.find({
      collection: 'zip-cache',
      where: {
        client: { equals: Number(clientId) },
        category: { equals: category },
      },
      limit: 1,
    })

    let cacheDocId: number | string
    if (existing.docs.length > 0) {
      cacheDocId = existing.docs[0].id
      await payload.update({
        collection: 'zip-cache',
        id: cacheDocId,
        data: { status: 'generating', error: '' },
      })
    } else {
      const doc = await payload.create({
        collection: 'zip-cache',
        data: {
          client: Number(clientId),
          category,
          status: 'generating',
        },
      })
      cacheDocId = doc.id
    }

    // Fetch files
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {
      client: { equals: Number(clientId) },
    }
    if (category !== 'all') {
      whereClause.category = { equals: category }
    }

    const filesResult = await payload.find({
      collection: 'client-files',
      where: whereClause,
      limit: 2000,
    })

    if (filesResult.docs.length === 0) {
      await payload.delete({ collection: 'zip-cache', id: cacheDocId })
      return
    }

    const zipFilename = `zip-${clientId}-${category}-${Date.now()}.zip`
    const zipPath = path.join(ZIPS_DIR, zipFilename)

    // Create ZIP
    const output = createWriteStream(zipPath)
    const archive = archiver('zip', { zlib: { level: 1 } })

    const finishPromise = new Promise<void>((resolve, reject) => {
      output.on('close', resolve)
      archive.on('error', reject)
    })

    archive.pipe(output)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const doc of filesResult.docs as any[]) {
      const filename = String(doc.filename || '')
      if (!filename) continue

      const filePath = path.resolve('uploads', 'client-files', filename)
      try {
        await access(filePath)
        archive.append(createReadStream(filePath), {
          name: doc.displayName || filename,
        })
      } catch {
        // Skip missing files
      }
    }

    await archive.finalize()
    await finishPromise

    const zipStat = await stat(zipPath)

    // Delete old ZIP file if exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const oldFilename = (existing.docs[0] as any)?.zipFilename
    if (oldFilename && oldFilename !== zipFilename) {
      try {
        await unlink(path.join(ZIPS_DIR, oldFilename))
      } catch {
        // ignore
      }
    }

    await payload.update({
      collection: 'zip-cache',
      id: cacheDocId,
      data: {
        status: 'ready',
        zipFilename,
        filesize: zipStat.size,
        fileCount: filesResult.docs.length,
        generatedAt: new Date().toISOString(),
      },
    })

    console.log(`ZIP generated: ${zipFilename} (${filesResult.docs.length} files)`)
  } catch (err) {
    console.error(`Failed to generate ZIP for client ${clientId}, category ${category}:`, err)
  }
}

/**
 * Invalidate cached ZIPs for a client when files change.
 */
export async function invalidateZipCache(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any,
  clientId: number | string,
  category: string,
): Promise<void> {
  try {
    // Delete cache for specific category and 'all'
    const categoriesToInvalidate = [category, 'all']

    for (const cat of categoriesToInvalidate) {
      const cached = await payload.find({
        collection: 'zip-cache',
        where: {
          client: { equals: Number(clientId) },
          category: { equals: cat },
        },
        limit: 10,
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const doc of cached.docs as any[]) {
        // Delete physical ZIP file
        if (doc.zipFilename) {
          try {
            await unlink(path.join(ZIPS_DIR, doc.zipFilename))
          } catch {
            // ignore
          }
        }
        await payload.delete({ collection: 'zip-cache', id: doc.id })
      }
    }
  } catch (err) {
    console.error('Failed to invalidate ZIP cache:', err)
  }
}
