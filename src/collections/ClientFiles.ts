import type { CollectionConfig } from 'payload'
import { invalidateZipCache } from '@/lib/zip-generator'

export const ClientFiles: CollectionConfig = {
  slug: 'client-files',
  labels: { singular: 'Plik klienta', plural: 'Pliki klientow' },
  upload: {
    mimeTypes: ['image/*', 'video/*'],
    staticDir: 'uploads/client-files',
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 400, position: 'centre' },
    ],
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
      options: [
        { label: 'Zdjecie', value: 'photo' },
        { label: 'Film', value: 'video' },
      ],
    },
    {
      name: 'displayName',
      type: 'text',
      label: 'Nazwa wyswietlana',
      admin: {
        description: 'Opcjonalna nazwa przyjazna dla klienta',
      },
    },
    {
      name: 'videoThumbnail',
      type: 'text',
      label: 'Miniaturka wideo',
      admin: { hidden: true },
    },
    {
      name: 'hlsStatus',
      type: 'select',
      defaultValue: 'none',
      options: [
        { label: 'Brak', value: 'none' },
        { label: 'W kolejce', value: 'pending' },
        { label: 'Przetwarzanie', value: 'processing' },
        { label: 'Gotowe', value: 'ready' },
        { label: 'Blad', value: 'error' },
      ],
      admin: { readOnly: true },
    },
    {
      name: 'hlsPath',
      type: 'text',
      admin: { hidden: true },
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
