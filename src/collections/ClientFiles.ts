import type { CollectionConfig } from 'payload'
import { FILE_CATEGORIES } from '@/lib/constants'
import { invalidateZipCache } from '@/lib/zip-generator'

export const ClientFiles: CollectionConfig = {
  slug: 'client-files',
  labels: { singular: 'Plik klienta', plural: 'Pliki klientow' },
  upload: {
    mimeTypes: ['image/*', 'video/*'],
    staticDir: 'uploads/client-files',
    imageSizes: [],
    filesRequiredOnCreate: false,
  },
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'client', 'category', 'filesize', 'createdAt'],
    hidden: true,
  },
  access: {
    read: ({ req: { user } }) => {
      if (user?.collection === 'users') return true
      if (user?.collection === 'clients') {
        return { client: { equals: user.id } }
      }
      return false
    },
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
      label: 'Klient',
      index: true,
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      defaultValue: 'photo',
      label: 'Kategoria',
      index: true,
      options: [...FILE_CATEGORIES],
    },
    {
      name: 'displayName',
      type: 'text',
      label: 'Nazwa wyswietlana',
      admin: {
        description: 'Opcjonalna nazwa przyjazna dla klienta',
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        // Auto-set category from mimeType if not provided
        if (data && !data.category && data.mimeType) {
          data.category = data.mimeType.startsWith('video/') ? 'video' : 'photo'
        }
        return data
      },
    ],
    afterChange: [
      ({ doc, req }) => {
        const clientId = typeof doc.client === 'object' ? doc.client.id : doc.client
        if (clientId) {
          invalidateZipCache(req.payload, clientId, doc.category || 'photo').catch(console.error)
        }
      },
    ],
    afterDelete: [
      ({ doc, req }) => {
        const clientId = typeof doc.client === 'object' ? doc.client.id : doc.client
        if (clientId) {
          invalidateZipCache(req.payload, clientId, doc.category || 'photo').catch(console.error)
        }


      },
    ],
  },
}
