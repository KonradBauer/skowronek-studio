export const dynamic = 'force-dynamic'

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getPayload } from 'payload'
import config from '@payload-config'
import { ExpirationBanner } from '@/components/client/ExpirationBanner'
import { ClientDashboard } from '@/components/client/ClientDashboard'

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

  const clientData = user as unknown as {
    id: string
    name: string
    expiresAt: string
    sessionType?: string
    collection?: string
  }

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapFile = (doc: any) => ({
    id: String(doc.id),
    filename: String(doc.filename || ''),
    displayName: doc.displayName ? String(doc.displayName) : undefined,
    mimeType: String(doc.mimeType || 'application/octet-stream'),
    filesize: Number(doc.filesize || 0),
    category: String(doc.category || (doc.mimeType?.startsWith('video/') ? 'video' : 'photo')) as 'photo' | 'video',
    hlsStatus: doc.hlsStatus ? String(doc.hlsStatus) : undefined,
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    totalPhotoSize = allPhotosForSize.docs.reduce((s: number, d: any) => s + Number(d.filesize || 0), 0)
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <Link href="/">
          <Image src="/logo.png" alt="Skowronek Studio" width={180} height={66} className="h-12 w-auto object-contain" />
        </Link>
        <form action="/api/clients/logout" method="POST">
          <button
            type="submit"
            className="cursor-pointer text-sm text-body transition-colors hover:text-primary"
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
