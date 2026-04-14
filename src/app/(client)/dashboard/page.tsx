export const dynamic = 'force-dynamic'

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { ExpirationBanner } from '@/components/client/ExpirationBanner'
import { ClientDashboard } from '@/components/client/ClientDashboard'
import { LogoutButton } from '@/components/client/LogoutButton'

type ClientUserDoc = { id: string; name: string; expiresAt: string; sessionType?: string; collection?: string }
type ClientFileDoc = { id: number | string; filename?: string; displayName?: string; mimeType?: string; filesize?: number; category?: string }

const PHOTO_PAGE_SIZE = 30

export default async function DashboardPage() {
  const payload = await getPayload({ config })
  const cookieStore = await cookies()
  const token = cookieStore.get('client-token')?.value

  if (!token) {
    redirect('/login')
  }

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

  const clientData = user as unknown as ClientUserDoc

  if (clientData.collection !== 'clients') {
    redirect('/login')
  }

  // Fetch first page of photos + total stats
  const photosResult = await payload.find({
    collection: 'client-files',
    where: {
      client: { equals: Number(clientData.id) },
      category: { equals: 'photo' },
    },
    limit: PHOTO_PAGE_SIZE,
    page: 1,
    sort: 'filename',
  })

  // Fetch all videos (typically few per client)
  const videosResult = await payload.find({
    collection: 'client-files',
    where: {
      client: { equals: Number(clientData.id) },
      category: { equals: 'video' },
    },
    limit: 100,
    sort: 'filename',
  })

  const mapFile = (doc: ClientFileDoc) => ({
    id: String(doc.id),
    filename: String(doc.filename || ''),
    displayName: doc.displayName ? String(doc.displayName) : undefined,
    mimeType: String(doc.mimeType || 'application/octet-stream'),
    filesize: Number(doc.filesize || 0),
    category: String(doc.category || (doc.mimeType?.startsWith('video/') ? 'video' : 'photo')) as 'photo' | 'video',
  })

  const initialPhotos = photosResult.docs.map(mapFile)
  const videos = videosResult.docs.map(mapFile)

  // Calculate total photo size — if all fit on first page, use those; otherwise query all filesizes
  let totalPhotoSize = initialPhotos.reduce((s, f) => s + f.filesize, 0)
  if (photosResult.totalDocs > PHOTO_PAGE_SIZE) {
    const allPhotosForSize = await payload.find({
      collection: 'client-files',
      where: {
        client: { equals: Number(clientData.id) },
        category: { equals: 'photo' },
      },
      limit: 2000,
      sort: 'filename',
    })
    totalPhotoSize = (allPhotosForSize.docs as unknown as ClientFileDoc[]).reduce((s: number, d) => s + Number(d.filesize || 0), 0)
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <Link href="/">
          <span className="text-lg font-light uppercase tracking-[0.25em] text-dark">
            Foto Studio
          </span>
        </Link>
        <LogoutButton />
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

      {/* Folder-based file browser */}
      <ClientDashboard
        initialPhotos={initialPhotos}
        totalPhotoCount={photosResult.totalDocs}
        totalPhotoSize={totalPhotoSize}
        videos={videos}
      />
    </div>
  )
}
