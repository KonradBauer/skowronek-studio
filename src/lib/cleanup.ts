import type { Payload } from 'payload'
import { readdir, rm, stat } from 'fs/promises'
import path from 'path'
import { EXPIRED_GRACE_DAYS, TMP_CLEANUP_CUTOFF_MS } from './constants'

interface CleanupResult {
  processed: number
  deleted: number
  filesRemoved: number
  errors: string[]
}

export async function cleanupExpiredClients(payload: Payload): Promise<CleanupResult> {
  const result: CleanupResult = {
    processed: 0,
    deleted: 0,
    filesRemoved: 0,
    errors: [],
  }

  // Delete clients only after 3-day grace period past expiration.
  // During grace period, login shows "account expired" message;
  // after that, the account is removed entirely.
  const graceCutoff = new Date()
  graceCutoff.setDate(graceCutoff.getDate() - EXPIRED_GRACE_DAYS)

  console.log(`[cleanup] Running at ${new Date().toISOString()}, grace cutoff: ${graceCutoff.toISOString()}`)

  const expiredClients = await payload.find({
    collection: 'clients',
    where: {
      expiresAt: { less_than: graceCutoff.toISOString() },
    },
    limit: 100,
    overrideAccess: true,
  })

  console.log(`[cleanup] Found ${expiredClients.docs.length} clients to delete`)
  result.processed = expiredClients.docs.length

  for (const client of expiredClients.docs) {
    const clientLabel = `${client.id} (${(client as { name?: string }).name ?? 'brak nazwy'}, expiresAt: ${(client as { expiresAt?: string }).expiresAt ?? 'brak'})`
    try {
      // Count files before deletion (for reporting)
      const { totalDocs } = await payload.count({
        collection: 'client-files',
        where: { client: { equals: client.id } },
        overrideAccess: true,
      })
      result.filesRemoved += totalDocs

      console.log(`[cleanup] Deleting client ${clientLabel} with ${totalDocs} files`)

      // Delete client entirely - beforeDelete hook cascades to files first
      await payload.delete({
        collection: 'clients',
        id: client.id,
        overrideAccess: true,
      })

      console.log(`[cleanup] Deleted client ${clientLabel}`)
      result.deleted++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[cleanup] Failed to delete client ${clientLabel}: ${msg}`)
      result.errors.push(`Client ${clientLabel}: ${msg}`)
    }
  }

  // Cleanup orphaned tmp directories (older than 1 hour)
  try {
    const tmpBase = path.resolve('uploads', 'tmp')
    const dirs = await readdir(tmpBase).catch(() => [] as string[])
    const cutoff = Date.now() - TMP_CLEANUP_CUTOFF_MS
    for (const dir of dirs) {
      try {
        const dirPath = path.join(tmpBase, dir)
        const dirStat = await stat(dirPath)
        if (dirStat.mtimeMs < cutoff) {
          await rm(dirPath, { recursive: true, force: true })
        }
      } catch (err) { console.error('tmp dir cleanup:', err) }
    }
  } catch (err) { console.error('tmp cleanup scan:', err) }

  return result
}
