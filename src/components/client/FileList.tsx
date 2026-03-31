'use client'

import { useState } from 'react'
import { FileCard } from './FileCard'
import { Button } from '@/components/ui/Button'
import { formatFileSize } from '@/lib/format'

interface FileData {
  id: string
  filename: string
  displayName?: string
  mimeType: string
  filesize: number
}

interface FileListProps {
  files: FileData[]
}

export function FileList({ files }: FileListProps) {
  const [downloadingAll, setDownloadingAll] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState({ done: 0, total: 0 })

  if (files.length === 0) {
    return (
      <div className="py-12 text-center text-body-muted">
        <p>Brak plików do pobrania.</p>
        <p className="mt-1 text-sm">Skontaktuj się ze studiem, jeśli spodziewasz się plików.</p>
      </div>
    )
  }

  const images = files.filter((f) => f.mimeType.startsWith('image/'))
  const videos = files.filter((f) => f.mimeType.startsWith('video/'))
  const other = files.filter((f) => !f.mimeType.startsWith('image/') && !f.mimeType.startsWith('video/'))
  const totalSize = files.reduce((sum, f) => sum + f.filesize, 0)

  function downloadFile(file: FileData) {
    const link = document.createElement('a')
    link.href = `/api/client/download/${file.id}`
    link.download = file.displayName || file.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  async function handleDownloadAll() {
    setDownloadingAll(true)
    setDownloadProgress({ done: 0, total: files.length })

    for (let i = 0; i < files.length; i++) {
      try {
        await downloadFile(files[i])
      } catch {
        // continue with next file
      }
      setDownloadProgress({ done: i + 1, total: files.length })
      // Small delay between downloads to prevent browser blocking
      if (i < files.length - 1) {
        await new Promise((r) => setTimeout(r, 500))
      }
    }

    setDownloadingAll(false)
  }

  return (
    <div className="space-y-8">
      {/* Download all button */}
      <div className="flex items-center justify-between border-b border-input-border pb-4">
        <p className="text-sm text-body-muted">
          {files.length} {files.length === 1 ? 'plik' : files.length < 5 ? 'pliki' : 'plików'} - {formatFileSize(totalSize)}
        </p>
        <Button
          onClick={handleDownloadAll}
          disabled={downloadingAll}
        >
          {downloadingAll
            ? `Pobieranie ${downloadProgress.done}/${downloadProgress.total}...`
            : 'Pobierz wszystkie'}
        </Button>
      </div>

      {images.length > 0 && (
        <div>
          <h3 className="mb-4 text-sm uppercase tracking-[0.15em] text-primary">
            Zdjęcia ({images.length})
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {images.map((file) => (
              <FileCard key={file.id} {...file} />
            ))}
          </div>
        </div>
      )}

      {videos.length > 0 && (
        <div>
          <h3 className="mb-4 text-sm uppercase tracking-[0.15em] text-primary">
            Filmy ({videos.length})
          </h3>
          <div className="space-y-3">
            {videos.map((file) => (
              <FileCard key={file.id} {...file} />
            ))}
          </div>
        </div>
      )}

      {other.length > 0 && (
        <div>
          <h3 className="mb-4 text-sm uppercase tracking-[0.15em] text-primary">
            Inne pliki ({other.length})
          </h3>
          <div className="space-y-3">
            {other.map((file) => (
              <FileCard key={file.id} {...file} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
