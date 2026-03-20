import type { CollectionConfig } from 'payload'

const DEFAULT_EXPIRY_DAYS = 21

function getDefaultExpiryDate(): string {
  const date = new Date()
  date.setDate(date.getDate() + DEFAULT_EXPIRY_DAYS)
  return date.toISOString()
}

export const Clients: CollectionConfig = {
  slug: 'clients',
  auth: true,
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'expiresAt', 'isActive'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (user?.collection === 'users') return true
      if (user?.collection === 'clients') return { id: { equals: user.id } }
      return false
    },
    create: ({ req: { user } }) => user?.collection === 'users',
    update: ({ req: { user } }) => user?.collection === 'users',
    delete: ({ req: { user } }) => user?.collection === 'users',
  },
  fields: [
    {
      name: 'generatePassword',
      type: 'ui',
      admin: {
        components: {
          Field: '/src/components/admin/GeneratePasswordButton',
        },
      },
    },
    {
      name: 'sendCredentials',
      type: 'ui',
      admin: {
        components: {
          Field: '/src/components/admin/SendCredentialsButton',
        },
      },
    },
    {
      name: 'bulkUpload',
      type: 'ui',
      admin: {
        components: {
          Field: '/src/components/admin/BulkUploadPanel',
        },
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Imię i nazwisko',
    },
    {
      name: 'sessionType',
      type: 'text',
      label: 'Typ sesji',
      admin: {
        description: 'np. Wesele, Chrzciny, Sesja rodzinna',
      },
    },
    {
      name: 'expiresAt',
      type: 'date',
      required: true,
      label: 'Data wygaśnięcia',
      defaultValue: getDefaultExpiryDate,
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'dd.MM.yyyy',
        },
        description: `Domyslnie ${DEFAULT_EXPIRY_DAYS} dni od utworzenia. Po tej dacie konto i pliki zostana automatycznie usuniete.`,
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      label: 'Aktywny',
    },
  ],
  hooks: {
    afterDelete: [
      async ({ req, id }) => {
        // Cascade delete: remove all client files when client is deleted
        let hasMore = true
        while (hasMore) {
          const files = await req.payload.find({
            collection: 'client-files',
            where: { client: { equals: id } },
            limit: 100,
          })
          for (const file of files.docs) {
            await req.payload.delete({
              collection: 'client-files',
              id: file.id,
            })
          }
          hasMore = files.hasNextPage
        }
      },
    ],
  },
}
