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
      // Find and delete client files (S3 cleanup happens via Payload's storage adapter)
      const files = await payload.find({
        collection: 'client-files',
        where: { client: { equals: client.id } },
        limit: 1000,
      })

      for (const file of files.docs) {
        await payload.delete({
          collection: 'client-files',
          id: file.id,
        })
        result.filesRemoved++
      }

      // Deactivate client
      await payload.update({
        collection: 'clients',
        id: client.id,
        data: { isActive: false },
      })

      result.deleted++
    } catch (err) {
      result.errors.push(`Client ${client.id}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return result
}
