import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { ExpirationBanner } from '@/components/client/ExpirationBanner'
import { FileList } from '@/components/client/FileList'

export default async function DashboardPage() {
  const payload = await getPayload({ config })
  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')?.value

  if (!token) {
    redirect('/login')
  }

  // Verify client auth via headers
  const reqHeaders = await headers()
  const { user } = await payload.auth({
    headers: new Headers({
      ...Object.fromEntries(reqHeaders.entries()),
      Authorization: `JWT ${token}`,
    }),
  })

  if (!user) {
    redirect('/login')
  }

  const clientData = user as unknown as {
    id: string
    name: string
    expiresAt: string
    sessionType?: string
    collection?: string
  }

  // Only allow clients collection
  if (clientData.collection !== 'clients') {
    redirect('/login')
  }

  // Fetch client files
  const filesResult = await payload.find({
    collection: 'client-files',
    where: { client: { equals: clientData.id } },
    limit: 500,
    sort: 'filename',
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const files = filesResult.docs.map((doc: any) => ({
    id: String(doc.id),
    filename: String(doc.filename || ''),
    displayName: doc.displayName ? String(doc.displayName) : undefined,
    mimeType: String(doc.mimeType || 'application/octet-stream'),
    filesize: Number(doc.filesize || 0),
  }))

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <a href="/" className="text-lg font-light tracking-[0.2em] uppercase text-dark">
            Skowronek Studio
          </a>
        </div>
        <form action="/api/clients/logout" method="POST">
          <button
            type="submit"
            className="text-sm text-body transition-colors hover:text-primary"
          >
            Wyloguj
          </button>
        </form>
      </div>

      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-light tracking-wide text-dark">
          Witaj, {clientData.name}
        </h1>
        {clientData.sessionType && (
          <p className="mt-1 text-sm text-body">{clientData.sessionType}</p>
        )}
      </div>

      {/* Expiration banner */}
      <div className="mb-8">
        <ExpirationBanner expiresAt={clientData.expiresAt} />
      </div>

      {/* Files */}
      <FileList files={files} />
    </div>
  )
}
