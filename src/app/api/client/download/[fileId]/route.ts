import { NextRequest, NextResponse } from 'next/server'
import { authenticateClient } from '@/lib/auth'
import { verifyFileOwnership } from '@/lib/file-utils'
import { getS3Client, PRESIGNED_URL_EXPIRY } from '@/lib/s3'
import path from 'path'
import { access, stat } from 'fs/promises'
import { createReadStream } from 'fs'
import { Readable } from 'stream'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> },
) {
  const { fileId } = await params

  const auth = await authenticateClient(req)
  if (!auth.success) return auth.response
  const { user, payload } = auth.data

  const file = await payload.findByID({
    collection: 'client-files',
    id: fileId,
  })

  if (!file) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fileDoc = file as any
  if (!verifyFileOwnership(fileDoc, user.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const filename = String(fileDoc.filename || '')
  const mimeType = String(fileDoc.mimeType || 'application/octet-stream')

  // S3 mode - generate presigned URL
  if (process.env.S3_BUCKET) {
    const { GetObjectCommand } = await import('@aws-sdk/client-s3')
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner')

    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: `client-files/${filename}`,
      ResponseContentDisposition: `attachment; filename="${filename}"`,
    })

    const url = await getSignedUrl(getS3Client(), command, { expiresIn: PRESIGNED_URL_EXPIRY })
    return NextResponse.json({ url })
  }

  // Local mode - stream file to client
  const filePath = path.resolve('uploads', 'client-files', filename)

  try {
    await access(filePath)
  } catch {
    return NextResponse.json({ error: 'File not found on disk' }, { status: 404 })
  }

  const fileStat = await stat(filePath)
  const nodeStream = createReadStream(filePath)
  const webStream = Readable.toWeb(nodeStream) as ReadableStream

  return new NextResponse(webStream, {
    headers: {
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(fileStat.size),
    },
  })
}
