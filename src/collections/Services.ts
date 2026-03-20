import type { CollectionConfig } from 'payload'

export const Services: CollectionConfig = {
  slug: 'services',
  labels: { singular: 'Usluga', plural: 'Oferta' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'order'],
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
      name: 'description',
      type: 'textarea',
      required: true,
      label: 'Opis',
    },
    {
      name: 'icon',
      type: 'text',
      label: 'Ikona',
      admin: {
        description: 'Nazwa ikony (np. camera, heart, users)',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'gallery-images',
      label: 'Zdjęcie',
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      label: 'Kolejność',
    },
  ],
}
