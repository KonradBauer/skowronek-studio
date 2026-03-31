'use client'

import { useState, useEffect, useCallback, useRef, memo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import Image from 'next/image'
import Lightbox from 'yet-another-react-lightbox'
import Counter from 'yet-another-react-lightbox/plugins/counter'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen'
import 'yet-another-react-lightbox/styles.css'
import 'yet-another-react-lightbox/plugins/counter.css'
import { Button } from '@/components/ui/Button'
import { formatFileSize } from '@/lib/format'

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin text-primary/40" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

// Preload a batch of thumbnails into browser cache, resolve when ALL are done
function preloadThumbnails(photos: FileData[]): Promise<void> {
  if (photos.length === 0) return Promise.resolve()
  return new Promise((resolve) => {
    let loaded = 0
    photos.forEach((photo) => {
      const img = new window.Image()
      img.onload = img.onerror = () => {
        loaded++
        if (loaded >= photos.length) resolve()
      }
      img.src = `/api/client/preview/${photo.id}?size=thumbnail`
    })
  })
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
        <div className="absolute inset-0 flex items-center justify-center">
          <Spinner />
        </div>
      )}
      <Image
        src={`/api/client/preview/${photo.id}?size=thumbnail`}
        alt={photo.displayName || photo.filename}
        fill
        className={`object-cover transition-all duration-300 group-hover:scale-105 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        unoptimized
        onLoad={() => setLoaded(true)}
      />
      <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
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

function useColumns() {
  const [columns, setColumns] = useState(6)

  useEffect(() => {
    function update() {
      const w = window.innerWidth
      if (w >= 1024) setColumns(6)
      else if (w >= 768) setColumns(5)
      else if (w >= 640) setColumns(4)
      else setColumns(3)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return columns
}

function useRowHeight(columns: number) {
  const [height, setHeight] = useState(160)

  useEffect(() => {
    function update() {
      const containerWidth = Math.min(window.innerWidth - 48, 1024)
      const gap = 6
      const itemWidth = (containerWidth - gap * (columns - 1)) / columns
      setHeight(itemWidth + gap)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [columns])

  return height
}

const PAGE_SIZE = 30

export function PhotoGrid({ initialPhotos, totalCount, totalSize }: PhotoGridProps) {
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading'>('idle')
  const [lightboxIndex, setLightboxIndex] = useState(-1)
  const [firstPageReady, setFirstPageReady] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)

  const columns = useColumns()
  const rowHeight = useRowHeight(columns)

  // Preload first page — show grid only when fully loaded
  useEffect(() => {
    const timeout = setTimeout(() => setFirstPageReady(true), 10000)
    preloadThumbnails(initialPhotos).then(() => {
      clearTimeout(timeout)
      setFirstPageReady(true)
    })
    return () => clearTimeout(timeout)
  }, [initialPhotos])

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

  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => rowHeight,
    overscan: 3,
    scrollMargin: gridRef.current?.offsetTop ?? 0,
  })

  const virtualItems = virtualizer.getVirtualItems()

  // Prefetch next page of data 1 ahead of what's visible
  const pagesLoaded = data?.pages.length ?? 1

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return
    const lastVisibleRow = virtualItems.length > 0 ? virtualItems[virtualItems.length - 1].index : 0
    const photosVisible = (lastVisibleRow + 1) * columns
    const pagesNeeded = Math.ceil(photosVisible / PAGE_SIZE)
    if (pagesLoaded <= pagesNeeded) {
      fetchNextPage()
    }
  }, [virtualItems, pagesLoaded, columns, hasNextPage, isFetchingNextPage, fetchNextPage])

  // Preload thumbnails for each newly fetched page in background
  const preloadedPagesRef = useRef(1)

  useEffect(() => {
    const pages = data?.pages ?? []
    if (pages.length <= preloadedPagesRef.current) return

    const newPages = pages.slice(preloadedPagesRef.current)
    preloadedPagesRef.current = pages.length

    newPages.forEach((page) => preloadThumbnails(page.docs))
  }, [data?.pages])

  // Re-measure when row height changes
  const measureRef = useRef(virtualizer.measure)
  measureRef.current = virtualizer.measure

  useEffect(() => {
    measureRef.current()
  }, [rowHeight])

  // Lightbox — medium quality for viewing, full quality only in ZIP download
  const lightboxSlides = allPhotos.map((p) => ({
    src: `/api/client/preview/${p.id}?size=medium`,
    alt: p.displayName || p.filename,
    title: p.displayName || p.filename,
  }))

  const handleLightboxView = useCallback(
    (index: number) => {
      setLightboxIndex(index)
      if (index >= allPhotos.length - 5 && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    },
    [allPhotos.length, hasNextPage, isFetchingNextPage, fetchNextPage],
  )

  function handleDownloadZip() {
    setDownloadStatus('downloading')
    const link = document.createElement('a')
    link.href = '/api/client/download-zip?category=photo'
    link.download = 'Zdjecia.zip'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => setDownloadStatus('idle'), 3000)
  }

  if (!firstPageReady) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <svg className="h-8 w-8 animate-spin text-primary/40" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="mt-4 text-sm tracking-wide text-body-muted">Prosze czekac, ladowanie galerii...</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-light tracking-wide text-dark">Zdjecia</h2>
          <p className="text-sm text-body-muted">
            {totalCount} {totalCount === 1 ? 'zdjecie' : totalCount < 5 ? 'zdjecia' : 'zdjec'} -{' '}
            {formatFileSize(totalSize)}
          </p>
        </div>
        <Button onClick={handleDownloadZip} disabled={downloadStatus === 'downloading'}>
          {downloadStatus === 'downloading' ? 'Rozpoczeto pobieranie...' : 'Pobierz wszystkie'}
        </Button>
      </div>

      {/* Tip */}
      <div className="mb-6 border border-primary/15 bg-primary/5 px-5 py-3.5 text-sm leading-relaxed text-dark/70">
        Dla najlepszego doświadczenia przeglądania zdjęć zalecamy pobranie ich na swój komputer klikając{' '}
        <strong className="font-medium text-dark">&ldquo;Pobierz wszystkie&rdquo;</strong>.
      </div>

      {/* Virtualized Grid */}
      <div ref={gridRef}>
        <div
          className="relative w-full"
          style={{ height: virtualizer.getTotalSize() }}
        >
          {virtualItems.map((virtualRow) => {
            const startIdx = virtualRow.index * columns
            const rowPhotos = allPhotos.slice(startIdx, startIdx + columns)
            return (
              <div
                key={virtualRow.index}
                className="absolute left-0 top-0 grid w-full gap-1.5"
                style={{
                  height: virtualRow.size - 6,
                  transform: `translateY(${virtualRow.start - (virtualizer.options.scrollMargin || 0)}px)`,
                  gridTemplateColumns: `repeat(${columns}, 1fr)`,
                }}
              >
                {rowPhotos.map((photo, colIdx) => (
                  <LazyPhoto
                    key={photo.id}
                    photo={photo}
                    onClick={() => setLightboxIndex(startIdx + colIdx)}
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
      <Lightbox
        open={lightboxIndex >= 0}
        close={() => setLightboxIndex(-1)}
        index={lightboxIndex}
        slides={lightboxSlides}
        on={{ view: ({ index }) => handleLightboxView(index) }}
        plugins={[Counter, Zoom, Fullscreen]}
        counter={{ container: { style: { top: 'unset', bottom: 0 } } }}
        styles={{ container: { backgroundColor: 'rgba(0, 0, 0, 0.9)' } }}
        carousel={{ preload: 2 }}
      />
    </div>
  )
}
