import type { CollectionConfig } from 'payload'

export const GalleryImages: CollectionConfig = {
  slug: 'gallery-images',
  labels: { singular: 'Zdjecie galerii', plural: 'Galeria' },
  upload: {
    staticDir: 'uploads/gallery',
    mimeTypes: ['image/*'],
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 300, position: 'centre' },
      { name: 'card', width: 768, height: 512, position: 'centre' },
      { name: 'full', width: 1920, height: undefined, position: 'centre' },
    ],
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'order'],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => user?.collection === 'users',
    update: ({ req: { user } }) => user?.collection === 'users',
    delete: ({ req: { user } }) => user?.collection === 'users',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Tytuł',
    },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Wesela', value: 'wedding' },
        { label: 'Portrety', value: 'portrait' },
        { label: 'Rodzinne', value: 'family' },
        { label: 'Eventy', value: 'event' },
        { label: 'Inne', value: 'other' },
      ],
      label: 'Kategoria',
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      label: 'Kolejność',
    },
  ],
}
