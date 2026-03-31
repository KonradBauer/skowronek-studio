'use client'

import { useState } from 'react'
import { QueryProvider } from './QueryProvider'
import { PhotoGrid } from './PhotoGrid'
import { VideoList } from './VideoList'
import { formatFileSize } from '@/lib/format'

interface FileData {
  id: string
  filename: string
  displayName?: string
  mimeType: string
  filesize: number
  category: 'photo' | 'video'
}

interface ClientDashboardProps {
  initialPhotos: FileData[]
  totalPhotoCount: number
  totalPhotoSize: number
  videos: FileData[]
}

export function ClientDashboard({ initialPhotos, totalPhotoCount, totalPhotoSize, videos }: ClientDashboardProps) {
  const [view, setView] = useState<'root' | 'photos' | 'videos'>('root')

  if (view === 'photos') {
    return (
      <QueryProvider>
        <div>
          <button
            onClick={() => setView('root')}
            className="cursor-pointer mb-6 flex items-center gap-2 text-sm text-body transition-colors hover:text-primary"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Powrót
          </button>
          <PhotoGrid initialPhotos={initialPhotos} totalCount={totalPhotoCount} totalSize={totalPhotoSize} />
        </div>
      </QueryProvider>
    )
  }

  if (view === 'videos') {
    return (
      <div>
        <button
          onClick={() => setView('root')}
          className="cursor-pointer mb-6 flex items-center gap-2 text-sm text-body transition-colors hover:text-primary"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Powrót
        </button>
        <VideoList videos={videos} />
      </div>
    )
  }

  // Root: folder tiles
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      {totalPhotoCount > 0 && (
        <button
          onClick={() => setView('photos')}
          className="cursor-pointer group flex flex-col items-center gap-4 border border-input-border bg-white p-10 transition-all hover:border-primary/40 hover:shadow-md"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-cream text-primary transition-transform group-hover:scale-110">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-light tracking-wide text-dark">Zdjecia</h3>
            <p className="mt-1 text-sm text-body-muted">
              {totalPhotoCount} {totalPhotoCount === 1 ? 'zdjecie' : totalPhotoCount < 5 ? 'zdjecia' : 'zdjec'} - {formatFileSize(totalPhotoSize)}
            </p>
          </div>
        </button>
      )}

      {videos.length > 0 && (
        <button
          onClick={() => setView('videos')}
          className="cursor-pointer group flex flex-col items-center gap-4 border border-input-border bg-white p-10 transition-all hover:border-primary/40 hover:shadow-md"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-cream text-primary transition-transform group-hover:scale-110">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-light tracking-wide text-dark">Film</h3>
            <p className="mt-1 text-sm text-body-muted">
              {videos.length} {videos.length === 1 ? 'plik' : videos.length < 5 ? 'pliki' : 'plikow'} - {formatFileSize(videos.reduce((s, f) => s + f.filesize, 0))}
            </p>
          </div>
        </button>
      )}

      {totalPhotoCount === 0 && videos.length === 0 && (
        <div className="col-span-2 py-12 text-center text-body-muted">
          <p>Brak plikow do pobrania.</p>
          <p className="mt-1 text-sm">Skontaktuj sie ze studiem, jesli spodziewasz sie plikow.</p>
        </div>
      )}
    </div>
  )
}
