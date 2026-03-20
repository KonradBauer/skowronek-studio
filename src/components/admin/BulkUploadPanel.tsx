'use client'

import { useState, useRef, useCallback } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'

const CHUNK_SIZE = 10 * 1024 * 1024 // 10MB

type UploadStatus = 'pending' | 'uploading' | 'done' | 'error'

interface FileEntry {
  file: File
  status: UploadStatus
  progress: number
  error?: string
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

async function uploadFile(
  file: File,
  clientId: string,
  onProgress: (progress: number) => void,
): Promise<void> {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE)

  // Init upload
  const initRes = await fetch('/api/upload/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId,
      filename: file.name,
      mimeType: file.type,
      totalSize: file.size,
      totalChunks,
    }),
  })

  if (!initRes.ok) {
    const err = await initRes.json()
    throw new Error(err.error || 'Blad inicjalizacji uploadu')
  }

  const { uploadId } = await initRes.json()

  // Send chunks
  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE
    const end = Math.min(start + CHUNK_SIZE, file.size)
    const chunk = file.slice(start, end)

    const formData = new FormData()
    formData.append('uploadId', uploadId)
    formData.append('chunkIndex', String(i))
    formData.append('chunk', chunk)

    const chunkRes = await fetch('/api/upload/chunk', {
      method: 'POST',
      body: formData,
    })

    if (!chunkRes.ok) {
      const err = await chunkRes.json()
      throw new Error(err.error || `Blad wysylania chunka ${i}`)
    }

    onProgress(((i + 1) / totalChunks) * 100)
  }

  // Complete
  const completeRes = await fetch('/api/upload/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      uploadId,
      clientId,
      filename: file.name,
      mimeType: file.type,
    }),
  })

  if (!completeRes.ok) {
    const err = await completeRes.json()
    throw new Error(err.error || 'Blad finalizacji uploadu')
  }
}

export const BulkUploadPanel = () => {
  const { id } = useDocumentInfo()
  const [photos, setPhotos] = useState<FileEntry[]>([])
  const [videos, setVideos] = useState<FileEntry[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const newPhotos: FileEntry[] = []
    const newVideos: FileEntry[] = []

    for (const file of fileArray) {
      const entry: FileEntry = { file, status: 'pending', progress: 0 }
      if (file.type.startsWith('video/')) {
        newVideos.push(entry)
      } else if (file.type.startsWith('image/')) {
        newPhotos.push(entry)
      }
    }

    if (newPhotos.length > 0) setPhotos((prev) => [...prev, ...newPhotos])
    if (newVideos.length > 0) setVideos((prev) => [...prev, ...newVideos])
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files)
      }
    },
    [addFiles],
  )

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const removeVideo = (index: number) => {
    setVideos((prev) => prev.filter((_, i) => i !== index))
  }

  const startUpload = async () => {
    if (!id) return
    setIsUploading(true)

    // Upload photos sequentially, tracking combined progress
    const totalPhotoBytes = photos.reduce((sum, p) => sum + p.file.size, 0)
    let uploadedPhotoBytes = 0

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i]
      if (photo.status === 'done') continue

      setPhotos((prev) =>
        prev.map((p, idx) => (idx === i ? { ...p, status: 'uploading' } : p)),
      )

      try {
        const photoSize = photo.file.size
        await uploadFile(photo.file, String(id), (fileProgress) => {
          const currentFileUploaded = (fileProgress / 100) * photoSize
          const totalProgress =
            totalPhotoBytes > 0
              ? ((uploadedPhotoBytes + currentFileUploaded) / totalPhotoBytes) * 100
              : 0

          setPhotos((prev) =>
            prev.map((p, idx) =>
              idx === i ? { ...p, progress: totalProgress } : p.status === 'done' ? p : { ...p, progress: totalProgress },
            ),
          )
        })

        uploadedPhotoBytes += photoSize
        setPhotos((prev) =>
          prev.map((p, idx) => (idx === i ? { ...p, status: 'done', progress: 100 } : p)),
        )
      } catch (err) {
        setPhotos((prev) =>
          prev.map((p, idx) =>
            idx === i
              ? { ...p, status: 'error', error: err instanceof Error ? err.message : 'Blad' }
              : p,
          ),
        )
      }
    }

    // Upload videos one by one, each with individual progress
    for (let i = 0; i < videos.length; i++) {
      const video = videos[i]
      if (video.status === 'done') continue

      setVideos((prev) =>
        prev.map((v, idx) => (idx === i ? { ...v, status: 'uploading' } : v)),
      )

      try {
        await uploadFile(video.file, String(id), (progress) => {
          setVideos((prev) =>
            prev.map((v, idx) => (idx === i ? { ...v, progress } : v)),
          )
        })

        setVideos((prev) =>
          prev.map((v, idx) => (idx === i ? { ...v, status: 'done', progress: 100 } : v)),
        )
      } catch (err) {
        setVideos((prev) =>
          prev.map((v, idx) =>
            idx === i
              ? { ...v, status: 'error', error: err instanceof Error ? err.message : 'Blad' }
              : v,
          ),
        )
      }
    }

    setIsUploading(false)
  }

  if (!id) {
    return (
      <div style={styles.container}>
        <p style={styles.hint}>Zapisz klienta przed dodaniem plikow.</p>
      </div>
    )
  }

  const photosProgress =
    photos.length > 0 && photos.some((p) => p.status === 'uploading')
      ? photos.find((p) => p.status === 'uploading')?.progress || 0
      : photos.every((p) => p.status === 'done') && photos.length > 0
        ? 100
        : 0

  const totalPhotoSize = photos.reduce((sum, p) => sum + p.file.size, 0)
  const totalVideoSize = videos.reduce((sum, v) => sum + v.file.size, 0)
  const pendingCount = [...photos, ...videos].filter((f) => f.status === 'pending' || f.status === 'error').length
  const doneCount = [...photos, ...videos].filter((f) => f.status === 'done').length
  const totalCount = photos.length + videos.length

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Wgrywanie plikow klienta</h3>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        style={{
          ...styles.dropZone,
          borderColor: isDragOver ? '#826D4C' : '#d1d5db',
          background: isDragOver ? '#FAF7F2' : '#fafafa',
        }}
      >
        <p style={styles.dropText}>
          Przeciagnij pliki tutaj lub wybierz ponizej
        </p>
        <div style={styles.buttonRow}>
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            disabled={isUploading}
            style={styles.selectBtn}
          >
            + Zdjecia
          </button>
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            disabled={isUploading}
            style={styles.selectBtn}
          >
            + Filmy
          </button>
        </div>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          multiple
          hidden
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {/* Photos section */}
      {photos.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionTitle}>
              Zdjecia ({photos.length}) - {formatSize(totalPhotoSize)}
            </span>
            {!isUploading && (
              <button
                type="button"
                onClick={() => setPhotos([])}
                style={styles.clearBtn}
              >
                Wyczysc
              </button>
            )}
          </div>

          {/* Combined progress bar for photos */}
          {photos.some((p) => p.status === 'uploading' || p.status === 'done') && (
            <div style={styles.progressContainer}>
              <div style={styles.progressBar}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${photosProgress}%`,
                    background: photosProgress === 100 ? '#22c55e' : '#826D4C',
                  }}
                />
              </div>
              <span style={styles.progressText}>{Math.round(photosProgress)}%</span>
            </div>
          )}

          {/* Photo list */}
          <div style={styles.fileList}>
            {photos.map((photo, i) => (
              <div key={`photo-${i}`} style={styles.fileItem}>
                <span style={styles.fileName}>{photo.file.name}</span>
                <span style={styles.fileSize}>{formatSize(photo.file.size)}</span>
                {photo.status === 'done' && <span style={styles.statusDone}>OK</span>}
                {photo.status === 'error' && (
                  <span style={styles.statusError} title={photo.error}>Blad</span>
                )}
                {photo.status === 'pending' && !isUploading && (
                  <button type="button" onClick={() => removePhoto(i)} style={styles.removeBtn}>x</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Videos section */}
      {videos.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionTitle}>
              Filmy ({videos.length}) - {formatSize(totalVideoSize)}
            </span>
            {!isUploading && (
              <button
                type="button"
                onClick={() => setVideos([])}
                style={styles.clearBtn}
              >
                Wyczysc
              </button>
            )}
          </div>

          {/* Individual progress per video */}
          {videos.map((video, i) => (
            <div key={`video-${i}`} style={styles.videoItem}>
              <div style={styles.videoHeader}>
                <span style={styles.fileName}>{video.file.name}</span>
                <span style={styles.fileSize}>{formatSize(video.file.size)}</span>
                {video.status === 'done' && <span style={styles.statusDone}>OK</span>}
                {video.status === 'error' && (
                  <span style={styles.statusError} title={video.error}>Blad</span>
                )}
                {video.status === 'pending' && !isUploading && (
                  <button type="button" onClick={() => removeVideo(i)} style={styles.removeBtn}>x</button>
                )}
              </div>
              {(video.status === 'uploading' || video.status === 'done') && (
                <div style={styles.progressContainer}>
                  <div style={styles.progressBar}>
                    <div
                      style={{
                        ...styles.progressFill,
                        width: `${video.progress}%`,
                        background: video.progress === 100 ? '#22c55e' : '#826D4C',
                      }}
                    />
                  </div>
                  <span style={styles.progressText}>{Math.round(video.progress)}%</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {totalCount > 0 && (
        <div style={styles.footer}>
          {doneCount > 0 && (
            <span style={styles.doneText}>
              Wgrano {doneCount} z {totalCount} plikow
            </span>
          )}
          {pendingCount > 0 && (
            <button
              type="button"
              onClick={startUpload}
              disabled={isUploading}
              style={{
                ...styles.uploadBtn,
                opacity: isUploading ? 0.6 : 1,
                cursor: isUploading ? 'not-allowed' : 'pointer',
              }}
            >
              {isUploading ? 'Wgrywanie...' : `Wgraj ${pendingCount} plikow (${formatSize(totalPhotoSize + totalVideoSize)})`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '16px 0',
    marginBottom: '16px',
  },
  title: {
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: '12px',
    color: '#1a1a1a',
  },
  hint: {
    fontSize: '13px',
    color: '#888',
    fontStyle: 'italic',
  },
  dropZone: {
    border: '2px dashed #d1d5db',
    borderRadius: '8px',
    padding: '32px',
    textAlign: 'center' as const,
    transition: 'all 0.2s',
    marginBottom: '16px',
  },
  dropText: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '12px',
  },
  buttonRow: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
  },
  selectBtn: {
    padding: '8px 20px',
    background: '#826D4C',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
  },
  section: {
    marginBottom: '16px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    padding: '12px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#826D4C',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  clearBtn: {
    fontSize: '12px',
    color: '#ef4444',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  fileList: {
    maxHeight: '200px',
    overflowY: 'auto' as const,
  },
  fileItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 0',
    borderBottom: '1px solid #f3f4f6',
    fontSize: '13px',
  },
  videoItem: {
    padding: '8px 0',
    borderBottom: '1px solid #f3f4f6',
  },
  videoHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    marginBottom: '4px',
  },
  fileName: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    color: '#333',
  },
  fileSize: {
    fontSize: '12px',
    color: '#999',
    whiteSpace: 'nowrap' as const,
  },
  statusDone: {
    fontSize: '12px',
    color: '#22c55e',
    fontWeight: 600,
  },
  statusError: {
    fontSize: '12px',
    color: '#ef4444',
    fontWeight: 600,
    cursor: 'help',
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: '#999',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '0 4px',
  },
  progressContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '4px',
  },
  progressBar: {
    flex: 1,
    height: '6px',
    background: '#e5e7eb',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.3s ease',
  },
  progressText: {
    fontSize: '12px',
    color: '#666',
    minWidth: '36px',
    textAlign: 'right' as const,
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '12px',
  },
  doneText: {
    fontSize: '13px',
    color: '#22c55e',
    fontWeight: 500,
  },
  uploadBtn: {
    padding: '10px 24px',
    background: '#826D4C',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 600,
    transition: 'opacity 0.2s',
  },
}
