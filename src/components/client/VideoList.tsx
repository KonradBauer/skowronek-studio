'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

interface FileData {
  id: string
  filename: string
  displayName?: string
  mimeType: string
  filesize: number
}

interface VideoListProps {
  videos: FileData[]
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export function VideoList({ videos }: VideoListProps) {
  const [downloadingAll, setDownloadingAll] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const totalSize = videos.reduce((s, f) => s + f.filesize, 0)

  async function handleDownloadSingle(file: FileData) {
    setDownloadingId(file.id)
    try {
      const res = await fetch(`/api/client/download/${file.id}`)
      if (!res.ok) return

      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        const { url } = await res.json()
        window.location.href = url
      } else {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = file.displayName || file.filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } finally {
      setDownloadingId(null)
    }
  }

  async function handleDownloadZip() {
    setDownloadingAll(true)
    try {
      const res = await fetch('/api/client/download-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: 'video' }),
      })
      if (!res.ok) return

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Film.zip'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setDownloadingAll(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-light tracking-wide text-dark">Film</h2>
          <p className="text-sm text-body-muted">
            {videos.length} {videos.length === 1 ? 'plik' : videos.length < 5 ? 'pliki' : 'plikow'} - {formatSize(totalSize)}
          </p>
        </div>
        {videos.length > 1 && (
          <Button onClick={handleDownloadZip} disabled={downloadingAll}>
            {downloadingAll ? 'Przygotowywanie ZIP...' : 'Pobierz wszystkie'}
          </Button>
        )}
      </div>

      {/* Video list */}
      <div className="space-y-3">
        {videos.map((video) => (
          <div
            key={video.id}
            className="flex items-center gap-4 border border-input-border bg-white p-5 transition-colors hover:border-primary/30"
          >
            {/* Icon */}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-cream text-primary">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-dark">
                {video.displayName || video.filename}
              </p>
              <p className="text-xs text-body-muted">{formatSize(video.filesize)}</p>
            </div>

            {/* Download */}
            <Button
              variant="outline"
              onClick={() => handleDownloadSingle(video)}
              disabled={downloadingId === video.id}
            >
              {downloadingId === video.id ? 'Pobieranie...' : 'Pobierz'}
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
