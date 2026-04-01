import type { CollectionConfig } from 'payload'
import { IMAGE_SIZES } from '@/lib/constants'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Plik', plural: 'Media' },
  upload: {
    staticDir: 'uploads/media',
    mimeTypes: ['image/*'],
    adminThumbnail: 'thumbnail',
    displayPreview: true,
    imageSizes: IMAGE_SIZES,
  },
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'alt', 'createdAt'],
    listSearchableFields: ['alt', 'filename'],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => user?.collection === 'users',
    update: ({ req: { user } }) => user?.collection === 'users',
    delete: ({ req: { user } }) => user?.collection === 'users',
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Opis zdjęcia (alt)',
    },
  ],
}
