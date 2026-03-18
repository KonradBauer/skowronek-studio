import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || 'auto',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true,
})

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

  // Generate presigned URL
  const key = `client-files/${fileDoc.filename}`
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${fileDoc.filename}"`,
  })

  const url = await getSignedUrl(s3, command, { expiresIn: 3600 })

  return NextResponse.json({ url })
}
