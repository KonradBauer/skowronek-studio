import { S3Client } from '@aws-sdk/client-s3'
import { PRESIGNED_URL_EXPIRY } from './constants'

let cachedClient: S3Client | null = null

/** Get or create a shared S3 client instance */
export function getS3Client(): S3Client {
  if (cachedClient) return cachedClient

  cachedClient = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || 'auto',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    },
    forcePathStyle: true,
  })

  return cachedClient
}

export { PRESIGNED_URL_EXPIRY }
