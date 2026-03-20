import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import sharp from 'sharp'

import { Users } from '@/collections/Users'
import { Clients } from '@/collections/Clients'
import { ClientFiles } from '@/collections/ClientFiles'
import { GalleryImages } from '@/collections/GalleryImages'
import { Services } from '@/collections/Services'
import { ContactSubmissions } from '@/collections/ContactSubmissions'
import { SiteSettings } from '@/globals/SiteSettings'
import { HomePage } from '@/globals/HomePage'
import { EmailTemplates } from '@/globals/EmailTemplates'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Clients, ClientFiles, GalleryImages, Services, ContactSubmissions],
  globals: [SiteSettings, HomePage, EmailTemplates],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || 'default-secret-change-me-in-production',
  typescript: {
    outputFile: path.resolve(dirname, 'src/types/payload-types.ts'),
  },
  sharp,
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  plugins: [
    ...(process.env.S3_BUCKET
      ? [
          s3Storage({
            collections: {
              'client-files': {
                prefix: 'client-files',
              },
              'gallery-images': {
                prefix: 'gallery',
              },
            },
            bucket: process.env.S3_BUCKET,
            config: {
              endpoint: process.env.S3_ENDPOINT,
              region: process.env.S3_REGION || 'auto',
              credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
              },
              forcePathStyle: true,
            },
          }),
        ]
      : []),
  ],
})
