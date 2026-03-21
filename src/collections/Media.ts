import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Plik', plural: 'Media' },
  upload: {
    staticDir: 'uploads/media',
    mimeTypes: ['image/*'],
    adminThumbnail: 'thumbnail',
    displayPreview: true,
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 300, position: 'centre' },
      { name: 'card', width: 768, height: 512, position: 'centre' },
      { name: 'full', width: 1920, height: undefined, position: 'centre' },
    ],
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
      label: 'Opis zdjecia (alt)',
    },
  ],
}
