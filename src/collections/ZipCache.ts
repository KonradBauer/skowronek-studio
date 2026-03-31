import type { CollectionConfig } from 'payload'
import { FILE_CATEGORIES } from '@/lib/constants'

export const ZipCache: CollectionConfig = {
  slug: 'zip-cache',
  labels: { singular: 'ZIP Cache', plural: 'ZIP Cache' },
  admin: {
    hidden: true,
  },
  access: {
    read: ({ req: { user } }) => user?.collection === 'users',
    create: ({ req: { user } }) => user?.collection === 'users',
    update: ({ req: { user } }) => user?.collection === 'users',
    delete: ({ req: { user } }) => user?.collection === 'users',
  },
  fields: [
    {
      name: 'client',
      type: 'relationship',
      relationTo: 'clients',
      required: true,
      index: true,
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [...FILE_CATEGORIES, { label: 'Wszystko', value: 'all' }],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Oczekuje', value: 'pending' },
        { label: 'Generowanie', value: 'generating' },
        { label: 'Gotowy', value: 'ready' },
        { label: 'Blad', value: 'error' },
      ],
    },
    {
      name: 'zipFilename',
      type: 'text',
    },
    {
      name: 'filesize',
      type: 'number',
    },
    {
      name: 'fileCount',
      type: 'number',
    },
    {
      name: 'generatedAt',
      type: 'date',
    },
    {
      name: 'error',
      type: 'text',
      admin: { hidden: true },
    },
  ],
}
