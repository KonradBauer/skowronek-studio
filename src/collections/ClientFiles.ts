import type { CollectionConfig } from 'payload'

export const ClientFiles: CollectionConfig = {
  slug: 'client-files',
  upload: {
    mimeTypes: ['image/*', 'video/*'],
  },
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'client', 'filesize', 'createdAt'],
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
      name: 'displayName',
      type: 'text',
      label: 'Nazwa wyświetlana',
      admin: {
        description: 'Opcjonalna nazwa przyjazna dla klienta',
      },
    },
  ],
}
