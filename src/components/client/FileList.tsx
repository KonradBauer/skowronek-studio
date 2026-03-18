'use client'

import { FileCard } from './FileCard'

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

  return (
    <div className="space-y-8">
      {images.length > 0 && (
        <div>
          <h3 className="mb-4 text-sm uppercase tracking-[0.15em] text-primary">
            Zdjęcia ({images.length})
          </h3>
          <div className="space-y-2">
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
          <div className="space-y-2">
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
          <div className="space-y-2">
            {other.map((file) => (
              <FileCard key={file.id} {...file} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
