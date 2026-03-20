'use client'

import { useState } from 'react'
import { PhotoGrid } from './PhotoGrid'
import { VideoList } from './VideoList'

interface FileData {
  id: string
  filename: string
  displayName?: string
  mimeType: string
  filesize: number
  category: 'photo' | 'video'
}

interface ClientDashboardProps {
  photos: FileData[]
  videos: FileData[]
}

function formatTotalSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export function ClientDashboard({ photos, videos }: ClientDashboardProps) {
  const [view, setView] = useState<'root' | 'photos' | 'videos'>('root')

  if (view === 'photos') {
    return (
      <div>
        <button
          onClick={() => setView('root')}
          className="mb-6 flex items-center gap-2 text-sm text-body transition-colors hover:text-primary"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Powrot
        </button>
        <PhotoGrid photos={photos} />
      </div>
    )
  }

  if (view === 'videos') {
    return (
      <div>
        <button
          onClick={() => setView('root')}
          className="mb-6 flex items-center gap-2 text-sm text-body transition-colors hover:text-primary"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Powrot
        </button>
        <VideoList videos={videos} />
      </div>
    )
  }

  // Root: folder tiles
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      {photos.length > 0 && (
        <button
          onClick={() => setView('photos')}
          className="group flex flex-col items-center gap-4 border border-input-border bg-white p-10 transition-all hover:border-primary/40 hover:shadow-md"
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
              {photos.length} {photos.length === 1 ? 'zdjecie' : photos.length < 5 ? 'zdjecia' : 'zdjec'} - {formatTotalSize(photos.reduce((s, f) => s + f.filesize, 0))}
            </p>
          </div>
        </button>
      )}

      {videos.length > 0 && (
        <button
          onClick={() => setView('videos')}
          className="group flex flex-col items-center gap-4 border border-input-border bg-white p-10 transition-all hover:border-primary/40 hover:shadow-md"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-cream text-primary transition-transform group-hover:scale-110">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-light tracking-wide text-dark">Film</h3>
            <p className="mt-1 text-sm text-body-muted">
              {videos.length} {videos.length === 1 ? 'plik' : videos.length < 5 ? 'pliki' : 'plikow'} - {formatTotalSize(videos.reduce((s, f) => s + f.filesize, 0))}
            </p>
          </div>
        </button>
      )}

      {photos.length === 0 && videos.length === 0 && (
        <div className="col-span-2 py-12 text-center text-body-muted">
          <p>Brak plikow do pobrania.</p>
          <p className="mt-1 text-sm">Skontaktuj sie ze studiem, jesli spodziewasz sie plikow.</p>
        </div>
      )}
    </div>
  )
}
