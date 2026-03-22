import { execFile } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import { mkdir, access, unlink } from 'fs/promises'
import { getPayload } from 'payload'
import config from '@payload-config'

const execFileAsync = promisify(execFile)

/**
 * Generate a thumbnail from a video file using ffmpeg.
 * Extracts a single frame at 1 second into the video.
 */
export async function generateVideoThumbnail(
  inputPath: string,
  outputPath: string,
): Promise<void> {
  await mkdir(path.dirname(outputPath), { recursive: true })

  await execFileAsync('ffmpeg', [
    '-i', inputPath,
    '-ss', '00:00:01',
    '-frames:v', '1',
    '-vf', 'scale=400:400:force_original_aspect_ratio=decrease',
    '-y',
    outputPath,
  ])
}

/**
 * Generate video thumbnail for a ClientFiles document.
 * Fire-and-forget — errors are logged but not thrown.
 */
export async function generateVideoThumbnailForDoc(
  docId: number | string,
  filename: string,
): Promise<void> {
  try {
    const ext = path.extname(filename)
    const base = path.basename(filename, ext)
    const thumbFilename = `${base}-thumb.jpg`

    const videoPath = path.resolve('uploads', 'client-files', filename)
    const thumbPath = path.resolve('uploads', 'client-files', thumbFilename)

    // Check video file exists
    await access(videoPath)

    await generateVideoThumbnail(videoPath, thumbPath)

    // Update the Payload document with thumbnail filename
    const payload = await getPayload({ config })
    await payload.update({
      collection: 'client-files',
      id: docId,
      data: { videoThumbnail: thumbFilename },
    })

    console.log(`Video thumbnail generated: ${thumbFilename}`)
  } catch (err) {
    console.error(`Failed to generate video thumbnail for doc ${docId}:`, err)
    // Clean up partial thumbnail if it exists
    try {
      const ext = path.extname(filename)
      const base = path.basename(filename, ext)
      const thumbPath = path.resolve('uploads', 'client-files', `${base}-thumb.jpg`)
      await unlink(thumbPath)
    } catch {
      // ignore cleanup errors
    }
  }
}
