'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { formatFileSize } from '@/lib/format'

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

export function VideoList({ videos }: VideoListProps) {
  const [downloadingAll, setDownloadingAll] = useState(false)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const totalSize = videos.reduce((s, f) => s + f.filesize, 0)

  function handleDownloadSingle(file: FileData) {
    const link = document.createElement('a')
    link.href = `/api/client/download/${file.id}`
    link.download = file.displayName || file.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function handleDownloadZip() {
    setDownloadingAll(true)
    const link = document.createElement('a')
    link.href = '/api/client/download-zip?category=video'
    link.download = 'Film.zip'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => setDownloadingAll(false), 3000)
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-light tracking-wide text-dark">Film</h2>
          <p className="text-sm text-body-muted">
            {videos.length} {videos.length === 1 ? 'plik' : videos.length < 5 ? 'pliki' : 'plikow'} - {formatFileSize(totalSize)}
          </p>
        </div>
        {videos.length > 1 && (
          <Button onClick={handleDownloadZip} disabled={downloadingAll}>
            {downloadingAll ? 'Rozpoczeto pobieranie...' : 'Pobierz wszystkie'}
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
                  <video
                    src={`/api/client/preview/${video.id}`}
                    className="h-full w-full"
                    controls
                    autoPlay
                    controlsList="nodownload"
                  />
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
                  <p className="text-xs text-body-muted">{formatFileSize(video.filesize)}</p>
                </div>

                {/* Download */}
                <Button
                  variant="outline"
                  onClick={() => handleDownloadSingle(video)}
                >
                  Pobierz
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
