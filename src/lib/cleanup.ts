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

  const expiredClients = await payload.find({
    collection: 'clients',
    where: {
      and: [
        { expiresAt: { less_than: graceCutoff.toISOString() } },
        { isActive: { equals: true } },
      ],
    },
    limit: 100,
    overrideAccess: true,
  })

  result.processed = expiredClients.docs.length

  for (const client of expiredClients.docs) {
    try {
      // Count files before deletion (for reporting)
      let page = 1
      let hasMore = true
      while (hasMore) {
        const files = await payload.find({
          collection: 'client-files',
          where: { client: { equals: client.id } },
          limit: 100,
          page,
          overrideAccess: true,
        })
        result.filesRemoved += files.docs.length
        hasMore = files.hasNextPage
        page++
      }

      // Delete client entirely - beforeDelete hook cascades to files first
      await payload.delete({
        collection: 'clients',
        id: client.id,
        overrideAccess: true,
      })

      result.deleted++
    } catch (err) {
      result.errors.push(`Client ${client.id}: ${err instanceof Error ? err.message : String(err)}`)
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
