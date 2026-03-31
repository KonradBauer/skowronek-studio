import type { CollectionConfig } from 'payload'

const DEFAULT_EXPIRY_DAYS = 10
/** Days after expiration during which we show "account expired" instead of generic error */
const EXPIRED_GRACE_DAYS = 3

function getDefaultExpiryDate(): string {
  const date = new Date()
  date.setDate(date.getDate() + DEFAULT_EXPIRY_DAYS)
  return date.toISOString()
}

export const Clients: CollectionConfig = {
  slug: 'clients',
  labels: { singular: 'Klient', plural: 'Klienci' },
  auth: {
    tokenExpiration: 60 * 60 * 24 * 7, // 7 days — matches cookie maxAge for sliding session
  },
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
      saveToJWT: true,
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
    beforeLogin: [
      async ({ user }) => {
        const expiresAt = (user as { expiresAt?: string }).expiresAt
        if (!expiresAt) return
        const expiry = new Date(expiresAt)
        const now = new Date()
        if (expiry >= now) return

        const daysSinceExpiry = (now.getTime() - expiry.getTime()) / (1000 * 60 * 60 * 24)
        if (daysSinceExpiry <= EXPIRED_GRACE_DAYS) {
          throw new Error('ACCOUNT_EXPIRED')
        }
        // Past grace period — generic error (as if account doesn't exist)
        throw new Error('LOGIN_FAILED')
      },
    ],
    beforeDelete: [
      async ({ req, id }) => {
        // Cascade delete: remove all client files BEFORE deleting client
        // (PostgreSQL FK constraint prevents deleting client while files reference it)
        let hasMore = true
        while (hasMore) {
          const files = await req.payload.find({
            collection: 'client-files',
            where: { client: { equals: id } },
            limit: 100,
            overrideAccess: true,
          })
          for (const file of files.docs) {
            await req.payload.delete({
              collection: 'client-files',
              id: file.id,
              overrideAccess: true,
            })
          }
          hasMore = files.hasNextPage
        }
      },
    ],
  },
}
