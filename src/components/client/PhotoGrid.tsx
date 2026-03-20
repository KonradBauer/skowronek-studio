'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'

interface FileData {
  id: string
  filename: string
  displayName?: string
  mimeType: string
  filesize: number
}

interface PhotoGridProps {
  photos: FileData[]
}

function formatTotalSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export function PhotoGrid({ photos }: PhotoGridProps) {
  const [downloading, setDownloading] = useState(false)
  const [lightboxId, setLightboxId] = useState<string | null>(null)
  const totalSize = photos.reduce((s, f) => s + f.filesize, 0)

  async function handleDownloadZip() {
    setDownloading(true)
    try {
      const res = await fetch('/api/client/download-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: 'photo' }),
      })
      if (!res.ok) return

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Zdjecia.zip'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  const lightboxPhoto = lightboxId ? photos.find((p) => p.id === lightboxId) : null
  const lightboxIndex = lightboxId ? photos.findIndex((p) => p.id === lightboxId) : -1

  const navigateLightbox = useCallback((dir: -1 | 1) => {
    const idx = lightboxId ? photos.findIndex((p) => p.id === lightboxId) : -1
    const newIndex = idx + dir
    if (newIndex >= 0 && newIndex < photos.length) {
      setLightboxId(photos[newIndex].id)
    }
  }, [lightboxId, photos])

  useEffect(() => {
    if (!lightboxId) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') navigateLightbox(-1)
      else if (e.key === 'ArrowRight') navigateLightbox(1)
      else if (e.key === 'Escape') setLightboxId(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxId, navigateLightbox])

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-light tracking-wide text-dark">Zdjecia</h2>
          <p className="text-sm text-body-muted">
            {photos.length} {photos.length === 1 ? 'zdjecie' : photos.length < 5 ? 'zdjecia' : 'zdjec'} - {formatTotalSize(totalSize)}
          </p>
        </div>
        <Button onClick={handleDownloadZip} disabled={downloading}>
          {downloading ? 'Przygotowywanie ZIP...' : 'Pobierz wszystkie'}
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {photos.map((photo) => (
          <button
            key={photo.id}
            onClick={() => setLightboxId(photo.id)}
            className="group relative aspect-square overflow-hidden bg-cream"
          >
            <img
              src={`/api/client/preview/${photo.id}?size=thumbnail`}
              alt={photo.displayName || photo.filename}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setLightboxId(null)}
        >
          {/* Close */}
          <button
            onClick={() => setLightboxId(null)}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center text-white/70 transition-colors hover:text-white"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>

          {/* Prev */}
          {lightboxIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); navigateLightbox(-1) }}
              className="absolute left-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white/70 transition-colors hover:text-white"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          )}

          {/* Next */}
          {lightboxIndex < photos.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); navigateLightbox(1) }}
              className="absolute right-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white/70 transition-colors hover:text-white"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          )}

          {/* Image */}
          <img
            src={`/api/client/preview/${lightboxPhoto.id}`}
            alt={lightboxPhoto.displayName || lightboxPhoto.filename}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Info bar */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded bg-black/60 px-4 py-2 text-sm text-white/80">
            {lightboxPhoto.displayName || lightboxPhoto.filename} - {lightboxIndex + 1}/{photos.length}
          </div>
        </div>
      )}
    </div>
  )
}
