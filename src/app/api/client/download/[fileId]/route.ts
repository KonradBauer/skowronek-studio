import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import path from 'path'
import { access, stat } from 'fs/promises'
import { createReadStream } from 'fs'
import { Readable } from 'stream'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> },
) {
  const { fileId } = await params
  const payload = await getPayload({ config })

  // Verify auth
  const token = req.cookies.get('payload-token')?.value
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { user } = await payload.auth({
    headers: new Headers({ Authorization: `JWT ${token}` }),
  })

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const clientUser = user as unknown as { id: string; collection?: string; expiresAt?: string }
  if (clientUser.collection !== 'clients') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Fetch file and verify ownership
  const file = await payload.findByID({
    collection: 'client-files',
    id: fileId,
  })

  if (!file) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fileDoc = file as any
  const fileClientId = typeof fileDoc.client === 'object' ? String(fileDoc.client.id) : String(fileDoc.client)
  if (fileClientId !== clientUser.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Check expiration
  if (clientUser.expiresAt && new Date(clientUser.expiresAt) < new Date()) {
    return NextResponse.json({ error: 'Account expired' }, { status: 403 })
  }

  const filename = String(fileDoc.filename || '')
  const mimeType = String(fileDoc.mimeType || 'application/octet-stream')

  // S3 mode - generate presigned URL
  if (process.env.S3_BUCKET) {
    const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3')
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner')

    const s3 = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION || 'auto',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      },
      forcePathStyle: true,
    })

    const key = `client-files/${filename}`
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${filename}"`,
    })

    const url = await getSignedUrl(s3, command, { expiresIn: 3600 })
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
