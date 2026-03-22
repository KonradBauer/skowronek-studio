import { spawn } from 'child_process'
import path from 'path'
import { mkdir, access } from 'fs/promises'
import { getPayload } from 'payload'
import config from '@payload-config'

const HLS_DIR = path.resolve('uploads', 'hls')

/**
 * Transcode a video to HLS format with multiple quality levels.
 * Runs as a background process — updates the document on completion.
 */
export async function transcodeToHLS(
  docId: number | string,
  filename: string,
): Promise<void> {
  const payload = await getPayload({ config })

  try {
    const videoPath = path.resolve('uploads', 'client-files', filename)
    await access(videoPath)

    const outputDir = path.join(HLS_DIR, String(docId))
    await mkdir(outputDir, { recursive: true })

    // Create subdirs for each quality
    await mkdir(path.join(outputDir, 'v0'), { recursive: true })
    await mkdir(path.join(outputDir, 'v1'), { recursive: true })
    await mkdir(path.join(outputDir, 'v2'), { recursive: true })

    // Update status to processing
    await payload.update({
      collection: 'client-files',
      id: docId,
      data: { hlsStatus: 'processing' },
    })

    // Spawn ffmpeg for HLS transcoding
    // 3 quality levels: 720p, 480p, 360p
    const args = [
      '-i', videoPath,
      // Map video and audio streams for each variant
      '-map', '0:v:0', '-map', '0:a:0?',
      '-map', '0:v:0', '-map', '0:a:0?',
      '-map', '0:v:0', '-map', '0:a:0?',
      // Video codec settings
      '-c:v', 'libx264', '-preset', 'fast', '-crf', '22',
      // Audio codec
      '-c:a', 'aac', '-ar', '48000',
      // Stream variant mapping
      '-var_stream_map', 'v:0,a:0 v:1,a:1 v:2,a:2',
      // Quality filters and bitrates
      '-filter:v:0', 'scale=-2:720', '-b:v:0', '2500k', '-maxrate:v:0', '2675k', '-bufsize:v:0', '3750k',
      '-filter:v:1', 'scale=-2:480', '-b:v:1', '1200k', '-maxrate:v:1', '1284k', '-bufsize:v:1', '1800k',
      '-filter:v:2', 'scale=-2:360', '-b:v:2', '600k', '-maxrate:v:2', '642k', '-bufsize:v:2', '900k',
      // HLS settings
      '-f', 'hls',
      '-hls_time', '6',
      '-hls_list_size', '0',
      '-hls_segment_type', 'mpegts',
      '-master_pl_name', 'master.m3u8',
      '-hls_segment_filename', path.join(outputDir, 'v%v/segment-%03d.ts'),
      path.join(outputDir, 'v%v/playlist.m3u8'),
    ]

    await new Promise<void>((resolve, reject) => {
      const proc = spawn('ffmpeg', args, { stdio: 'pipe' })

      let stderr = ''
      proc.stderr?.on('data', (data) => {
        stderr += data.toString()
      })

      proc.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`ffmpeg exited with code ${code}: ${stderr.slice(-500)}`))
        }
      })

      proc.on('error', reject)
    })

    // Update document with HLS info
    const hlsPath = `hls/${docId}/master.m3u8`
    await payload.update({
      collection: 'client-files',
      id: docId,
      data: {
        hlsStatus: 'ready',
        hlsPath,
      },
    })

    console.log(`HLS transcoding complete for doc ${docId}: ${hlsPath}`)
  } catch (err) {
    console.error(`HLS transcoding failed for doc ${docId}:`, err)
    try {
      await payload.update({
        collection: 'client-files',
        id: docId,
        data: { hlsStatus: 'error' },
      })
    } catch {
      // ignore update error
    }
  }
}
