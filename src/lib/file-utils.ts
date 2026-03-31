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
