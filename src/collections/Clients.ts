import type { CollectionConfig } from 'payload'

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
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'dd.MM.yyyy',
        },
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
        const files = await req.payload.find({
          collection: 'client-files',
          where: { client: { equals: id } },
          limit: 1000,
        })
        for (const file of files.docs) {
          await req.payload.delete({
            collection: 'client-files',
            id: file.id,
          })
        }
      },
    ],
  },
}
