'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { HLSPlayer } from './HLSPlayer'

interface FileData {
  id: string
  filename: string
  displayName?: string
  mimeType: string
  filesize: number
  hlsStatus?: string
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
  const [downloadedBytes, setDownloadedBytes] = useState(0)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [singleProgress, setSingleProgress] = useState(0)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const totalSize = videos.reduce((s, f) => s + f.filesize, 0)

  async function handleDownloadSingle(file: FileData) {
    setDownloadingId(file.id)
    setSingleProgress(0)
    try {
      const res = await fetch(`/api/client/download/${file.id}`)
      if (!res.ok) return

      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        const { url } = await res.json()
        window.location.href = url
      } else {
        const total = file.filesize || Number(res.headers.get('content-length')) || 0
        const reader = res.body!.getReader()
        const chunks: Uint8Array[] = []
        let received = 0

        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          chunks.push(value)
          received += value.length
          if (total > 0) setSingleProgress(Math.min(100, Math.round((received / total) * 100)))
        }

        const blob = new Blob(chunks as BlobPart[], { type: contentType || 'application/octet-stream' })
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
    setDownloadedBytes(0)
    try {
      const res = await fetch('/api/client/download-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: 'video' }),
      })
      if (!res.ok || !res.body) return

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
            {downloadingAll
              ? totalSize > 0
                ? `Pobieranie... ${Math.min(100, Math.round((downloadedBytes / totalSize) * 100))}%`
                : 'Przygotowywanie ZIP...'
              : 'Pobierz wszystkie'}
          </Button>
        )}
      </div>

      {/* Video list */}
      <div className="space-y-4">
        {videos.map((video) => {
          const isPlaying = playingId === video.id

          return (
            <div
              key={video.id}
              className="overflow-hidden border border-input-border bg-white transition-colors hover:border-primary/30"
            >
              {/* Player */}
              {isPlaying && (
                <div className="relative aspect-video w-full bg-black">
                  {video.hlsStatus === 'ready' ? (
                    <HLSPlayer
                      hlsSrc={`/api/client/hls/${video.id}/master.m3u8`}
                      fallbackSrc={`/api/client/preview/${video.id}`}
                    />
                  ) : (
                    <video
                      src={`/api/client/preview/${video.id}`}
                      className="h-full w-full"
                      controls
                      autoPlay
                      controlsList="nodownload"
                    />
                  )}
                </div>
              )}

              {/* Info bar */}
              <div className="flex items-center gap-4 p-5">
                {/* Play toggle */}
                <button
                  type="button"
                  onClick={() => setPlayingId(isPlaying ? null : video.id)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20"
                >
                  {isPlaying ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                      <polygon points="6 3 20 12 6 21 6 3" />
                    </svg>
                  )}
                </button>

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
                  {downloadingId === video.id
                    ? `Pobieranie... ${singleProgress}%`
                    : 'Pobierz'}
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
