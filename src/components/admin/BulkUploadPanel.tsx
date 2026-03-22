'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'

const MAX_CONCURRENT_PHOTOS = 2
const MAX_RETRIES = 2

type UploadStatus = 'pending' | 'uploading' | 'done' | 'error'

interface FileEntry {
  file: File
  status: UploadStatus
  progress: number
  bytesUploaded: number
  startTime?: number
  error?: string
}

interface ExistingFile {
  id: number
  filename: string
  mimeType: string
  filesize: number
  category: string
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function formatEta(seconds: number): string {
  if (seconds <= 0) return '...'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  if (m === 0) return `${s} s`
  return `${m} min ${s} s`
}

// Direct upload with XHR for progress
function uploadDirect(
  file: File,
  clientId: string,
  category: 'photo' | 'video',
  onProgress: (progress: number, bytesUploaded: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/upload/direct')

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress((e.loaded / e.total) * 100, e.loaded)
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        try {
          const err = JSON.parse(xhr.responseText)
          reject(new Error(err.error || `Blad uploadu (${xhr.status})`))
        } catch {
          reject(new Error(`Blad uploadu (${xhr.status})`))
        }
      }
    }

    xhr.onerror = () => reject(new Error('Blad sieci'))

    const formData = new FormData()
    formData.append('file', file)
    formData.append('clientId', clientId)
    formData.append('category', category)
    xhr.send(formData)
  })
}

// Wrapper with retry logic
async function uploadWithRetry(
  file: File,
  clientId: string,
  category: 'photo' | 'video',
  onProgress: (progress: number, bytesUploaded: number) => void,
): Promise<void> {
  let lastError: Error | undefined
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      await uploadDirect(file, clientId, category, onProgress)
      return
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      if (attempt < MAX_RETRIES) {
        // Wait before retry: 2s, 4s
        await new Promise((r) => setTimeout(r, (attempt + 1) * 2000))
        onProgress(0, 0) // Reset progress for retry
      }
    }
  }
  throw lastError
}

// Stream upload for videos — raw body streamed to disk, handles 20GB+ files
function uploadVideo(
  file: File,
  clientId: string,
  onProgress: (progress: number, bytesUploaded: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      clientId,
      filename: file.name,
      mimeType: file.type,
      category: 'video',
    })

    const xhr = new XMLHttpRequest()
    xhr.open('POST', `/api/upload/stream?${params}`)
    xhr.setRequestHeader('Content-Type', 'application/octet-stream')

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress((e.loaded / e.total) * 100, e.loaded)
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        try {
          const err = JSON.parse(xhr.responseText)
          reject(new Error(err.error || `Blad uploadu video (${xhr.status})`))
        } catch {
          reject(new Error(`Blad uploadu video (${xhr.status})`))
        }
      }
    }

    xhr.onerror = () => reject(new Error('Blad sieci'))
    xhr.send(file)
  })
}

export const BulkUploadPanel = () => {
  const docInfo = useDocumentInfo()
  const id = docInfo?.id
  const [photos, setPhotos] = useState<FileEntry[]>([])
  const [videos, setVideos] = useState<FileEntry[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadStats, setUploadStats] = useState({ speed: 0, eta: 0, totalBytesUploaded: 0, totalBytes: 0, filesDone: 0, filesTotal: 0 })
  const uploadStartTimeRef = useRef(0)
  const [existingFiles, setExistingFiles] = useState<ExistingFile[]>([])
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [isDeletingAll, setIsDeletingAll] = useState(false)
  const [playingVideoId, setPlayingVideoId] = useState<number | null>(null)
  const [visiblePhotoCount, setVisiblePhotoCount] = useState(0)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  // Fetch existing files for this client
  const fetchExistingFiles = useCallback(async () => {
    if (!id) return
    setLoadingFiles(true)
    try {
      const res = await fetch(`/api/client-files?where[client][equals]=${id}&limit=500&sort=createdAt`)
      if (res.ok) {
        const data = await res.json()
        setExistingFiles(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (data.docs || []).map((d: any) => ({
            id: d.id,
            filename: d.filename || '',
            mimeType: d.mimeType || '',
            filesize: d.filesize || 0,
            category: d.category || 'photo',
          })),
        )
      }
    } catch {
      // ignore fetch errors
    }
    setLoadingFiles(false)
  }, [id])

  useEffect(() => {
    fetchExistingFiles()
  }, [fetchExistingFiles])

  const handleDeleteAll = async () => {
    if (!confirm(`Usunac WSZYSTKIE pliki tego klienta? (${existingFiles.length} plikow)`)) return
    setIsDeletingAll(true)
    try {
      for (const file of existingFiles) {
        await fetch(`/api/client-files/${file.id}`, { method: 'DELETE' })
      }
      setExistingFiles([])
    } catch {
      // refresh to show what's left
      fetchExistingFiles()
    }
    setIsDeletingAll(false)
  }

  const handleDeleteFile = async (fileId: number) => {
    if (!confirm('Usunac ten plik?')) return
    setDeletingId(fileId)
    try {
      const res = await fetch(`/api/client-files/${fileId}`, { method: 'DELETE' })
      if (res.ok) {
        setExistingFiles((prev) => prev.filter((f) => f.id !== fileId))
      }
    } catch {
      // ignore
    }
    setDeletingId(null)
  }

  const addFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const newPhotos: FileEntry[] = []
    const newVideos: FileEntry[] = []

    for (const file of fileArray) {
      const entry: FileEntry = { file, status: 'pending', progress: 0, bytesUploaded: 0 }
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


  const startUpload = async () => {
    if (!id) return
    setIsUploading(true)

    const pendingPhotos = photos.map((p, i) => ({ idx: i, file: p.file, done: p.status === 'done' })).filter((p) => !p.done)
    const pendingVideos = videos.map((v, i) => ({ idx: i, file: v.file, done: v.status === 'done' })).filter((v) => !v.done)

    const totalBytes = [...pendingPhotos, ...pendingVideos].reduce((sum, f) => sum + f.file.size, 0)
    let completedBytes = 0
    let filesDone = 0
    const filesTotal = pendingPhotos.length + pendingVideos.length
    uploadStartTimeRef.current = Date.now()

    // Track in-progress bytes per concurrent file
    const inProgressBytes = new Map<string, number>()

    const updateStats = () => {
      let inProgress = 0
      for (const v of inProgressBytes.values()) inProgress += v
      const totalUploaded = completedBytes + inProgress
      const elapsed = (Date.now() - uploadStartTimeRef.current) / 1000
      const speed = elapsed > 0 ? totalUploaded / elapsed : 0
      const remaining = totalBytes - totalUploaded
      const eta = speed > 0 ? remaining / speed : 0
      setUploadStats({ speed, eta, totalBytesUploaded: totalUploaded, totalBytes, filesDone, filesTotal })
    }

    // --- Phase 1: Upload photos concurrently (direct, no chunks) ---
    if (pendingPhotos.length > 0) {
      let nextPhoto = 0

      const photoWorker = async () => {
        while (nextPhoto < pendingPhotos.length) {
          const item = pendingPhotos[nextPhoto++]
          const key = `photo-${item.idx}`

          setPhotos((prev) =>
            prev.map((p, idx) => (idx === item.idx ? { ...p, status: 'uploading', startTime: Date.now() } : p)),
          )
          inProgressBytes.set(key, 0)

          try {
            await uploadWithRetry(item.file, String(id), 'photo', (progress, bytesUploaded) => {
              setPhotos((prev) =>
                prev.map((p, idx) => (idx === item.idx ? { ...p, progress, bytesUploaded } : p)),
              )
              inProgressBytes.set(key, bytesUploaded)
              updateStats()
            })

            completedBytes += item.file.size
            filesDone++
            inProgressBytes.delete(key)
            setPhotos((prev) =>
              prev.map((p, idx) =>
                idx === item.idx ? { ...p, status: 'done', progress: 100, bytesUploaded: item.file.size } : p,
              ),
            )
            updateStats()
          } catch (err) {
            inProgressBytes.delete(key)
            setPhotos((prev) =>
              prev.map((p, idx) =>
                idx === item.idx ? { ...p, status: 'error', error: err instanceof Error ? err.message : 'Blad' } : p,
              ),
            )
          }
        }
      }

      const workers = Array.from(
        { length: Math.min(MAX_CONCURRENT_PHOTOS, pendingPhotos.length) },
        () => photoWorker(),
      )
      await Promise.all(workers)
    }

    // --- Phase 2: Upload videos sequentially (chunked) ---
    for (const item of pendingVideos) {
      const key = `video-${item.idx}`

      setVideos((prev) =>
        prev.map((v, idx) => (idx === item.idx ? { ...v, status: 'uploading', startTime: Date.now() } : v)),
      )
      inProgressBytes.set(key, 0)

      try {
        await uploadVideo(item.file, String(id), (progress, bytesUploaded) => {
          setVideos((prev) =>
            prev.map((v, idx) => (idx === item.idx ? { ...v, progress, bytesUploaded } : v)),
          )
          inProgressBytes.set(key, bytesUploaded)
          updateStats()
        })

        completedBytes += item.file.size
        filesDone++
        inProgressBytes.delete(key)
        setVideos((prev) =>
          prev.map((v, idx) =>
            idx === item.idx ? { ...v, status: 'done', progress: 100, bytesUploaded: item.file.size } : v,
          ),
        )
        updateStats()
      } catch (err) {
        inProgressBytes.delete(key)
        setVideos((prev) =>
          prev.map((v, idx) =>
            idx === item.idx ? { ...v, status: 'error', error: err instanceof Error ? err.message : 'Blad' } : v,
          ),
        )
      }
    }

    setIsUploading(false)
    setPhotos((prev) => prev.filter((p) => p.status === 'error'))
    setVideos((prev) => prev.filter((v) => v.status === 'error'))
    fetchExistingFiles()
  }

  if (!id) {
    return (
      <div style={styles.container}>
        <p style={styles.hint}>Zapisz klienta przed dodaniem plikow.</p>
      </div>
    )
  }

  const existingPhotos = existingFiles.filter((f) => f.category === 'photo')
  const existingVideos = existingFiles.filter((f) => f.category === 'video')

  const totalPhotoSize = photos.reduce((sum, p) => sum + p.file.size, 0)
  const totalVideoSize = videos.reduce((sum, v) => sum + v.file.size, 0)
  const pendingCount = [...photos, ...videos].filter((f) => f.status === 'pending' || f.status === 'error').length
  const totalCount = photos.length + videos.length

  return (
    <div style={styles.container}>
      {/* Existing files section */}
      {existingFiles.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ ...styles.title, marginBottom: 0 }}>Wgrane pliki klienta</h3>
            <button
              type="button"
              onClick={handleDeleteAll}
              disabled={isDeletingAll}
              style={{
                padding: '6px 14px',
                background: isDeletingAll ? '#fca5a5' : '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: isDeletingAll ? 'not-allowed' : 'pointer',
              }}
            >
              {isDeletingAll ? 'Usuwanie...' : `Usun wszystkie (${existingFiles.length})`}
            </button>
          </div>

          {existingPhotos.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <span style={styles.sectionTitle}>
                  Zdjecia ({existingPhotos.length}) - {formatSize(existingPhotos.reduce((s, f) => s + f.filesize, 0))}
                </span>
                {visiblePhotoCount === 0 && (
                  <button
                    type="button"
                    onClick={() => setVisiblePhotoCount(100)}
                    style={{ ...styles.selectBtn, padding: '4px 12px', fontSize: '12px' }}
                  >
                    Pokaz podglad
                  </button>
                )}
              </div>
              {visiblePhotoCount > 0 && (
                <>
                  <div style={styles.existingGrid}>
                    {existingPhotos.slice(0, visiblePhotoCount).map((file) => (
                      <div key={file.id} style={styles.existingTile}>
                        <img
                          src={`/api/client-files/file/${file.filename}`}
                          alt={file.filename}
                          style={styles.existingThumb}
                          loading="lazy"
                        />
                        <div style={styles.existingOverlay}>
                          <span style={styles.existingName}>{file.filename}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteFile(file.id)}
                            disabled={deletingId === file.id}
                            style={styles.deleteBtn}
                          >
                            {deletingId === file.id ? '...' : 'x'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {visiblePhotoCount < existingPhotos.length && (
                    <div style={{ textAlign: 'center', marginTop: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setVisiblePhotoCount((prev) => prev + 100)}
                        style={{ ...styles.selectBtn, padding: '6px 16px', fontSize: '12px' }}
                      >
                        Zaladuj wiecej ({Math.min(100, existingPhotos.length - visiblePhotoCount)} z {existingPhotos.length - visiblePhotoCount} pozostalych)
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {existingVideos.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <span style={styles.sectionTitle}>
                  Filmy ({existingVideos.length}) - {formatSize(existingVideos.reduce((s, f) => s + f.filesize, 0))}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {existingVideos.map((file) => {
                  const isPlaying = playingVideoId === file.id
                  return (
                    <div key={file.id} style={{ border: '1px solid #e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
                      {isPlaying && (
                        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000' }}>
                          <video
                            src={`/api/client-files/file/${file.filename}`}
                            style={{ width: '100%', height: '100%' }}
                            controls
                            autoPlay
                          />
                        </div>
                      )}
                      <div style={styles.fileItem}>
                        <button
                          type="button"
                          onClick={() => setPlayingVideoId(isPlaying ? null : file.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#826D4C',
                            fontSize: '16px',
                            padding: '2px 4px',
                          }}
                        >
                          {isPlaying ? '\u23F8' : '\u25B6'}
                        </button>
                        <span style={styles.fileName}>{file.filename}</span>
                        <span style={styles.fileSize}>{formatSize(file.filesize)}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteFile(file.id)}
                          disabled={deletingId === file.id}
                          style={styles.deleteBtn}
                        >
                          {deletingId === file.id ? '...' : 'x'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {loadingFiles && (
        <div style={{ marginBottom: '20px' }}>
          <h3 style={styles.title}>Wgrane pliki klienta</h3>
          <div style={styles.section}>
            <div style={styles.existingGrid}>
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    ...styles.existingTile,
                    background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s infinite',
                  }}
                />
              ))}
            </div>
          </div>
          <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
        </div>
      )}

      {/* Overall upload progress */}
      {isUploading && (
        <div style={{ marginBottom: '16px', padding: '12px', background: '#FAF7F2', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#826D4C' }}>
              Wgrywanie: {uploadStats.filesDone}/{uploadStats.filesTotal} plikow
            </span>
            <span style={{ fontSize: '12px', color: '#666' }}>
              {uploadStats.speed > 0 ? `${formatSize(uploadStats.speed)}/s` : '...'} | ~{formatEta(uploadStats.eta)}
            </span>
          </div>
          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                width: `${uploadStats.totalBytes > 0 ? (uploadStats.totalBytesUploaded / uploadStats.totalBytes) * 100 : 0}%`,
                background: '#826D4C',
              }}
            />
          </div>
          <div style={{ fontSize: '11px', color: '#999', marginTop: '4px', textAlign: 'right' as const }}>
            {formatSize(uploadStats.totalBytesUploaded)} / {formatSize(uploadStats.totalBytes)}
          </div>
        </div>
      )}

      {/* Upload section */}
      <h3 style={styles.title}>Wgrywanie nowych plikow</h3>

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

      {/* Pending files summary */}
      {totalCount > 0 && (
        <div style={styles.section}>
          {photos.length > 0 && (
            <div style={{ ...styles.sectionHeader, marginBottom: photos.some((p) => p.status === 'error') ? '4px' : '0' }}>
              <span style={styles.sectionTitle}>
                Zdjecia ({photos.length}) - {formatSize(totalPhotoSize)}
              </span>
              {!isUploading && (
                <button type="button" onClick={() => setPhotos([])} style={styles.clearBtn}>Wyczysc</button>
              )}
            </div>
          )}
          {photos.filter((p) => p.status === 'error').map((photo, i) => (
            <div key={`photo-err-${i}`} style={{ fontSize: '12px', color: '#ef4444', padding: '2px 0' }}>
              {photo.file.name}: {photo.error}
            </div>
          ))}

          {videos.length > 0 && (
            <div style={{ ...styles.sectionHeader, marginTop: photos.length > 0 ? '8px' : '0', marginBottom: videos.some((v) => v.status === 'error') ? '4px' : '0' }}>
              <span style={styles.sectionTitle}>
                Filmy ({videos.length}) - {formatSize(totalVideoSize)}
              </span>
              {!isUploading && (
                <button type="button" onClick={() => setVideos([])} style={styles.clearBtn}>Wyczysc</button>
              )}
            </div>
          )}
          {videos.filter((v) => v.status === 'error').map((video, i) => (
            <div key={`video-err-${i}`} style={{ fontSize: '12px', color: '#ef4444', padding: '2px 0' }}>
              {video.file.name}: {video.error}
            </div>
          ))}

          {pendingCount > 0 && (
            <div style={{ marginTop: '12px', textAlign: 'right' as const }}>
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
            </div>
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
  fileItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 0',
    borderBottom: '1px solid #f3f4f6',
    fontSize: '13px',
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
  deleteBtn: {
    background: 'none',
    border: '1px solid #ef4444',
    color: '#ef4444',
    cursor: 'pointer',
    fontSize: '12px',
    padding: '2px 8px',
    borderRadius: '3px',
    flexShrink: 0,
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
  existingGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: '8px',
    maxHeight: '300px',
    overflowY: 'auto' as const,
  },
  existingTile: {
    position: 'relative' as const,
    aspectRatio: '1',
    overflow: 'hidden',
    borderRadius: '4px',
    background: '#f3f4f6',
  },
  existingThumb: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  },
  existingOverlay: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
    padding: '4px 6px',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  existingName: {
    fontSize: '10px',
    color: 'white',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    flex: 1,
  },
}

export default BulkUploadPanel
