'use client'

import { useState } from 'react'
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
      if (res.ok) {
        const { url } = await res.json()
        window.location.href = url
      }
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="group flex items-center gap-4 border border-warm-gray bg-white p-4 transition-colors hover:border-primary/30">
      {/* Icon */}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-cream text-primary">
        {isImage ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="m21 15-5-5L5 21" />
          </svg>
        ) : isVideo ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-dark">
          {displayName || filename}
        </p>
        <p className="text-xs text-body/60">{formatFileSize(filesize)}</p>
      </div>

      {/* Download */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownload}
        disabled={downloading}
      >
        {downloading ? '...' : 'Pobierz'}
      </Button>
    </div>
  )
}
