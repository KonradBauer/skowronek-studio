'use client'

import { useState, useEffect, useCallback, useRef, memo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useVirtualizer } from '@tanstack/react-virtual'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin text-primary/40" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

const LazyPhoto = memo(function LazyPhoto({
  photo,
  onClick,
}: {
  photo: FileData
  onClick: () => void
}) {
  const [loaded, setLoaded] = useState(false)

  return (
    <button
      onClick={onClick}
      className="group relative aspect-square overflow-hidden bg-cream"
    >
      {!loaded && (
        <div className="absolute inset-0 z-0 flex items-center justify-center">
          <Spinner />
        </div>
      )}
      <Image
        src={`/api/client/preview/${photo.id}?size=thumbnail`}
        alt={photo.displayName || photo.filename}
        fill
        className={`relative z-10 object-cover transition-all duration-300 group-hover:scale-105 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
        unoptimized
      />
      <div className="pointer-events-none absolute inset-0 z-20 bg-black/0 transition-colors group-hover:bg-black/10" />
    </button>
  )
})

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

function useColumns() {
  const [columns, setColumns] = useState(3)

  useEffect(() => {
    function update() {
      const w = window.innerWidth
      if (w >= 1024) setColumns(6)      // lg
      else if (w >= 768) setColumns(5)   // md
      else if (w >= 640) setColumns(4)   // sm
      else setColumns(3)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return columns
}

const PAGE_SIZE = 30
const GAP = 6 // gap-1.5 = 0.375rem = 6px

export function PhotoGrid({ initialPhotos, totalCount, totalSize }: PhotoGridProps) {
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'generating' | 'downloading' | 'error'>('idle')
  const [downloadedBytes, setDownloadedBytes] = useState(0)
  const [lightboxId, setLightboxId] = useState<string | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const columns = useColumns()

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

  const rowCount = Math.ceil(allPhotos.length / columns)

  // Estimate row height: square aspect ratio based on container width
  const estimateSize = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return 200
    const containerWidth = container.clientWidth
    const itemWidth = (containerWidth - GAP * (columns - 1)) / columns
    return itemWidth + GAP // item height + gap
  }, [columns])

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize,
    overscan: 3,
  })

  // Prefetch next page 1 ahead of what's visible
  const virtualItems = virtualizer.getVirtualItems()
  const pagesLoaded = data?.pages.length ?? 1

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return
    const lastVisibleRow = virtualItems.length > 0 ? virtualItems[virtualItems.length - 1].index : 0
    const photosVisible = (lastVisibleRow + 1) * columns
    const pagesNeeded = Math.ceil(photosVisible / PAGE_SIZE)
    // Always keep 1 page prefetched ahead of what's currently needed
    if (pagesLoaded <= pagesNeeded) {
      fetchNextPage()
    }
  }, [virtualItems, pagesLoaded, columns, hasNextPage, isFetchingNextPage, fetchNextPage])

  // Recalculate sizes when columns change
  const measureRef = useRef(virtualizer.measure)
  measureRef.current = virtualizer.measure

  useEffect(() => {
    measureRef.current()
  }, [columns])

  // Rows grouped by columns
  const getRowPhotos = useCallback(
    (rowIndex: number) => {
      const start = rowIndex * columns
      return allPhotos.slice(start, start + columns)
    },
    [allPhotos, columns],
  )

  // Lightbox
  const lightboxPhoto = lightboxId ? allPhotos.find((p) => p.id === lightboxId) : null
  const lightboxIndex = lightboxId ? allPhotos.findIndex((p) => p.id === lightboxId) : -1

  const navigateLightbox = useCallback(
    (dir: -1 | 1) => {
      const idx = lightboxId ? allPhotos.findIndex((p) => p.id === lightboxId) : -1
      const newIndex = idx + dir
      if (newIndex >= 0 && newIndex < allPhotos.length) {
        setLightboxId(allPhotos[newIndex].id)
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

      {/* Virtualized Grid */}
      <div
        ref={scrollContainerRef}
        className="h-[calc(100vh-200px)] overflow-y-auto"
      >
        <div
          className="relative w-full"
          style={{ height: virtualizer.getTotalSize() }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const rowPhotos = getRowPhotos(virtualRow.index)
            return (
              <div
                key={virtualRow.index}
                className="absolute left-0 top-0 grid w-full gap-1.5"
                data-columns={columns}
                style={{
                  height: virtualRow.size - GAP,
                  transform: `translateY(${virtualRow.start}px)`,
                  gridTemplateColumns: `repeat(${columns}, 1fr)`,
                }}
              >
                {rowPhotos.map((photo) => (
                  <LazyPhoto
                    key={photo.id}
                    photo={photo}
                    onClick={() => setLightboxId(photo.id)}
                  />
                ))}
              </div>
            )
          })}
        </div>

      </div>

      {/* Loading indicator */}
      {isFetchingNextPage && (
        <div className="flex items-center justify-center py-8">
          <Spinner />
        </div>
      )}

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
          {lightboxIndex < allPhotos.length - 1 && (
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
