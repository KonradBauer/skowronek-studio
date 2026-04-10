import type { Readable } from 'stream'

/**
 * Safely converts a Node.js Readable stream to a Web ReadableStream.
 * Handles client disconnects gracefully — prevents ERR_INVALID_STATE crashes
 * that occur when the consumer closes the stream before the producer finishes.
 */
export function nodeStreamToWebStream(nodeStream: Readable): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      nodeStream.on('data', (chunk: Buffer) => {
        try {
          controller.enqueue(new Uint8Array(chunk))
        } catch {
          // Client disconnected — stop reading
          nodeStream.destroy()
        }
      })
      nodeStream.on('end', () => {
        try { controller.close() } catch {}
      })
      nodeStream.on('error', (err) => {
        try { controller.error(err) } catch {}
        nodeStream.destroy()
      })
    },
    cancel() {
      // Client aborted the request
      nodeStream.destroy()
    },
  })
}

/** Verify that a client-file document belongs to the given user */
export function verifyFileOwnership(
  fileDoc: { client: { id: number | string } | number | string },
  userId: number | string,
): boolean {
  const fileClientId = typeof fileDoc.client === 'object'
    ? Number((fileDoc.client as { id: number | string }).id)
    : Number(fileDoc.client)
  return fileClientId === Number(userId)
}

/** Parse HTTP Range header. Returns { start, end } or null if invalid. */
export function parseRangeHeader(
  rangeHeader: string,
  fileSize: number,
  defaultChunkSize = 5 * 1024 * 1024,
): { start: number; end: number } | null {
  const match = rangeHeader.match(/bytes=(\d+)-(\d*)/)
  if (!match) return null

  const start = parseInt(match[1], 10)
  const end = match[2]
    ? parseInt(match[2], 10)
    : Math.min(start + defaultChunkSize - 1, fileSize - 1)

  if (start >= fileSize || end >= fileSize || start > end) return null

  return { start, end }
}
