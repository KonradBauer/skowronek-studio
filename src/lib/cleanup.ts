import type { Payload } from 'payload'

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

  // Find expired active clients
  const expiredClients = await payload.find({
    collection: 'clients',
    where: {
      and: [
        { expiresAt: { less_than: new Date().toISOString() } },
        { isActive: { equals: true } },
      ],
    },
    limit: 100,
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
        })
        result.filesRemoved += files.docs.length
        hasMore = files.hasNextPage
        page++
      }

      // Delete client entirely - afterDelete hook cascades to files
      await payload.delete({
        collection: 'clients',
        id: client.id,
      })

      result.deleted++
    } catch (err) {
      result.errors.push(`Client ${client.id}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return result
}
