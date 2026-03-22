'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'

function SkeletonGrid({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={`skeleton-${i}`} className="relative aspect-square overflow-hidden bg-cream">
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-cream via-primary/5 to-cream" />
        </div>
      ))}
    </>
  )
}

interface FileData {
  id: string
  filename: string
  displayName?: string
  mimeType: string
  filesize: number
}

interface PhotoGridProps {
  initialPhotos: FileData[]
  totalCount: number
  totalSize: number
}

function formatTotalSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

const PAGE_SIZE = 30

export function PhotoGrid({ initialPhotos, totalCount, totalSize }: PhotoGridProps) {
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'generating' | 'downloading' | 'error'>('idle')
  const [downloadedBytes, setDownloadedBytes] = useState(0)
  const [lightboxId, setLightboxId] = useState<string | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['photos'],
    queryFn: async ({ pageParam }) => {
      const res = await fetch(`/api/client/files?category=photo&page=${pageParam}&limit=${PAGE_SIZE}`)
      if (!res.ok) throw new Error('Failed to fetch photos')
      return res.json() as Promise<{ docs: FileData[]; hasNextPage: boolean; page: number }>
    },
    initialPageParam: 2,
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.page + 1 : undefined),
    initialData: {
      pages: [{ docs: initialPhotos, hasNextPage: totalCount > PAGE_SIZE, page: 1 }],
      pageParams: [2],
    },
  })

  const allPhotos = data?.pages.flatMap((p) => p.docs) ?? initialPhotos

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { rootMargin: '400px' },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // Lightbox
  const lightboxPhoto = lightboxId ? allPhotos.find((p) => p.id === lightboxId) : null
  const lightboxIndex = lightboxId ? allPhotos.findIndex((p) => p.id === lightboxId) : -1

  const navigateLightbox = useCallback(
    (dir: -1 | 1) => {
      const idx = lightboxId ? allPhotos.findIndex((p) => p.id === lightboxId) : -1
      const newIndex = idx + dir
      if (newIndex >= 0 && newIndex < allPhotos.length) {
        setLightboxId(allPhotos[newIndex].id)
        // Prefetch next page when nearing end of loaded photos
        if (newIndex >= allPhotos.length - 5 && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      }
    },
    [lightboxId, allPhotos, hasNextPage, isFetchingNextPage, fetchNextPage],
  )

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

  async function handleDownloadZip() {
    setDownloadStatus('generating')
    setDownloadedBytes(0)
    try {
      const res = await fetch('/api/client/download-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: 'photo' }),
      })
      if (!res.ok || !res.body) {
        setDownloadStatus('error')
        return
      }

      setDownloadStatus('downloading')

      const reader = res.body.getReader()
      const chunks: Uint8Array[] = []
      let received = 0

      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
        received += value.length
        setDownloadedBytes(received)
      }

      const blob = new Blob(chunks as BlobPart[], { type: 'application/zip' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Zdjecia.zip'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      setDownloadStatus('error')
      return
    }
    setDownloadStatus('idle')
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-light tracking-wide text-dark">Zdjecia</h2>
          <p className="text-sm text-body-muted">
            {totalCount} {totalCount === 1 ? 'zdjecie' : totalCount < 5 ? 'zdjecia' : 'zdjec'} -{' '}
            {formatTotalSize(totalSize)}
          </p>
        </div>
        <Button onClick={handleDownloadZip} disabled={downloadStatus !== 'idle' && downloadStatus !== 'error'}>
          {downloadStatus === 'generating' && (
            <>
              <svg className="mr-2 inline h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generowanie ZIP...
            </>
          )}
          {downloadStatus === 'downloading' && (
            <>
              <svg className="mr-2 inline h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Pobieranie... {formatTotalSize(downloadedBytes)}
            </>
          )}
          {downloadStatus === 'error' && 'Blad — sprobuj ponownie'}
          {downloadStatus === 'idle' && 'Pobierz wszystkie'}
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {allPhotos.map((photo) => (
          <button
            key={photo.id}
            onClick={() => setLightboxId(photo.id)}
            className="group relative aspect-square overflow-hidden bg-cream"
          >
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-cream via-primary/5 to-cream" />
            <Image
              src={`/api/client/preview/${photo.id}?size=thumbnail`}
              alt={photo.displayName || photo.filename}
              fill
              className="relative z-10 object-cover transition-transform duration-200 group-hover:scale-105"
              unoptimized
            />
            <div className="pointer-events-none absolute inset-0 z-20 bg-black/0 transition-colors group-hover:bg-black/10" />
          </button>
        ))}
      </div>

      {/* Skeleton placeholders while fetching next page */}
      {isFetchingNextPage && (
        <div className="mt-1.5 grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          <SkeletonGrid count={PAGE_SIZE} />
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-px" />

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
              onClick={(e) => {
                e.stopPropagation()
                navigateLightbox(-1)
              }}
              className="absolute left-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white/70 transition-colors hover:text-white"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          )}

          {/* Next */}
          {lightboxIndex < totalCount - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                navigateLightbox(1)
              }}
              className="absolute right-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white/70 transition-colors hover:text-white"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          )}

          {/* Image */}
          <Image
            src={`/api/client/preview/${lightboxPhoto.id}`}
            alt={lightboxPhoto.displayName || lightboxPhoto.filename}
            width={1200}
            height={800}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
            unoptimized
          />

          {/* Info bar */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded bg-black/60 px-4 py-2 text-sm text-white/80">
            {lightboxPhoto.displayName || lightboxPhoto.filename} - {lightboxIndex + 1}/{totalCount}
          </div>
        </div>
      )}
    </div>
  )
}
