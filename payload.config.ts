import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import sharp from 'sharp'

import { Users } from '@/collections/Users'
import { Clients } from '@/collections/Clients'
import { ClientFiles } from '@/collections/ClientFiles'
import { GalleryImages } from '@/collections/GalleryImages'
import { Services } from '@/collections/Services'
import { ContactSubmissions } from '@/collections/ContactSubmissions'
import { Media } from '@/collections/Media'
import { ZipCache } from '@/collections/ZipCache'
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
    components: {
      graphics: {
        Logo: '/src/components/admin/AdminLogo#default',
      },
    },
  },
  collections: [Users, Clients, ClientFiles, GalleryImages, Media, Services, ContactSubmissions, ZipCache],
  globals: [SiteSettings, HomePage, EmailTemplates],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || 'default-secret-change-me-in-production',
  typescript: {
    outputFile: path.resolve(dirname, 'src/types/payload-types.ts'),
  },
  sharp,
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URI || 'file:./payload.db',
    },
    push: process.env.PAYLOAD_DB_PUSH !== 'false',
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
              media: {
                prefix: 'media',
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
