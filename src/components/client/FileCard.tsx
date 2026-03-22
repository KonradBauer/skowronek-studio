'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'

interface FileCardProps {
  id: string
  filename: string
  displayName?: string
  mimeType: string
  filesize: number
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export function FileCard({ id, filename, displayName, mimeType, filesize }: FileCardProps) {
  const [downloading, setDownloading] = useState(false)
  const isImage = mimeType.startsWith('image/')
  const isVideo = mimeType.startsWith('video/')

  async function handleDownload() {
    setDownloading(true)
    try {
      const res = await fetch(`/api/client/download/${id}`)
      if (!res.ok) return

      const contentType = res.headers.get('content-type') || ''

      if (contentType.includes('application/json')) {
        // S3 mode - presigned URL
        const { url } = await res.json()
        window.location.href = url
      } else {
        // Local mode - blob download
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = displayName || filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="group overflow-hidden border border-input-border bg-white transition-colors hover:border-primary/30">
      {/* Image preview */}
      {isImage && (
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-cream">
          <Image
            src={`/api/client/preview/${id}`}
            alt={displayName || filename}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}

      {/* Video icon area */}
      {isVideo && (
        <div className="flex aspect-video w-full items-center justify-center bg-cream/50">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-primary/40">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </div>
      )}

      {/* Info + download */}
      <div className="flex items-center gap-4 p-4">
        {!isImage && !isVideo && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-cream text-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-dark">
            {displayName || filename}
          </p>
          <p className="text-xs text-body-muted">{formatFileSize(filesize)}</p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={downloading}
        >
          {downloading ? '...' : 'Pobierz'}
        </Button>
      </div>
    </div>
  )
}
